import { describe, it, expect, vi, beforeEach } from 'vitest';
import { permissionService } from '../permissionService';
import { customerLifecycleService } from '../customerLifecycleService';
import { usageMeteringService } from '../usageMeteringService';
import { platformSupportService } from '../platform/platformSupportService';
import { commercialAnalyticsService } from '../platform/commercialAnalyticsService';
import { organisationReadinessService } from '../onboarding/organisationReadinessService';
import { tenantContextService } from '../tenantContextService';
import { organisationRepository } from '../../repositories/organisationRepository';
import { subscriptionRepository } from '../../repositories/subscriptionRepository';
import { subscriptionPlanRepository } from '../../repositories/subscriptionPlanRepository';
import { organisationUsageRepository } from '../../repositories/organisationUsageRepository';
import { organisationMembershipRepository } from '../../repositories/organisationMembershipRepository';
import { subscriptionResolverService } from '../billing/subscriptionResolverService';
import { subscriptionPlanService } from '../subscriptionPlanService';
import { auditService } from '../auditService';
import { getDocs } from 'firebase/firestore';

import type {
  Organisation,
  Subscription,
  SubscriptionPlan,
  OrganisationUsage,
  OrganisationMembership,
  AuthUser
} from '../../types';

// Mock DB
vi.mock('../../lib/firebase', () => ({
  db: {},
  auth: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, name) => ({ name })),
  query: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [], forEach: vi.fn() }),
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({
      organisationId: 'org_johannesburg_ballet',
      profileCompleted: true,
      settingsConfigured: true
    })
  }),
  setDoc: vi.fn(),
  updateDoc: vi.fn()
}));

vi.mock('../../repositories/organisationRepository', () => ({
  organisationRepository: {
    getById: vi.fn(),
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  }
}));

vi.mock('../../repositories/subscriptionRepository', () => ({
  subscriptionRepository: {
    getById: vi.fn(),
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  }
}));

vi.mock('../../repositories/subscriptionPlanRepository', () => ({
  subscriptionPlanRepository: {
    getAll: vi.fn(),
    getById: vi.fn()
  }
}));

vi.mock('../../repositories/organisationUsageRepository', () => ({
  organisationUsageRepository: {
    getByOrganisation: vi.fn(),
    getAll: vi.fn(),
    getOrCreate: vi.fn(),
    save: vi.fn(),
    incrementMeter: vi.fn(),
    updateUsage: vi.fn()
  }
}));

vi.mock('../../repositories/organisationMembershipRepository', () => ({
  organisationMembershipRepository: {
    getByOrganisation: vi.fn(),
    getByUser: vi.fn(),
    getByUserAndOrg: vi.fn(),
    getActiveMemberships: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  }
}));

vi.mock('../billing/subscriptionResolverService', () => ({
  subscriptionResolverService: {
    getCurrentSubscription: vi.fn(),
    getEffectivePlanId: vi.fn(),
    isSubscriptionOperational: vi.fn()
  }
}));

vi.mock('../subscriptionPlanService', () => ({
  subscriptionPlanService: {
    listPlans: vi.fn()
  }
}));

vi.mock('../auditService', () => ({
  auditService: {
    log: vi.fn()
  }
}));

describe('FAST PHASE 6: ArtsFlow OS v1.1 SaaS Commercial Release Validation Suite', () => {
  const testOrgId = 'org_johannesburg_ballet';
  const testUserId = 'usr_principal_dan';

  const mockStarterPlan: SubscriptionPlan = {
    id: 'plan_starter',
    name: 'Starter Studio',
    code: 'starter',
    planStatus: 'active',
    displayOrder: 1,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'sys',
    updatedBy: 'sys',
    status: 'active'
  };

  const mockProPlan: SubscriptionPlan = {
    id: 'plan_pro',
    name: 'Pro Conservatory',
    code: 'pro',
    planStatus: 'active',
    displayOrder: 2,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'sys',
    updatedBy: 'sys',
    status: 'active'
  };

  let currentOrg: Organisation;
  let currentSub: Subscription;
  let currentUsage: OrganisationUsage;
  let currentMemberships: OrganisationMembership[];

  beforeEach(() => {
    vi.clearAllMocks();

    currentOrg = {
      id: testOrgId,
      organisationId: testOrgId,
      name: 'Johannesburg Ballet Academy',
      slug: 'jhb-ballet',
      organisationType: 'academy',
      tenantStatus: 'trial',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: testUserId,
      updatedBy: testUserId,
      status: 'active'
    };

    currentSub = {
      id: `sub_${testOrgId}`,
      organisationId: testOrgId,
      planId: 'plan_starter',
      subscriptionStatus: 'trialing',
      billingMode: 'provider',
      billingInterval: 'monthly',
      currency: 'ZAR',
      priceAmount: 45000, // R450.00
      trialEndsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 14 * 86400000).toISOString(),
      cancelAtPeriodEnd: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'sys',
      updatedBy: 'sys',
      status: 'active'
    };

    currentUsage = {
      id: `usage_${testOrgId}`,
      organisationId: testOrgId,
      billingPeriod: '2026-09',
      learnersCount: 20,
      staffUsersCount: 2,
      storageMb: 150,
      monthlyCommunicationsCount: 45,
      automationRunsCount: 0,
      lastSyncedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'sys',
      updatedBy: 'sys',
      status: 'active'
    };

    currentMemberships = [
      {
        id: 'mem_dan',
        organisationId: testOrgId,
        userId: testUserId,
        email: 'dan@ballet.org',
        role: 'organisation_admin',
        membershipStatus: 'active',
        joinedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: testUserId,
        updatedBy: testUserId,
        status: 'active'
      }
    ];

    vi.mocked(organisationRepository.getById).mockImplementation(async (id) =>
      id === testOrgId ? currentOrg : null
    );
    vi.mocked(subscriptionResolverService.getCurrentSubscription).mockImplementation(async (id) =>
      id === testOrgId ? currentSub : null
    );
    vi.mocked(organisationUsageRepository.getByOrganisation).mockImplementation(async (id) =>
      id === testOrgId ? [currentUsage] : []
    );
    vi.mocked(organisationUsageRepository.getOrCreate).mockImplementation(async (id) =>
      id === testOrgId ? currentUsage : currentUsage
    );
    vi.mocked(organisationMembershipRepository.getByOrganisation).mockImplementation(async (id) =>
      id === testOrgId ? currentMemberships : []
    );
    vi.mocked(subscriptionPlanRepository.getById).mockImplementation(async (id) =>
      id === 'plan_pro' ? mockProPlan : mockStarterPlan
    );
    vi.mocked(subscriptionPlanRepository.getAll).mockResolvedValue([mockStarterPlan, mockProPlan]);
    vi.mocked(subscriptionPlanService.listPlans).mockResolvedValue([mockStarterPlan, mockProPlan]);
    vi.mocked(subscriptionResolverService.getEffectivePlanId).mockImplementation(async (id) =>
      id === testOrgId ? currentSub.planId : 'plan_starter'
    );
    vi.mocked(subscriptionResolverService.isSubscriptionOperational).mockImplementation((sub) => {
      if (!sub) return false;
      return sub.subscriptionStatus === 'active' || sub.subscriptionStatus === 'trialing' || sub.subscriptionStatus === 'past_due';
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Provision School & Trial Initiation
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Step 1 & 2: Provision School & Trial State Initiation', () => {
    it('verifies provisioned organisation starts in trial status with operational access', async () => {
      const lifecycle = await customerLifecycleService.getLifecycleState(testOrgId);

      expect(lifecycle.tenantStatus).toBe('trial');
      expect(lifecycle.isTrialing).toBe(true);
      expect(lifecycle.isOperational).toBe(true);
      expect(lifecycle.isRestricted).toBe(false);
      expect(lifecycle.trialDaysRemaining).toBeGreaterThan(10);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Subscribe & Tier Upgrade
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Step 3: Subscribe & Paid Tier Upgrade', () => {
    it('activates subscription and updates lifecycle state to paid active', async () => {
      // Simulate upgrading to Pro Plan
      currentSub.subscriptionStatus = 'active';
      currentSub.planId = 'plan_pro';
      currentSub.priceAmount = 120000; // R1200.00
      currentSub.trialEndsAt = undefined;
      currentOrg.tenantStatus = 'active';

      const lifecycle = await customerLifecycleService.getLifecycleState(testOrgId);

      expect(lifecycle.tenantStatus).toBe('active');
      expect(lifecycle.subscriptionStatus).toBe('active');
      expect(lifecycle.isOperational).toBe(true);
      expect(lifecycle.isTrialing).toBe(false);
      expect(lifecycle.isRestricted).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Onboarding & Readiness Evaluation
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Step 4: Onboard & Readiness Verification', () => {
    it('evaluates readiness status dynamically based on tenant conditions', async () => {
      const report = await organisationReadinessService.evaluateReadiness(testOrgId);

      expect(report).toBeDefined();
      expect(typeof report.percentage).toBe('number');
      expect(Array.isArray(report.conditions)).toBe(true);
      expect(report.conditions.length).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Invite Users & Access Control
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Step 5 & 6: Invite Users & Operational Access Control', () => {
    it('enforces RBAC permissions based on membership role and tenant status', () => {
      const orgAdminUser: AuthUser = {
        uid: testUserId,
        email: 'dan@ballet.org',
        displayName: 'Dan Principal',
        role: 'organisation_admin'
      };

      const teacherUser: AuthUser = {
        uid: 'usr_teacher_clara',
        email: 'clara@ballet.org',
        displayName: 'Clara Teacher',
        role: 'teacher'
      };

      // Admin can manage settings and users
      expect(permissionService.can(orgAdminUser, 'settings.manage')).toBe(true);
      expect(permissionService.can(orgAdminUser, 'users.manage')).toBe(true);

      // Teacher cannot manage org settings
      expect(permissionService.can(teacherUser, 'settings.manage')).toBe(false);
      // Teacher can view attendance & learners
      expect(permissionService.can(teacherUser, 'attendance.read')).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Multi-Organisation User Switching
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Step 7: Multi-Organisation User Switching', () => {
    it('returns active organisations for a user and verifies isolated memberships', async () => {
      const secondOrgId = 'org_cape_drama';
      const secondOrg: Organisation = {
        ...currentOrg,
        id: secondOrgId,
        name: 'Cape Town Drama Institute',
        slug: 'ct-drama'
      };

      const secondMembership: OrganisationMembership = {
        id: 'mem_dan_cape',
        organisationId: secondOrgId,
        userId: testUserId,
        email: 'dan@ballet.org',
        role: 'teacher',
        membershipStatus: 'active',
        joinedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'sys',
        updatedBy: 'sys',
        status: 'active'
      };

      vi.mocked(organisationMembershipRepository.getByUserAndOrg).mockImplementation(
        async (uId, orgId) => {
          if (uId === testUserId && orgId === testOrgId) return currentMemberships[0];
          if (uId === testUserId && orgId === secondOrgId) return secondMembership;
          return null;
        }
      );
      vi.mocked(organisationRepository.getById).mockImplementation(async (id) => {
        if (id === testOrgId) return currentOrg;
        if (id === secondOrgId) return secondOrg;
        return null;
      });

      const switchResult1 = await tenantContextService.validateOrganisationSwitch(testUserId, testOrgId);
      expect(switchResult1.allowed).toBe(true);
      expect(switchResult1.membership?.role).toBe('organisation_admin');

      const switchResult2 = await tenantContextService.validateOrganisationSwitch(testUserId, secondOrgId);
      expect(switchResult2.allowed).toBe(true);
      expect(switchResult2.membership?.role).toBe('teacher');

      const invalidSwitch = await tenantContextService.validateOrganisationSwitch(testUserId, 'org_non_existent');
      expect(invalidSwitch.allowed).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Usage Metering & Plan Limit Enforcement
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Step 8: Usage Metering & Plan Capacity Enforcement', () => {
    it('verifies meter calculations and detects when a tenant approaches or exceeds limits', async () => {
      // Ensure on Starter Plan (limit = 100)
      currentSub.planId = 'plan_starter';
      currentUsage.automationRunsCount = 0;
      currentUsage.learnersCount = 90; // 90% (warning threshold >= 80%)

      const usageMeters = await usageMeteringService.getUsageMeters(testOrgId);

      expect(usageMeters).toBeDefined();
      expect(usageMeters?.meters['limits.learners']).toBeDefined();
      expect(usageMeters?.meters['limits.learners'].current).toBe(90);
      expect(usageMeters?.meters['limits.learners'].percentUsed).toBe(90);
      expect(usageMeters?.anyWarning).toBe(true);
      expect(usageMeters?.anyExceeded).toBe(false);

      // Now exceed capacity (limit = 100)
      currentUsage.learnersCount = 110; // 110%
      const exceededMeters = await usageMeteringService.getUsageMeters(testOrgId);
      expect(exceededMeters?.anyExceeded).toBe(true);
      expect(exceededMeters?.meters['limits.learners'].exceeded).toBe(true);
      expect(exceededMeters?.meters['limits.learners'].status).toBe('exceeded');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Lifecycle State Transitions (Past Due, Grace, Restriction)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Step 9: Lifecycle State Changes & Restriction Enforcement', () => {
    it('enforces past-due grace period and transitions to restricted upon expiration', async () => {
      // Simulate invoice past due 2 days ago
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
      currentSub.subscriptionStatus = 'past_due';
      currentSub.currentPeriodEnd = twoDaysAgo;

      const graceLifecycle = await customerLifecycleService.getLifecycleState(testOrgId);

      expect(graceLifecycle.isPastDue).toBe(true);
      expect(graceLifecycle.pastDueGraceDaysRemaining).toBeGreaterThan(0);
      expect(graceLifecycle.isOperational).toBe(true); // Still operational during grace!

      // Simulate grace period expired (15 days past due)
      const fifteenDaysAgo = new Date(Date.now() - 15 * 86400000).toISOString();
      currentSub.currentPeriodEnd = fifteenDaysAgo;
      currentOrg.tenantStatus = 'restricted';
      currentOrg.restrictionReason = 'Grace period expired';

      const restrictedLifecycle = await customerLifecycleService.getLifecycleState(testOrgId);

      expect(restrictedLifecycle.isRestricted).toBe(true);
      expect(restrictedLifecycle.isOperational).toBe(false); // Locked out of operations!
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Platform Support Operations
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Step 10: Platform Support Interventions', () => {
    it('runs operational diagnostics, extends grace, and forces usage sync', async () => {
      // Run diagnostic report
      const report = await platformSupportService.generateDiagnosticReport(testOrgId);
      expect(report.organisationId).toBe(testOrgId);
      expect(report.healthScore).toBeGreaterThanOrEqual(0);
      expect(report.healthScore).toBeLessThanOrEqual(100);

      // Super admin grants grace extension
      await platformSupportService.grantPastDueGrace(testOrgId, 'platform_admin_1', 14, 'Customer payment clearing');
      expect(subscriptionRepository.update).toHaveBeenCalledWith(
        currentSub.id,
        expect.objectContaining({
          currentPeriodEnd: expect.any(String)
        })
      );

      // Super admin forces usage sync
      const synced = await platformSupportService.forceSyncUsage(testOrgId, 'platform_admin_1');
      expect(synced).toBeDefined();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          organisationId: testOrgId,
          action: 'UPDATE',
          entityType: 'organisationUsage'
        })
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. Commercial Intelligence & Global Reporting
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Step 11: Commercial Analytics & Platform Reporting', () => {
    it('aggregates platform MRR in ZAR, calculates conversion rates, and flags tenants at risk', async () => {
      const allOrgs = [currentOrg];
      const allSubs = [
        {
          ...currentSub,
          subscriptionStatus: 'active',
          priceAmount: 85000,
          billingInterval: 'monthly',
          currency: 'ZAR'
        } as Subscription
      ];
      const allUsages = [currentUsage];

      vi.mocked(getDocs).mockImplementation(async (query: any) => {
        const collName = query?.name;
        if (collName === 'organisations') {
          return { forEach: (cb: any) => allOrgs.forEach((o) => cb({ data: () => o })) } as any;
        }
        if (collName === 'subscriptions') {
          return { forEach: (cb: any) => allSubs.forEach((s) => cb({ data: () => s })) } as any;
        }
        if (collName === 'organisationUsage') {
          return { forEach: (cb: any) => allUsages.forEach((u) => cb({ data: () => u })) } as any;
        }
        return { forEach: () => {} } as any;
      });

      const analytics = await commercialAnalyticsService.getCommercialAnalytics();

      expect(analytics.currency).toBe('ZAR');
      expect(analytics.mrr).toBe(85000);
      expect(analytics.arr).toBe(85000 * 12);
      expect(analytics.activePaidSubscriptions).toBe(1);
      expect(analytics.platformUsageAggregate.totalLearners).toBe(20);
      expect(Array.isArray(analytics.tenantsAtRisk)).toBe(true);
    });
  });
});
