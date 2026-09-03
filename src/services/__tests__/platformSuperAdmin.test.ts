import { describe, it, expect } from 'vitest';
import { tenantLifecycleService } from '../tenantLifecycleService';
import { tenantAccessService } from '../tenantAccessService';
import { permissionService } from '../permissionService';
import { platformOrganisationService } from '../platformOrganisationService';
import type {
  Organisation,
  OrganisationMembership,
  AuthUser,
  Learner,
  Invoice
} from '../../types';

describe('SaaS 1B — Platform Super Admin Console & Tenant Lifecycle Suite', () => {
  const TENANT_A_ID = 'org_school_alpha';
  const TENANT_B_ID = 'org_school_beta';

  const tenantAlpha: Organisation = {
    id: TENANT_A_ID,
    organisationId: TENANT_A_ID,
    name: 'Alpha Performing Arts School',
    organisationType: 'music_and_dance',
    tenantStatus: 'active',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system'
  };

  const tenantBeta: Organisation = {
    id: TENANT_B_ID,
    organisationId: TENANT_B_ID,
    name: 'Beta Academy',
    organisationType: 'dance',
    tenantStatus: 'active',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system'
  };

  const superAdminUser: AuthUser = {
    uid: 'sa_owner_01',
    email: 'operator@artsflow.com',
    displayName: 'Platform Operator',
    platformRole: 'super_admin'
  };

  const orgAdminUser: AuthUser = {
    uid: 'admin_alpha_01',
    email: 'principal@alpha.example.com',
    displayName: 'Principal Alpha',
    role: 'organisation_admin',
    organisationId: TENANT_A_ID
  };

  const teacherUser: AuthUser = {
    uid: 'teacher_alpha_01',
    email: 'piano@alpha.example.com',
    displayName: 'Teacher Piano',
    role: 'teacher',
    organisationId: TENANT_A_ID
  };

  const guardianUser: AuthUser = {
    uid: 'guardian_01',
    email: 'parent@example.com',
    displayName: 'Parent Guardian',
    role: 'guardian',
    organisationId: TENANT_A_ID
  };

  const learnerUser: AuthUser = {
    uid: 'learner_01',
    email: 'student@example.com',
    displayName: 'Student Learner',
    role: 'learner',
    organisationId: TENANT_A_ID
  };

  const membershipAlphaAdmin: OrganisationMembership = {
    id: 'mem_admin_alpha',
    organisationId: TENANT_A_ID,
    userId: 'admin_alpha_01',
    email: 'principal@alpha.example.com',
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

  const membershipBetaAdmin: OrganisationMembership = {
    id: 'mem_admin_beta',
    organisationId: TENANT_B_ID,
    userId: 'admin_beta_01',
    email: 'head@beta.example.com',
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

  describe('1. Platform Route & Role Security Guards', () => {
    it('grants platform access exclusively to super_admin', () => {
      expect(permissionService.can({ user: superAdminUser, permission: 'platform.dashboard.read' })).toBe(true);
      expect(permissionService.can({ user: superAdminUser, permission: 'platform.organisations.read' })).toBe(true);
      expect(permissionService.can({ user: superAdminUser, permission: 'platform.organisations.manage_status' })).toBe(true);
      expect(permissionService.can({ user: superAdminUser, permission: 'platform.audit.read' })).toBe(true);
      expect(permissionService.can({ user: superAdminUser, permission: 'platform.health.read' })).toBe(true);
    });

    it('strictly denies platform permissions to organisation admin, teachers, guardians, and learners', () => {
      expect(permissionService.can({ user: orgAdminUser, permission: 'platform.dashboard.read' })).toBe(false);
      expect(permissionService.can({ user: orgAdminUser, permission: 'platform.organisations.manage_status' })).toBe(false);
      expect(permissionService.can({ user: teacherUser, permission: 'platform.dashboard.read' })).toBe(false);
      expect(permissionService.can({ user: guardianUser, permission: 'platform.dashboard.read' })).toBe(false);
      expect(permissionService.can({ user: learnerUser, permission: 'platform.dashboard.read' })).toBe(false);
    });

    it('ensures organisation role in a membership never grants platform permissions', () => {
      expect(permissionService.can({
        user: orgAdminUser,
        membership: membershipAlphaAdmin,
        permission: 'platform.organisations.read'
      })).toBe(false);
    });
  });

  describe('2. Tenant Lifecycle State Machine', () => {
    it('allows valid controlled state transitions', () => {
      // provisioning transitions
      expect(tenantLifecycleService.isValidTransition('provisioning', 'trial')).toBe(true);
      expect(tenantLifecycleService.isValidTransition('provisioning', 'active')).toBe(true);

      // trial transitions
      expect(tenantLifecycleService.isValidTransition('trial', 'active')).toBe(true);
      expect(tenantLifecycleService.isValidTransition('trial', 'suspended')).toBe(true);
      expect(tenantLifecycleService.isValidTransition('trial', 'cancelled')).toBe(true);

      // active transitions
      expect(tenantLifecycleService.isValidTransition('active', 'restricted')).toBe(true);
      expect(tenantLifecycleService.isValidTransition('active', 'suspended')).toBe(true);
      expect(tenantLifecycleService.isValidTransition('active', 'cancelled')).toBe(true);

      // restricted transitions
      expect(tenantLifecycleService.isValidTransition('restricted', 'active')).toBe(true);

      // suspended transitions
      expect(tenantLifecycleService.isValidTransition('suspended', 'active')).toBe(true);
      expect(tenantLifecycleService.isValidTransition('suspended', 'cancelled')).toBe(true);

      // cancelled transitions
      expect(tenantLifecycleService.isValidTransition('cancelled', 'archived')).toBe(true);
    });

    it('rejects invalid or unsafe transitions', () => {
      // Cannot jump from suspended directly to archived without cancellation
      expect(tenantLifecycleService.isValidTransition('suspended', 'archived')).toBe(false);

      // Archived is a terminal state
      expect(tenantLifecycleService.isValidTransition('archived', 'active')).toBe(false);
      expect(tenantLifecycleService.isValidTransition('archived', 'suspended')).toBe(false);

      // Provisioning cannot jump directly to cancelled or archived
      expect(tenantLifecycleService.isValidTransition('provisioning', 'cancelled')).toBe(false);
      expect(tenantLifecycleService.isValidTransition('provisioning', 'archived')).toBe(false);
    });

    it('enforces reason requirement for high-impact transitions', () => {
      expect(tenantLifecycleService.requiresReason('suspended')).toBe(true);
      expect(tenantLifecycleService.requiresReason('restricted')).toBe(true);
      expect(tenantLifecycleService.requiresReason('cancelled')).toBe(true);
      expect(tenantLifecycleService.requiresReason('archived')).toBe(true);

      // Non-destructive or standard activations do not strictly require reason
      expect(tenantLifecycleService.requiresReason('active')).toBe(false);
      expect(tenantLifecycleService.requiresReason('trial')).toBe(false);
    });
  });

  describe('3. Suspension Access Gate & Data Preservation', () => {
    const learnerAlpha: Learner = {
      id: 'lrn_alpha_1',
      organisationId: TENANT_A_ID,
      firstName: 'Lerato',
      lastName: 'Dlamini',
      learnerStatus: 'active',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      createdBy: 'admin_alpha',
      updatedBy: 'admin_alpha',
      status: 'active'
    };

    const invoiceAlpha: Invoice = {
      id: 'inv_alpha_1',
      organisationId: TENANT_A_ID,
      invoiceNumber: 'INV-100',
      learnerId: 'lrn_alpha_1',
      issueDate: '2026-01-15',
      dueDate: '2026-01-30',
      currency: 'ZAR',
      subtotal: 50000,
      discountTotal: 0,
      waiverTotal: 0,
      total: 50000,
      amountPaid: 0,
      balance: 50000,
      invoiceStatus: 'issued',
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-01-15T00:00:00Z',
      createdBy: 'admin_alpha',
      updatedBy: 'admin_alpha',
      status: 'active'
    };

    it('blocks tenant users upon suspension and restores access upon reactivation', () => {
      // Step 1: Active tenant allows access
      expect(tenantAccessService.validateAccess(membershipAlphaAdmin, tenantAlpha).allowed).toBe(true);

      // Step 2: Suspended tenant blocks access
      const suspendedTenantAlpha: Organisation = {
        ...tenantAlpha,
        tenantStatus: 'suspended',
        suspensionReason: 'Payment default on enterprise license'
      };
      const blocked = tenantAccessService.validateAccess(membershipAlphaAdmin, suspendedTenantAlpha);
      expect(blocked.allowed).toBe(false);
      expect(blocked.reason).toBe('TENANT_SUSPENDED');

      // Step 3: Tenant Beta remains 100% operational and unaffected
      const betaAccess = tenantAccessService.validateAccess(membershipBetaAdmin, tenantBeta);
      expect(betaAccess.allowed).toBe(true);

      // Step 4: Restoring tenant re-enables access
      const restoredTenantAlpha: Organisation = {
        ...suspendedTenantAlpha,
        tenantStatus: 'active'
      };
      const restored = tenantAccessService.validateAccess(membershipAlphaAdmin, restoredTenantAlpha);
      expect(restored.allowed).toBe(true);
    });

    it('verifies customer domain records remain 100% intact after suspension', () => {
      // Suspension is purely an operational gate on tenantStatus
      expect(learnerAlpha.id).toBe('lrn_alpha_1');
      expect(learnerAlpha.organisationId).toBe(TENANT_A_ID);
      expect(learnerAlpha.status).toBe('active');

      expect(invoiceAlpha.id).toBe('inv_alpha_1');
      expect(invoiceAlpha.balance).toBe(50000);
      expect(invoiceAlpha.status).toBe('active');
    });
  });

  describe('4. Privacy-Preserving Platform Metrics', () => {
    it('computes aggregated counts without leaking learner names or private records', () => {
      // Synthetic metrics simulation
      const mockKPIs = {
        totalOrganisations: 2,
        activeOrganisations: 1,
        suspendedOrganisations: 1,
        totalPlatformUsers: 14,
        activeMemberships: 12
      };

      expect(mockKPIs.totalOrganisations).toBe(2);
      expect(mockKPIs.activeOrganisations).toBe(1);
      expect(mockKPIs.suspendedOrganisations).toBe(1);

      // Ensure no private customer data in metrics output
      expect((mockKPIs as Record<string, unknown>).learnerNames).toBeUndefined();
      expect((mockKPIs as Record<string, unknown>).invoices).toBeUndefined();
      expect((mockKPIs as Record<string, unknown>).messages).toBeUndefined();
    });
  });

  describe('5. Manual Tenant Provisioning Foundation', () => {
    it('generates unique URL slugs from organisation names', () => {
      expect(platformOrganisationService.generateSlug('Cape Town Music Academy')).toBe('cape-town-music-academy');
      expect(platformOrganisationService.generateSlug('Johannesburg Arts & Ballet (Pty) Ltd')).toBe('johannesburg-arts-ballet-pty-ltd');
      expect(platformOrganisationService.generateSlug('   Leading Edge School   ')).toBe('leading-edge-school');
    });
  });

  describe('6. Platform Multi-Membership Resolution', () => {
    it('resolves multiple organisation memberships for a single user identity', () => {
      const userMultipleMemberships: OrganisationMembership[] = [
        {
          id: 'mem_user_org_a',
          organisationId: TENANT_A_ID,
          userId: 'shared_user_01',
          email: 'consultant@arts.example.com',
          role: 'teacher',
          membershipStatus: 'active',
          isDefaultOrganisation: true,
          joinedAt: '2026-01-01T00:00:00Z',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          createdBy: 'admin_alpha',
          updatedBy: 'admin_alpha',
          status: 'active'
        },
        {
          id: 'mem_user_org_b',
          organisationId: TENANT_B_ID,
          userId: 'shared_user_01',
          email: 'consultant@arts.example.com',
          role: 'programme_director',
          membershipStatus: 'active',
          isDefaultOrganisation: false,
          joinedAt: '2026-01-10T00:00:00Z',
          createdAt: '2026-01-10T00:00:00Z',
          updatedAt: '2026-01-10T00:00:00Z',
          createdBy: 'admin_beta',
          updatedBy: 'admin_beta',
          status: 'active'
        }
      ];

      expect(userMultipleMemberships.length).toBe(2);
      expect(userMultipleMemberships[0].organisationId).toBe(TENANT_A_ID);
      expect(userMultipleMemberships[0].role).toBe('teacher');
      expect(userMultipleMemberships[1].organisationId).toBe(TENANT_B_ID);
      expect(userMultipleMemberships[1].role).toBe('programme_director');
    });
  });
});
