import { organisationRepository } from '../repositories/organisationRepository';
import { organisationMembershipRepository } from '../repositories/organisationMembershipRepository';
import { userPreferencesRepository } from '../repositories/userPreferencesRepository';
import { tenantAccessService } from './tenantAccessService';
import { permissionService } from './permissionService';
import { auditService } from './auditService';
import type {
  Organisation,
  OrganisationMembership,
  OrganisationRole,
  Permission
} from '../types';

export interface SwitchValidationResult {
  allowed: boolean;
  reason?: 'NO_MEMBERSHIP' | 'MEMBERSHIP_INACTIVE' | 'TENANT_SUSPENDED' | 'INVALID_USER' | 'INVALID_ORGANISATION';
  membership?: OrganisationMembership;
  organisation?: Organisation;
}

export interface ResolvedTenantContext {
  organisation: Organisation | null;
  organisationId: string | null;
  membership: OrganisationMembership | null;
  role: OrganisationRole | null;
  requiresSelection: boolean;
}

export class TenantContextService {
  /**
   * Validates whether a user can switch to a target organisation.
   * Checks membership existence, user ID match, active status, and organisation operational status.
   */
  async validateOrganisationSwitch(userId: string, targetOrganisationId: string): Promise<SwitchValidationResult> {
    if (!userId || !targetOrganisationId) {
      return { allowed: false, reason: 'INVALID_USER' };
    }

    const [membership, organisation] = await Promise.all([
      organisationMembershipRepository.getByUserAndOrg(userId, targetOrganisationId),
      organisationRepository.getById(targetOrganisationId)
    ]);

    if (!membership || membership.userId !== userId || membership.organisationId !== targetOrganisationId) {
      return { allowed: false, reason: 'NO_MEMBERSHIP' };
    }

    if (membership.membershipStatus !== 'active') {
      return { allowed: false, reason: 'MEMBERSHIP_INACTIVE', membership };
    }

    if (!organisation) {
      return { allowed: false, reason: 'INVALID_ORGANISATION' };
    }

    const access = tenantAccessService.validateAccess(membership, organisation);
    if (!access.allowed) {
      return {
        allowed: false,
        reason: access.reason === 'TENANT_SUSPENDED' ? 'TENANT_SUSPENDED' : 'MEMBERSHIP_INACTIVE',
        membership,
        organisation
      };
    }

    return { allowed: true, membership, organisation };
  }

  /**
   * Resolves the active organisation for a user from their active memberships,
   * user preferences (lastActiveOrganisationId), and default organisation setting.
   */
  async resolveActiveOrganisation(
    userId: string,
    requestedOrgId?: string | null
  ): Promise<ResolvedTenantContext> {
    const memberships = await organisationMembershipRepository.getActiveMemberships(userId);
    const active = memberships.filter((m) => m.membershipStatus === 'active');

    if (active.length === 0) {
      return {
        organisation: null,
        organisationId: null,
        membership: null,
        role: null,
        requiresSelection: false
      };
    }

    let targetMembership: OrganisationMembership | null = null;

    // 1. Explicit target requested
    if (requestedOrgId) {
      targetMembership = active.find((m) => m.organisationId === requestedOrgId) || null;
    }

    // 2. Preferences fallback (lastActiveOrganisationId)
    if (!targetMembership) {
      const preferences = await userPreferencesRepository.get(userId).catch(() => null);
      if (preferences?.lastActiveOrganisationId) {
        targetMembership = active.find((m) => m.organisationId === preferences.lastActiveOrganisationId) || null;
      }
    }

    // 3. Default organisation fallback
    if (!targetMembership) {
      targetMembership = active.find((m) => m.isDefaultOrganisation) || null;
    }

    // 4. Single organisation auto-select
    if (!targetMembership && active.length === 1) {
      targetMembership = active[0];
    }

    // 5. Multiple organisations without valid default/preference -> requires explicit selection
    if (!targetMembership && active.length > 1) {
      return {
        organisation: null,
        organisationId: null,
        membership: null,
        role: null,
        requiresSelection: true
      };
    }

    if (!targetMembership) {
      return {
        organisation: null,
        organisationId: null,
        membership: null,
        role: null,
        requiresSelection: false
      };
    }

    const organisation = await organisationRepository.getById(targetMembership.organisationId);
    return {
      organisation,
      organisationId: targetMembership.organisationId,
      membership: targetMembership,
      role: targetMembership.role as OrganisationRole,
      requiresSelection: false
    };
  }

  /**
   * Resolves the authoritative role for a user within a specific organisation.
   */
  async resolveActiveRole(userId: string, organisationId: string): Promise<OrganisationRole | null> {
    const membership = await organisationMembershipRepository.getByUserAndOrg(userId, organisationId);
    if (!membership || membership.membershipStatus !== 'active') return null;
    return membership.role as OrganisationRole;
  }

  /**
   * Guards a tenant operation by verifying the user's active membership in the target organisation
   * and checking their permission.
   */
  async guardOrganisationOperation(
    userId: string,
    organisationId: string,
    requiredPermission: Permission
  ): Promise<boolean> {
    const validation = await this.validateOrganisationSwitch(userId, organisationId);
    if (!validation.allowed || !validation.membership || !validation.organisation) {
      return false;
    }

    return permissionService.can({
      membership: validation.membership,
      activeOrganisation: validation.organisation,
      permission: requiredPermission
    });
  }

  /**
   * Sets a user's default organisation safely with audit logging.
   */
  async setDefaultOrganisation(userId: string, organisationId: string, actorId: string): Promise<void> {
    await organisationMembershipRepository.setDefaultOrganisation(userId, organisationId, actorId);
    await auditService.log({
      organisationId,
      actorId,
      action: 'USER_SET_DEFAULT_ORGANISATION',
      entityType: 'organisationMembership',
      entityId: `mem_${userId}_${organisationId}`,
      after: { isDefaultOrganisation: true }
    });
  }

  /**
   * Records a user switching organisation with audit logging.
   */
  async recordOrganisationSwitch(
    userId: string,
    fromOrgId: string | null,
    toOrgId: string,
    actorId: string
  ): Promise<void> {
    await auditService.log({
      organisationId: toOrgId,
      actorId,
      action: 'USER_SWITCH_ORGANISATION',
      entityType: 'organisation',
      entityId: toOrgId,
      before: { previousOrganisationId: fromOrgId },
      after: { targetOrganisationId: toOrgId, userId }
    });
  }
}

export const tenantContextService = new TenantContextService();
