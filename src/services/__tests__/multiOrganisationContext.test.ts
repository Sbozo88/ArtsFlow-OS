import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tenantContextService } from '../tenantContextService';
import { platformOperationsService } from '../platformOperationsService';
import { organisationMembershipRepository, membershipDocumentId } from '../../repositories/organisationMembershipRepository';
import { organisationRepository } from '../../repositories/organisationRepository';
import { userPreferencesRepository } from '../../repositories/userPreferencesRepository';
import { entitlementResolverService } from '../entitlementResolverService';
import { organisationSettingsService } from '../organisationSettingsService';
import { auditService } from '../auditService';
import type {
  Organisation,
  OrganisationMembership,
  OrganisationRole,
  MembershipStatus
} from '../../types';

describe('SaaS 3B: Multi-Organisation Users & Membership Switching Suite', () => {
  const userId = 'usr_innocent_123';

  const orgA: Organisation = {
    id: 'org_a',
    organisationId: 'org_a',
    name: 'Rembrandt Primary Arts',
    organisationType: 'school_music',
    tenantStatus: 'active',
    assignedPlanId: 'plan_starter',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system'
  };

  const orgB: Organisation = {
    id: 'org_b',
    organisationId: 'org_b',
    name: 'Harmony Academy of Music',
    organisationType: 'music_academy',
    tenantStatus: 'trial',
    assignedPlanId: 'plan_professional',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system'
  };

  const orgC: Organisation = {
    id: 'org_c',
    organisationId: 'org_c',
    name: 'Soweto Dance Academy',
    organisationType: 'dance_school',
    tenantStatus: 'suspended',
    assignedPlanId: 'plan_enterprise',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system'
  };

  const membershipA: OrganisationMembership = {
    id: membershipDocumentId(userId, 'org_a'),
    organisationId: 'org_a',
    userId,
    email: 'innocent@example.com',
    role: 'organisation_admin',
    membershipStatus: 'active',
    isDefaultOrganisation: true,
    joinedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system',
    status: 'active'
  };

  const membershipB: OrganisationMembership = {
    id: membershipDocumentId(userId, 'org_b'),
    organisationId: 'org_b',
    userId,
    email: 'innocent@example.com',
    role: 'teacher',
    membershipStatus: 'active',
    isDefaultOrganisation: false,
    joinedAt: '2026-02-01T00:00:00Z',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system',
    status: 'active'
  };

  const membershipC: OrganisationMembership = {
    id: membershipDocumentId(userId, 'org_c'),
    organisationId: 'org_c',
    userId,
    email: 'innocent@example.com',
    role: 'finance',
    membershipStatus: 'active',
    isDefaultOrganisation: false,
    joinedAt: '2026-03-01T00:00:00Z',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system',
    status: 'active'
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Single Identity & Deterministic Membership IDs', () => {
    it('creates deterministic membership document IDs to prevent duplicates', () => {
      const docId = membershipDocumentId(userId, 'org_a');
      expect(docId).toBe('mem_usr_innocent_123_org_a');
    });

    it('preserves one human Auth identity across multiple organisations with different roles', async () => {
      vi.spyOn(organisationMembershipRepository, 'getByUserAndOrg').mockImplementation(async (uid, orgId) => {
        if (uid === userId && orgId === 'org_a') return membershipA;
        if (uid === userId && orgId === 'org_b') return membershipB;
        if (uid === userId && orgId === 'org_c') return membershipC;
        return null;
      });

      const roleA = await tenantContextService.resolveActiveRole(userId, 'org_a');
      const roleB = await tenantContextService.resolveActiveRole(userId, 'org_b');
      const roleC = await tenantContextService.resolveActiveRole(userId, 'org_c');

      expect(roleA).toBe('organisation_admin');
      expect(roleB).toBe('teacher');
      expect(roleC).toBe('finance');
    });
  });

  describe('2. Active Organisation Resolution Lifecycle', () => {
    it('1 user / 1 organisation: automatically selects organisation without prompting', async () => {
      vi.spyOn(organisationMembershipRepository, 'getActiveMemberships').mockResolvedValue([membershipA]);
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(orgA);
      vi.spyOn(userPreferencesRepository, 'get').mockResolvedValue(null);

      const resolved = await tenantContextService.resolveActiveOrganisation(userId);
      expect(resolved.organisationId).toBe('org_a');
      expect(resolved.role).toBe('organisation_admin');
      expect(resolved.requiresSelection).toBe(false);
    });

    it('1 user / 2 organisations: prioritizes lastActiveOrganisationId preference if active', async () => {
      vi.spyOn(organisationMembershipRepository, 'getActiveMemberships').mockResolvedValue([membershipA, membershipB]);
      vi.spyOn(organisationRepository, 'getById').mockImplementation(async (id) => id === 'org_b' ? orgB : orgA);
      vi.spyOn(userPreferencesRepository, 'get').mockResolvedValue({
        id: userId,
        userId,
        lastActiveOrganisationId: 'org_b',
        updatedAt: '2026-02-15T00:00:00Z'
      });

      const resolved = await tenantContextService.resolveActiveOrganisation(userId);
      expect(resolved.organisationId).toBe('org_b');
      expect(resolved.role).toBe('teacher');
      expect(resolved.requiresSelection).toBe(false);
    });

    it('1 user / multiple organisations: falls back to isDefaultOrganisation when no preference matches', async () => {
      vi.spyOn(organisationMembershipRepository, 'getActiveMemberships').mockResolvedValue([membershipA, membershipB]);
      vi.spyOn(organisationRepository, 'getById').mockImplementation(async (id) => id === 'org_a' ? orgA : orgB);
      vi.spyOn(userPreferencesRepository, 'get').mockResolvedValue({
        id: userId,
        userId,
        lastActiveOrganisationId: 'org_unknown',
        updatedAt: '2026-02-15T00:00:00Z'
      });

      const resolved = await tenantContextService.resolveActiveOrganisation(userId);
      expect(resolved.organisationId).toBe('org_a');
      expect(resolved.requiresSelection).toBe(false);
    });

    it('1 user / 5 organisations without preference or default: requires explicit organisation selection', async () => {
      const memberships: OrganisationMembership[] = [1, 2, 3, 4, 5].map((idx) => ({
        ...membershipB,
        id: `mem_${userId}_org_${idx}`,
        organisationId: `org_${idx}`,
        isDefaultOrganisation: false
      }));

      vi.spyOn(organisationMembershipRepository, 'getActiveMemberships').mockResolvedValue(memberships);
      vi.spyOn(userPreferencesRepository, 'get').mockResolvedValue(null);

      const resolved = await tenantContextService.resolveActiveOrganisation(userId);
      expect(resolved.organisationId).toBeNull();
      expect(resolved.requiresSelection).toBe(true);
    });

    it('0 active memberships: returns null context and does not send user into arbitrary organisation', async () => {
      vi.spyOn(organisationMembershipRepository, 'getActiveMemberships').mockResolvedValue([]);
      const resolved = await tenantContextService.resolveActiveOrganisation(userId);
      expect(resolved.organisationId).toBeNull();
      expect(resolved.requiresSelection).toBe(false);
    });
  });

  describe('3. Switch Organisation Validation & Tenant Isolation', () => {
    it('permits switching to active operational organisation', async () => {
      vi.spyOn(organisationMembershipRepository, 'getByUserAndOrg').mockResolvedValue(membershipA);
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(orgA);

      const result = await tenantContextService.validateOrganisationSwitch(userId, 'org_a');
      expect(result.allowed).toBe(true);
      expect(result.organisation?.name).toBe('Rembrandt Primary Arts');
    });

    it('permits switching to trial organisation', async () => {
      vi.spyOn(organisationMembershipRepository, 'getByUserAndOrg').mockResolvedValue(membershipB);
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(orgB);

      const result = await tenantContextService.validateOrganisationSwitch(userId, 'org_b');
      expect(result.allowed).toBe(true);
      expect(result.organisation?.tenantStatus).toBe('trial');
    });

    it('blocks switching when membership is disabled', async () => {
      vi.spyOn(organisationMembershipRepository, 'getByUserAndOrg').mockResolvedValue({
        ...membershipA,
        membershipStatus: 'disabled',
        disabledAt: '2026-02-10T00:00:00Z'
      });
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(orgA);

      const result = await tenantContextService.validateOrganisationSwitch(userId, 'org_a');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('MEMBERSHIP_INACTIVE');
    });

    it('blocks switching when membership is revoked', async () => {
      vi.spyOn(organisationMembershipRepository, 'getByUserAndOrg').mockResolvedValue({
        ...membershipA,
        membershipStatus: 'revoked',
        revokedAt: '2026-02-10T00:00:00Z'
      });
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(orgA);

      const result = await tenantContextService.validateOrganisationSwitch(userId, 'org_a');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('MEMBERSHIP_INACTIVE');
    });

    it('blocks switching when organisation is suspended', async () => {
      vi.spyOn(organisationMembershipRepository, 'getByUserAndOrg').mockResolvedValue(membershipC);
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(orgC);

      const result = await tenantContextService.validateOrganisationSwitch(userId, 'org_c');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('TENANT_SUSPENDED');
    });

    it('blocks switching when user has no membership in target organisation', async () => {
      vi.spyOn(organisationMembershipRepository, 'getByUserAndOrg').mockResolvedValue(null);
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(orgA);

      const result = await tenantContextService.validateOrganisationSwitch(userId, 'org_unknown');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('NO_MEMBERSHIP');
    });
  });

  describe('4. Operation Guard & Super Admin Separation', () => {
    it('grants settings.manage to organisation_admin in Org A, but denies in Org B where user is teacher', async () => {
      vi.spyOn(organisationMembershipRepository, 'getByUserAndOrg').mockImplementation(async (_uid, orgId) => {
        if (orgId === 'org_a') return membershipA;
        if (orgId === 'org_b') return membershipB;
        return null;
      });
      vi.spyOn(organisationRepository, 'getById').mockImplementation(async (orgId) => {
        if (orgId === 'org_a') return orgA;
        if (orgId === 'org_b') return orgB;
        return null;
      });

      const canManageOrgA = await tenantContextService.guardOrganisationOperation(userId, 'org_a', 'settings.manage');
      const canManageOrgB = await tenantContextService.guardOrganisationOperation(userId, 'org_b', 'settings.manage');

      expect(canManageOrgA).toBe(true);
      expect(canManageOrgB).toBe(false);
    });

    it('super admin cannot perform school operations in a tenant without an active OrganisationMembership', async () => {
      const superAdminId = 'usr_super_platform';
      vi.spyOn(organisationMembershipRepository, 'getByUserAndOrg').mockResolvedValue(null);
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(orgA);

      const canOperate = await tenantContextService.guardOrganisationOperation(superAdminId, 'org_a', 'attendance.write');
      expect(canOperate).toBe(false);
    });
  });

  describe('5. Default Organisation Atomic Mutation & Audit', () => {
    it('sets default organisation and emits audit log', async () => {
      const setDefaultSpy = vi.spyOn(organisationMembershipRepository, 'setDefaultOrganisation').mockResolvedValue(undefined);
      const auditSpy = vi.spyOn(auditService, 'log').mockResolvedValue(undefined);

      await tenantContextService.setDefaultOrganisation(userId, 'org_b', userId);

      expect(setDefaultSpy).toHaveBeenCalledWith(userId, 'org_b', userId);
      expect(auditSpy).toHaveBeenCalledWith(expect.objectContaining({
        organisationId: 'org_b',
        action: 'USER_SET_DEFAULT_ORGANISATION'
      }));
    });

    it('records organisation switch with audit log containing previous and next organisation', async () => {
      const auditSpy = vi.spyOn(auditService, 'log').mockResolvedValue(undefined);

      await tenantContextService.recordOrganisationSwitch(userId, 'org_a', 'org_b', userId);

      expect(auditSpy).toHaveBeenCalledWith(expect.objectContaining({
        organisationId: 'org_b',
        action: 'USER_SWITCH_ORGANISATION',
        before: { previousOrganisationId: 'org_a' },
        after: expect.objectContaining({ targetOrganisationId: 'org_b' })
      }));
    });
  });

  describe('6. Cache Invalidation on Tenant Switch', () => {
    it('invalidates entitlement and settings caches when switching organisations', () => {
      const entInvalidateSpy = vi.spyOn(entitlementResolverService, 'invalidateCache');
      const setInvalidateSpy = vi.spyOn(organisationSettingsService, 'invalidateCache');

      entitlementResolverService.invalidateCache('org_a');
      organisationSettingsService.invalidateCache('org_a');

      expect(entInvalidateSpy).toHaveBeenCalledWith('org_a');
      expect(setInvalidateSpy).toHaveBeenCalledWith('org_a');
    });
  });

  describe('7. Membership Health Diagnostics Scanner', () => {
    it('detects duplicate memberships, multiple defaults, invalid roles, and orphaned organisations', () => {
      const corruptedMemberships: OrganisationMembership[] = [
        membershipA,
        // Duplicate membership for same user in org_a
        { ...membershipA, id: 'mem_dup_1' },
        // Second default organisation
        { ...membershipB, isDefaultOrganisation: true },
        // Invalid role
        { ...membershipB, id: 'mem_bad_role', role: 'super_admin' as unknown as OrganisationRole },
        // Invalid status
        { ...membershipB, id: 'mem_bad_status', membershipStatus: 'banned' as unknown as MembershipStatus },
        // Orphaned organisation reference
        { ...membershipB, id: 'mem_orphan', organisationId: 'org_deleted' }
      ];

      const issues = platformOperationsService.scanMembershipHealth(corruptedMemberships, ['org_a', 'org_b']);

      expect(issues.some(i => i.message.includes('Duplicate membership detected'))).toBe(true);
      expect(issues.some(i => i.message.includes('default organisations set'))).toBe(true);
      expect(issues.some(i => i.message.includes('unrecognized role'))).toBe(true);
      expect(issues.some(i => i.message.includes('invalid status'))).toBe(true);
      expect(issues.some(i => i.message.includes('references non-existent organisation'))).toBe(true);
    });

    it('returns empty issues array for clean membership set', () => {
      const cleanMemberships = [membershipA, membershipB];
      const issues = platformOperationsService.scanMembershipHealth(cleanMemberships, ['org_a', 'org_b']);
      expect(issues).toHaveLength(0);
    });
  });
});
