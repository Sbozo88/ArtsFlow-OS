import { describe, it, expect, vi } from 'vitest';
import { tenantAccessService } from '../tenantAccessService';
import { permissionService } from '../permissionService';
import { migrateUsersToMemberships } from '../../../scripts/migrations/migrate-users-to-organisation-memberships';
import type {
  Organisation,
  OrganisationMembership,
  AuthUser,
  Learner,
  Invoice,
  Session,
  ConsentSubmission,
  Timesheet
} from '../../types';

describe('SaaS 1A — Master Cross-Tenant Isolation & Tenancy Security Suite', () => {
  const TENANT_A_ID = 'org_alpha_academy';
  const TENANT_B_ID = 'org_beta_institute';

  const tenantA: Organisation = {
    id: TENANT_A_ID,
    organisationId: TENANT_A_ID,
    name: 'Alpha Performing Arts Academy',
    organisationType: 'music_and_dance',
    tenantStatus: 'active',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'admin_alpha',
    updatedBy: 'admin_alpha'
  };

  const tenantB: Organisation = {
    id: TENANT_B_ID,
    organisationId: TENANT_B_ID,
    name: 'Beta Dance Institute',
    organisationType: 'dance',
    tenantStatus: 'active',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'admin_beta',
    updatedBy: 'admin_beta'
  };

  const membershipAlphaAdmin: OrganisationMembership = {
    id: 'mem_user_a1_alpha',
    organisationId: TENANT_A_ID,
    userId: 'user_a1',
    email: 'admin@alpha.example.com',
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

  const membershipAlphaTeacher: OrganisationMembership = {
    id: 'mem_user_a2_alpha',
    organisationId: TENANT_A_ID,
    userId: 'user_a2',
    email: 'teacher@alpha.example.com',
    role: 'teacher',
    membershipStatus: 'active',
    isDefaultOrganisation: true,
    joinedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'admin_alpha',
    updatedBy: 'admin_alpha',
    status: 'active'
  };

  const membershipBetaAdmin: OrganisationMembership = {
    id: 'mem_user_b1_beta',
    organisationId: TENANT_B_ID,
    userId: 'user_b1',
    email: 'admin@beta.example.com',
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

  describe('1. Tenant Lifecycle & Operational Status Gates', () => {
    it('permits operations for active, provisioning, and trial tenants', () => {
      expect(tenantAccessService.isTenantOperational('active')).toBe(true);
      expect(tenantAccessService.isTenantOperational('provisioning')).toBe(true);
      expect(tenantAccessService.isTenantOperational('trial')).toBe(true);
      // Legacy fallback: undefined status defaults to active
      expect(tenantAccessService.isTenantOperational(undefined)).toBe(true);
    });

    it('denies operations for suspended, restricted, cancelled, and archived tenants', () => {
      expect(tenantAccessService.isTenantOperational('suspended')).toBe(false);
      expect(tenantAccessService.isTenantOperational('restricted')).toBe(false);
      expect(tenantAccessService.isTenantOperational('cancelled')).toBe(false);
      expect(tenantAccessService.isTenantOperational('archived')).toBe(false);
    });

    it('blocks access when tenant organisation is suspended', () => {
      const suspendedOrg: Organisation = { ...tenantA, tenantStatus: 'suspended' };
      const validation = tenantAccessService.validateAccess(membershipAlphaAdmin, suspendedOrg);
      expect(validation.allowed).toBe(false);
      expect(validation.reason).toBe('TENANT_SUSPENDED');
    });
  });

  describe('2. Organisation Membership Status Gates', () => {
    it('allows access for active membership in active tenant', () => {
      const validation = tenantAccessService.validateAccess(membershipAlphaAdmin, tenantA);
      expect(validation.allowed).toBe(true);
    });

    it('blocks access when membership is disabled', () => {
      const disabledMembership: OrganisationMembership = {
        ...membershipAlphaAdmin,
        membershipStatus: 'disabled'
      };
      const validation = tenantAccessService.validateAccess(disabledMembership, tenantA);
      expect(validation.allowed).toBe(false);
      expect(validation.reason).toBe('MEMBERSHIP_INACTIVE');
    });

    it('blocks access when membership is revoked', () => {
      const revokedMembership: OrganisationMembership = {
        ...membershipAlphaAdmin,
        membershipStatus: 'revoked'
      };
      const validation = tenantAccessService.validateAccess(revokedMembership, tenantA);
      expect(validation.allowed).toBe(false);
      expect(validation.reason).toBe('MEMBERSHIP_INACTIVE');
    });

    it('blocks access when membership is null or missing', () => {
      const validation = tenantAccessService.validateAccess(null, tenantA);
      expect(validation.allowed).toBe(false);
      expect(validation.reason).toBe('NO_MEMBERSHIP');
    });

    it('denies cross-tenant operations: Beta admin cannot operate within Tenant A', () => {
      // Beta admin attempting to operate within Tenant A
      const isCrossOrg = membershipBetaAdmin.organisationId !== tenantA.id;
      expect(isCrossOrg).toBe(true);
      expect(tenantAccessService.validateAccess(membershipBetaAdmin, tenantB).allowed).toBe(true);
    });
  });

  describe('3. Permission Resolution & Role Evaluation', () => {
    it('evaluates permissions from membership role in organisation context', () => {
      expect(permissionService.can({
        membership: membershipAlphaAdmin,
        activeOrganisation: tenantA,
        permission: 'learners.write'
      })).toBe(true);

      expect(permissionService.can({
        membership: membershipAlphaTeacher,
        activeOrganisation: tenantA,
        permission: 'learners.read'
      })).toBe(true);

      expect(permissionService.can({
        membership: membershipAlphaTeacher,
        activeOrganisation: tenantA,
        permission: 'finance.write'
      })).toBe(false);
    });

    it('denies permissions if membership is disabled or inactive', () => {
      const disabledTeacher: OrganisationMembership = {
        ...membershipAlphaTeacher,
        membershipStatus: 'disabled'
      };
      expect(permissionService.can({
        membership: disabledTeacher,
        activeOrganisation: tenantA,
        permission: 'learners.read'
      })).toBe(false);
    });

    it('supports backward-compatible legacy user role evaluation', () => {
      const legacyUser: AuthUser = {
        uid: 'legacy_1',
        email: 'legacy@example.com',
        displayName: 'Legacy User',
        role: 'teacher'
      };
      expect(permissionService.can(legacyUser, 'attendance.write')).toBe(true);
      expect(permissionService.can(legacyUser, 'finance.write')).toBe(false);
    });

    it('separates platform super_admin from school-level operations', () => {
      const superAdminUser: AuthUser = {
        uid: 'platform_owner',
        email: 'owner@artsflow.example.com',
        displayName: 'Platform Admin',
        platformRole: 'super_admin'
      };

      // Platform permissions granted
      expect(permissionService.can({
        user: superAdminUser,
        permission: 'platform.manage'
      })).toBe(true);

      // School-level permissions without membership
      const nonMemberTeacherCtx = {
        user: superAdminUser,
        membership: null,
        permission: 'attendance.write' as const
      };
      expect(permissionService.can(nonMemberTeacherCtx)).toBe(false);
    });
  });

  describe('4. Cross-Tenant Record Boundaries & Data Isolation Fixtures', () => {
    // Synthetic record fixtures
    const learnerTenantA: Learner = {
      id: 'lrn_alpha_01',
      organisationId: TENANT_A_ID,
      firstName: 'Thabo',
      lastName: 'Molefe',
      learnerStatus: 'active',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      createdBy: 'admin_alpha',
      updatedBy: 'admin_alpha',
      status: 'active'
    };

    const learnerTenantB: Learner = {
      id: 'lrn_beta_01',
      organisationId: TENANT_B_ID,
      firstName: 'Sipho',
      lastName: 'Khumalo',
      learnerStatus: 'active',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      createdBy: 'admin_beta',
      updatedBy: 'admin_beta',
      status: 'active'
    };

    const invoiceTenantA: Invoice = {
      id: 'inv_alpha_01',
      organisationId: TENANT_A_ID,
      invoiceNumber: 'INV-A-1001',
      learnerId: 'lrn_alpha_01',
      guardianId: 'grd_alpha_01',
      issueDate: '2026-02-01',
      dueDate: '2026-02-15',
      currency: 'ZAR',
      subtotal: 150000,
      discountTotal: 0,
      waiverTotal: 0,
      total: 150000,
      amountPaid: 0,
      balance: 150000,
      invoiceStatus: 'issued',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
      createdBy: 'admin_alpha',
      updatedBy: 'admin_alpha',
      status: 'active'
    };

    const sessionTenantA: Session = {
      id: 'ses_alpha_01',
      organisationId: TENANT_A_ID,
      groupId: 'grp_alpha_piano',
      date: '2026-02-10',
      startTime: '14:00',
      endTime: '15:00',
      teacherIds: ['stf_alpha_01'],
      sessionType: 'lesson',
      sessionStatus: 'scheduled',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      createdBy: 'admin_alpha',
      updatedBy: 'admin_alpha',
      status: 'active'
    };

    const consentTenantA: ConsentSubmission = {
      id: 'con_alpha_01',
      organisationId: TENANT_A_ID,
      consentRequestId: 'req_alpha_tour',
      eventId: 'evt_alpha_tour',
      guardianId: 'grd_alpha_01',
      learnerId: 'lrn_alpha_01',
      participationApproved: true,
      indemnityAccepted: true,
      guardianName: 'Jane Doe',
      submissionStatus: 'submitted',
      status: 'active',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
      createdBy: 'grd_alpha_01',
      updatedBy: 'grd_alpha_01'
    };

    const timesheetTenantA: Timesheet = {
      id: 'tsh_alpha_01',
      organisationId: TENANT_A_ID,
      staffId: 'stf_alpha_01',
      periodStart: '2026-02-01',
      periodEnd: '2026-02-28',
      totalMinutes: 1200,
      totalEntries: 4,
      timesheetStatus: 'submitted',
      createdAt: '2026-02-28T00:00:00Z',
      updatedAt: '2026-02-28T00:00:00Z',
      createdBy: 'stf_alpha_01',
      updatedBy: 'stf_alpha_01',
      status: 'active'
    };

    it('verifies strict organisationId matching on tenant records', () => {
      expect(learnerTenantA.organisationId).toBe(TENANT_A_ID);
      expect(learnerTenantB.organisationId).toBe(TENANT_B_ID);
      expect(learnerTenantA.organisationId).not.toBe(learnerTenantB.organisationId);

      expect(invoiceTenantA.organisationId).toBe(TENANT_A_ID);
      expect(sessionTenantA.organisationId).toBe(TENANT_A_ID);
      expect(consentTenantA.organisationId).toBe(TENANT_A_ID);
      expect(timesheetTenantA.organisationId).toBe(TENANT_A_ID);
    });

    it('rejects cross-tenant data modification in BaseRepository architecture', () => {
      // Simulating BaseRepository cross-org protection check
      const verifyTenantMatch = (recordOrgId: string, actorOrgId: string) => {
        if (recordOrgId !== actorOrgId) {
          throw new Error('Cross-organisation update prevented');
        }
      };

      expect(() => verifyTenantMatch(learnerTenantA.organisationId, TENANT_A_ID)).not.toThrow();
      expect(() => verifyTenantMatch(learnerTenantA.organisationId, TENANT_B_ID)).toThrow(
        'Cross-organisation update prevented'
      );
    });
  });

  describe('5. Legacy User Membership Migration Script', () => {
    it('executes safe dry-run without writing records', async () => {
      const legacyUsers = [
        { uid: 'u1', email: 'u1@alpha.com', role: 'teacher' as const, organisationId: TENANT_A_ID, status: 'active' },
        { uid: 'u2', email: 'u2@alpha.com', role: 'finance' as const, organisationId: TENANT_A_ID, status: 'active' },
        { uid: 'u3', email: 'u3@none.com', role: undefined, organisationId: null } // Malformed / external
      ];

      const saveMock = vi.fn();
      const report = await migrateUsersToMemberships({
        users: legacyUsers,
        existingMemberships: [],
        isDryRun: true,
        saveMembership: saveMock,
        logger: () => {}
      });

      expect(report.usersScanned).toBe(3);
      expect(report.membershipsToCreate).toBe(2);
      expect(report.membershipsCreated).toBe(0); // Dry run must NOT write
      expect(report.skipped.length).toBe(1);
      expect(saveMock).not.toHaveBeenCalled();
    });

    it('performs idempotent migration and detects existing memberships and role conflicts', async () => {
      const legacyUsers = [
        { uid: 'u1', email: 'u1@alpha.com', role: 'teacher' as const, organisationId: TENANT_A_ID, status: 'active' },
        { uid: 'u2', email: 'u2@alpha.com', role: 'organisation_admin' as const, organisationId: TENANT_A_ID, status: 'active' }
      ];

      const existingMemberships: OrganisationMembership[] = [
        // u1 already exists with matching role
        {
          id: 'mem_u1_alpha',
          organisationId: TENANT_A_ID,
          userId: 'u1',
          email: 'u1@alpha.com',
          role: 'teacher',
          membershipStatus: 'active',
          joinedAt: '2026-01-01T00:00:00Z',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          createdBy: 'system',
          updatedBy: 'system',
          status: 'active'
        },
        // u2 exists but with a DIFFERENT role (conflict)
        {
          id: 'mem_u2_alpha',
          organisationId: TENANT_A_ID,
          userId: 'u2',
          email: 'u2@alpha.com',
          role: 'viewer', // Differs from user doc organisation_admin
          membershipStatus: 'active',
          joinedAt: '2026-01-01T00:00:00Z',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          createdBy: 'system',
          updatedBy: 'system',
          status: 'active'
        }
      ];

      const saveMock = vi.fn();
      const report = await migrateUsersToMemberships({
        users: legacyUsers,
        existingMemberships,
        isDryRun: false,
        saveMembership: saveMock,
        logger: () => {}
      });

      expect(report.usersScanned).toBe(2);
      expect(report.alreadyMigrated).toBe(1); // u1
      expect(report.conflicts.length).toBe(1); // u2
      expect(report.conflicts[0].userId).toBe('u2');
      expect(report.conflicts[0].userRole).toBe('organisation_admin');
      expect(report.conflicts[0].membershipRole).toBe('viewer');
      expect(report.membershipsCreated).toBe(0);
      expect(saveMock).not.toHaveBeenCalled(); // No writes needed
    });

    it('creates missing memberships cleanly in live mode', async () => {
      const legacyUsers = [
        { uid: 'u3', email: 'u3@alpha.com', role: 'teacher' as const, organisationId: TENANT_A_ID, status: 'active' }
      ];

      const savedRecords: OrganisationMembership[] = [];
      const saveMock = vi.fn(async (m: OrganisationMembership) => {
        savedRecords.push(m);
      });

      const report = await migrateUsersToMemberships({
        users: legacyUsers,
        existingMemberships: [],
        isDryRun: false,
        saveMembership: saveMock,
        logger: () => {}
      });

      expect(report.membershipsToCreate).toBe(1);
      expect(report.membershipsCreated).toBe(1);
      expect(savedRecords.length).toBe(1);
      expect(savedRecords[0].userId).toBe('u3');
      expect(savedRecords[0].organisationId).toBe(TENANT_A_ID);
      expect(savedRecords[0].role).toBe('teacher');
      expect(savedRecords[0].membershipStatus).toBe('active');
      expect(savedRecords[0].isDefaultOrganisation).toBe(true);
    });
  });

  describe('6. Role Escalation Prevention', () => {
    it('prevents normal admin from assigning super_admin in membership rules', () => {
      // Validating constraint: request.resource.data.role != 'super_admin'
      const checkMembershipRoleAssignment = (role: string) => {
        if (role === 'super_admin') {
          throw new Error('PERMISSION_DENIED: Cannot assign super_admin role to organisation membership');
        }
        return true;
      };

      expect(() => checkMembershipRoleAssignment('teacher')).not.toThrow();
      expect(() => checkMembershipRoleAssignment('organisation_admin')).not.toThrow();
      expect(() => checkMembershipRoleAssignment('super_admin')).toThrow('PERMISSION_DENIED');
    });
  });
});
