import type { Organisation, OrganisationMembership, TenantStatus } from '../types';

export class TenantAccessService {
  /**
   * Determines whether a tenant organisation status allows normal application operations.
   * By default, missing status or undefined is treated as 'active' for legacy v1.0 compatibility.
   */
  isTenantOperational(tenantStatus?: TenantStatus | string): boolean {
    if (!tenantStatus) return true; // Legacy organisations default to active operational state
    switch (tenantStatus) {
      case 'active':
      case 'provisioning':
      case 'trial':
        return true;
      case 'restricted':
      case 'suspended':
      case 'cancelled':
      case 'archived':
      default:
        return false;
    }
  }

  /**
   * Validates whether an actor with a given membership is permitted to operate within an organisation.
   */
  validateAccess(
    membership: OrganisationMembership | null | undefined,
    organisation?: Organisation | null
  ): { allowed: boolean; reason?: 'NO_MEMBERSHIP' | 'MEMBERSHIP_INACTIVE' | 'TENANT_SUSPENDED' } {
    if (!membership) {
      return { allowed: false, reason: 'NO_MEMBERSHIP' };
    }

    if (membership.membershipStatus !== 'active') {
      return { allowed: false, reason: 'MEMBERSHIP_INACTIVE' };
    }

    if (organisation && !this.isTenantOperational(organisation.tenantStatus)) {
      return { allowed: false, reason: 'TENANT_SUSPENDED' };
    }

    return { allowed: true };
  }

  /**
   * Determines whether an organisation admin retains safe read-only access (e.g. to billing)
   * while the tenant is in restricted status.
   */
  isReadOnlyAdminAccess(tenantStatus?: TenantStatus | string, role?: string): boolean {
    return tenantStatus === 'restricted' && role === 'organisation_admin';
  }
}

export const tenantAccessService = new TenantAccessService();
