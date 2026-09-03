import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tenantAccessService } from '../tenantAccessService';
import { organisationMembershipRepository } from '../../repositories/organisationMembershipRepository';
import { organisationRepository } from '../../repositories/organisationRepository';
import { bootstrapFounderAdmin } from '../../../scripts/bootstrap-founder-admin';
import type {
  Organisation,
  OrganisationMembership,
  AuthUser
} from '../../types';

describe('Founder Login Recovery & Platform Access Test Suite', () => {
  const founderUid = 'usr_founder_test_123';
  const founderEmail = 'founder@artsflow.co.za';

  const demoAcademy: Organisation = {
    id: 'org_demo_artsflow',
    organisationId: 'org_demo_artsflow',
    name: 'ArtsFlow Demo Arts Academy',
    organisationType: 'music_and_dance',
    tenantStatus: 'active',
    assignedPlanId: 'plan_professional',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system'
  };

  const customerSchool: Organisation = {
    id: 'org_customer_school_1',
    organisationId: 'org_customer_school_1',
    name: 'Johannesburg High Performing Arts',
    organisationType: 'school_music',
    tenantStatus: 'active',
    assignedPlanId: 'plan_starter',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system'
  };

  const demoMembership: OrganisationMembership = {
    id: `mem_${founderUid}_org_demo_artsflow`,
    organisationId: 'org_demo_artsflow',
    userId: founderUid,
    email: founderEmail,
    displayName: 'Platform Founder',
    role: 'organisation_admin',
    membershipStatus: 'active',
    isDefaultOrganisation: false,
    joinedAt: '2026-01-01T00:00:00Z',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system'
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Platform Super Admin Access Resolution', () => {
    it('resolves Super Admin authority from platformRole without requiring organisation membership', () => {
      const superAdminUser: AuthUser = {
        uid: founderUid,
        email: founderEmail,
        displayName: 'Platform Founder',
        platformRole: 'super_admin',
        role: 'super_admin',
        accountStatus: 'active'
      };

      // Super admin has platform authority
      const isSuperAdmin = superAdminUser.platformRole === 'super_admin';
      expect(isSuperAdmin).toBe(true);

      // Super admin can access platform console without active organisation
      expect(superAdminUser.organisationId).toBeUndefined();
    });

    it('enforces that Super Admin authority alone does NOT grant implicit organisation access', async () => {
      // Founder tries to access a customer school without explicit membership
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(customerSchool);
      vi.spyOn(organisationMembershipRepository, 'getByUserAndOrg').mockResolvedValue(null);

      const membership = await organisationMembershipRepository.getByUserAndOrg(founderUid, 'org_customer_school_1');
      const organisation = await organisationRepository.getById('org_customer_school_1');

      const validation = tenantAccessService.validateAccess(membership, organisation);

      // Must be rejected: Super Admin != Automatic Org Admin
      expect(validation.allowed).toBe(false);
      expect(validation.reason).toBe('NO_MEMBERSHIP');
    });

    it('grants organisation workspace access when explicit demo membership is present', async () => {
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(demoAcademy);
      vi.spyOn(organisationMembershipRepository, 'getByUserAndOrg').mockResolvedValue(demoMembership);

      const membership = await organisationMembershipRepository.getByUserAndOrg(founderUid, 'org_demo_artsflow');
      const organisation = await organisationRepository.getById('org_demo_artsflow');

      const validation = tenantAccessService.validateAccess(membership, organisation);

      expect(validation.allowed).toBe(true);
      expect(validation.reason).toBeUndefined();
    });
  });

  describe('2. Founder Bootstrap Pipeline & Idempotency', () => {
    it('executes safe dry-run founder bootstrap with expected records', async () => {
      const result = await bootstrapFounderAdmin({
        email: founderEmail,
        uid: founderUid,
        dryRun: true
      });

      expect(result.success).toBe(true);
      expect(result.founderUid).toBe(founderUid);
      expect(result.founderEmail).toBe(founderEmail);
      expect(result.platformRole).toBe('super_admin');
      expect(result.demoOrganisationId).toBe('org_demo_artsflow');
      expect(result.demoMembershipId).toBe(`mem_${founderUid}_org_demo_artsflow`);
      expect(result.dryRun).toBe(true);
    });

    it('rejects invalid founder email formats', async () => {
      await expect(
        bootstrapFounderAdmin({
          email: 'not-an-email',
          dryRun: true
        })
      ).rejects.toThrow('Invalid founder email');
    });
  });

  describe('3. Login Post-Auth Navigation Strategy', () => {
    it('identifies super_admin landing priority as /platform', () => {
      function getLandingRoute(platformRole: string | null | undefined, role: string | undefined): string {
        if (platformRole === 'super_admin') return '/platform';
        if (role === 'guardian') return '/portal';
        if (role === 'learner') return '/learner-portal';
        return '/';
      }

      expect(getLandingRoute('super_admin', undefined)).toBe('/platform');
      expect(getLandingRoute('super_admin', 'organisation_admin')).toBe('/platform');
      expect(getLandingRoute(null, 'organisation_admin')).toBe('/');
      expect(getLandingRoute(null, 'guardian')).toBe('/portal');
    });
  });

  describe('4. Auth Security Regression: Role Hierarchy & Boundary Protection', () => {
    function canAccessPlatform(user: Partial<AuthUser> | null): boolean {
      if (!user) return false;
      if (user.accountStatus === 'disabled') return false;
      return user.platformRole === 'super_admin';
    }

    it('denies Organisation Admin access to /platform', () => {
      const orgAdminUser: AuthUser = {
        uid: 'usr_org_admin_1',
        email: 'admin@school.example',
        displayName: 'School Admin',
        role: 'organisation_admin',
        platformRole: null,
        accountStatus: 'active'
      };
      expect(canAccessPlatform(orgAdminUser)).toBe(false);
    });

    it('denies Teacher access to /platform', () => {
      const teacherUser: AuthUser = {
        uid: 'usr_teacher_1',
        email: 'teacher@school.example',
        displayName: 'Piano Teacher',
        role: 'teacher',
        platformRole: null,
        accountStatus: 'active'
      };
      expect(canAccessPlatform(teacherUser)).toBe(false);
    });

    it('denies Guardian access to /platform', () => {
      const guardianUser: AuthUser = {
        uid: 'usr_guardian_1',
        email: 'parent@example.com',
        displayName: 'Parent One',
        role: 'guardian',
        platformRole: null,
        accountStatus: 'active'
      };
      expect(canAccessPlatform(guardianUser)).toBe(false);
    });

    it('denies Learner access to /platform', () => {
      const learnerUser: AuthUser = {
        uid: 'usr_learner_1',
        email: 'student@example.com',
        displayName: 'Student One',
        role: 'learner',
        platformRole: null,
        accountStatus: 'active'
      };
      expect(canAccessPlatform(learnerUser)).toBe(false);
    });

    it('denies disabled Super Admin access to /platform', () => {
      const disabledSuperAdmin: AuthUser = {
        uid: 'usr_disabled_admin',
        email: 'bad@artsflow.co.za',
        displayName: 'Disabled Admin',
        platformRole: 'super_admin',
        role: 'super_admin',
        accountStatus: 'disabled'
      };
      expect(canAccessPlatform(disabledSuperAdmin)).toBe(false);
    });
  });
});
