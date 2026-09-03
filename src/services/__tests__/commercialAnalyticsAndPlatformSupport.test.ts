import { describe, it, expect, vi, beforeEach } from 'vitest';
import { commercialAnalyticsService } from '../platform/commercialAnalyticsService';
import { platformSupportService } from '../platform/platformSupportService';
import { organisationRepository } from '../../repositories/organisationRepository';
import { subscriptionRepository } from '../../repositories/subscriptionRepository';
import { subscriptionResolverService } from '../billing/subscriptionResolverService';
import { usageMeteringService } from '../usageMeteringService';
import { customerLifecycleService } from '../customerLifecycleService';
import { organisationMembershipRepository } from '../../repositories/organisationMembershipRepository';
import { organisationReadinessService } from '../onboarding/organisationReadinessService';
import { auditService } from '../auditService';
import type {
  Organisation,
  Subscription,
  SubscriptionPlan,
  OrganisationUsage
} from '../../types';

import { getDocs } from 'firebase/firestore';
import { subscriptionPlanService } from '../subscriptionPlanService';

// Mock DB & firestore
vi.mock('../../lib/firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, name) => ({ name })),
  getDocs: vi.fn()
}));

vi.mock('../subscriptionPlanService', () => ({
  subscriptionPlanService: {
    listPlans: vi.fn()
  }
}));

// Mock repositories & services
vi.mock('../../repositories/organisationRepository', () => ({
  organisationRepository: {
    getAll: vi.fn(),
    getById: vi.fn(),
    update: vi.fn()
  }
}));

vi.mock('../../repositories/subscriptionRepository', () => ({
  subscriptionRepository: {
    getAll: vi.fn(),
    update: vi.fn()
  }
}));

vi.mock('../../repositories/subscriptionPlanRepository', () => ({
  subscriptionPlanRepository: {
    getAll: vi.fn()
  }
}));

vi.mock('../../repositories/organisationUsageRepository', () => ({
  organisationUsageRepository: {
    getAll: vi.fn()
  }
}));

vi.mock('../billing/subscriptionResolverService', () => ({
  subscriptionResolverService: {
    getCurrentSubscription: vi.fn()
  }
}));

vi.mock('../usageMeteringService', () => ({
  usageMeteringService: {
    getUsageMeters: vi.fn(),
    syncAllUsage: vi.fn()
  }
}));

vi.mock('../customerLifecycleService', () => ({
  customerLifecycleService: {
    getLifecycleState: vi.fn()
  }
}));

vi.mock('../../repositories/organisationMembershipRepository', () => ({
  organisationMembershipRepository: {
    getByOrganisation: vi.fn()
  }
}));

vi.mock('../onboarding/organisationReadinessService', () => ({
  organisationReadinessService: {
    evaluateReadiness: vi.fn()
  }
}));

vi.mock('../auditService', () => ({
  auditService: {
    log: vi.fn()
  }
}));

describe('Fast Phase 5: Commercial Analytics & Platform Support', () => {
  const mockPlans: SubscriptionPlan[] = [
    {
      id: 'plan_starter',
      name: 'Starter Plan',
      code: 'starter',
      planStatus: 'active',
      displayOrder: 1,
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'sys',
      updatedBy: 'sys',
      status: 'active'
    },
    {
      id: 'plan_pro',
      name: 'Pro Plan',
      code: 'pro',
      planStatus: 'active',
      displayOrder: 2,
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'sys',
      updatedBy: 'sys',
      status: 'active'
    }
  ];

  const mockOrgs: Organisation[] = [
    {
      id: 'org_1',
      organisationId: 'org_1',
      name: 'Cape Academy of Arts',
      slug: 'cape-academy',
      organisationType: 'academy',
      tenantStatus: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'usr_1',
      updatedBy: 'usr_1',
      status: 'active'
    },
    {
      id: 'org_2',
      organisationId: 'org_2',
      name: 'Pretoria Ballet School',
      slug: 'pretoria-ballet',
      organisationType: 'studio',
      tenantStatus: 'trial',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'usr_2',
      updatedBy: 'usr_2',
      status: 'active'
    },
    {
      id: 'org_3',
      organisationId: 'org_3',
      name: 'Durban Drama Guild',
      slug: 'durban-drama',
      organisationType: 'conservatory',
      tenantStatus: 'restricted',
      restrictionReason: 'Trial expired',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'usr_3',
      updatedBy: 'usr_3',
      status: 'active'
    }
  ];

  const mockSubscriptions: Subscription[] = [
    {
      id: 'sub_1',
      organisationId: 'org_1',
      planId: 'plan_pro',
      subscriptionStatus: 'active',
      billingMode: 'provider',
      billingInterval: 'monthly',
      currency: 'ZAR',
      priceAmount: 85000, // R850.00
      cancelAtPeriodEnd: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'sys',
      updatedBy: 'sys',
      status: 'active'
    },
    {
      id: 'sub_2',
      organisationId: 'org_2',
      planId: 'plan_starter',
      subscriptionStatus: 'trialing',
      billingMode: 'provider',
      billingInterval: 'monthly',
      currency: 'ZAR',
      priceAmount: 35000,
      trialEndsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      cancelAtPeriodEnd: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'sys',
      updatedBy: 'sys',
      status: 'active'
    },
    {
      id: 'sub_3',
      organisationId: 'org_3',
      planId: 'plan_starter',
      subscriptionStatus: 'expired',
      billingMode: 'provider',
      billingInterval: 'monthly',
      currency: 'ZAR',
      priceAmount: 35000,
      cancelAtPeriodEnd: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'sys',
      updatedBy: 'sys',
      status: 'active'
    }
  ];

  const mockUsageList: OrganisationUsage[] = [
    {
      id: 'usage_org_1',
      organisationId: 'org_1',
      billingPeriod: '2026-09',
      learnersCount: 45,
      staffUsersCount: 4,
      storageMb: 250,
      monthlyCommunicationsCount: 120,
      automationRunsCount: 15,
      lastSyncedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'sys',
      updatedBy: 'sys',
      status: 'active'
    },
    {
      id: 'usage_org_2',
      organisationId: 'org_2',
      billingPeriod: '2026-09',
      learnersCount: 10,
      staffUsersCount: 2,
      storageMb: 50,
      monthlyCommunicationsCount: 30,
      automationRunsCount: 0,
      lastSyncedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'sys',
      updatedBy: 'sys',
      status: 'active'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CommercialAnalyticsService', () => {
    it('aggregates platform totals, customer metrics, and MRR correctly', async () => {
      vi.mocked(subscriptionPlanService.listPlans).mockResolvedValue(mockPlans);
      vi.mocked(getDocs).mockImplementation(async (query: any) => {
        const collName = query?.name;
        if (collName === 'organisations') {
          return {
            forEach: (cb: any) => mockOrgs.forEach((o) => cb({ data: () => o }))
          } as any;
        }
        if (collName === 'subscriptions') {
          return {
            forEach: (cb: any) => mockSubscriptions.forEach((s) => cb({ data: () => s }))
          } as any;
        }
        if (collName === 'organisationUsage') {
          return {
            forEach: (cb: any) => mockUsageList.forEach((u) => cb({ data: () => u }))
          } as any;
        }
        return { forEach: () => {} } as any;
      });

      const summary = await commercialAnalyticsService.getCommercialAnalytics();

      expect(summary.currency).toBe('ZAR');
      expect(summary.activePaidSubscriptions).toBe(1);
      expect(summary.trialSubscriptions).toBe(1);
      expect(summary.pastDueSubscriptions).toBe(0);
      expect(summary.canceledSubscriptions).toBe(1);

      // Financials: Sub 1 has active priceAmount = 85000 cents (R850)
      expect(summary.mrr).toBe(85000);
      expect(summary.arr).toBe(85000 * 12);

      // Usage aggregates
      expect(summary.platformUsageAggregate.totalLearners).toBe(55);
      expect(summary.platformUsageAggregate.totalStaffUsers).toBe(6);
      expect(summary.platformUsageAggregate.totalStorageMb).toBe(300);
      expect(summary.platformUsageAggregate.totalMonthlyCommunications).toBe(150);

      // Plans Breakdown
      expect(summary.revenueByPlan['plan_pro']?.activeCount).toBe(1);
      expect(summary.revenueByPlan['plan_pro']?.mrr).toBe(85000);
    });

    it('handles empty database gracefully with zero metrics', async () => {
      vi.mocked(subscriptionPlanService.listPlans).mockResolvedValue([]);
      vi.mocked(getDocs).mockResolvedValue({
        forEach: () => {}
      } as any);

      const summary = await commercialAnalyticsService.getCommercialAnalytics();

      expect(summary.mrr).toBe(0);
      expect(summary.churnRate).toBe(0);
      expect(summary.platformUsageAggregate.totalLearners).toBe(0);
    });
  });

  describe('PlatformSupportService', () => {
    it('generates a comprehensive diagnostic report for a healthy tenant', async () => {
      vi.mocked(organisationRepository.getById).mockResolvedValue(mockOrgs[0]);
      vi.mocked(subscriptionResolverService.getCurrentSubscription).mockResolvedValue(mockSubscriptions[0]);
      vi.mocked(customerLifecycleService.getLifecycleState).mockResolvedValue({
        organisationId: 'org_1',
        tenantStatus: 'active',
        subscriptionStatus: 'active',
        planId: 'plan_professional',
        planName: 'PROFESSIONAL',
        isOperational: true,
        accessLevel: 'full',
        isRestricted: false,
        isSuspended: false,
        isTrialing: false,
        isTrialExpiringSoon: false,
        isPastDue: false,
        isGraceExpiringSoon: false,
        activeBanners: []
      } as any);
      vi.mocked(usageMeteringService.getUsageMeters).mockResolvedValue({
        organisationId: 'org_1',
        billingPeriod: '2026-09',
        meters: {} as any,
        anyExceeded: false,
        anyWarning: false,
        anyCritical: false,
        lastSyncedAt: new Date().toISOString()
      });
      vi.mocked(organisationMembershipRepository.getByOrganisation).mockResolvedValue([
        {
          id: 'mem_1',
          organisationId: 'org_1',
          userId: 'usr_1',
          email: 'usr_1@org.za',
          role: 'organisation_admin',
          membershipStatus: 'active',
          joinedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'sys',
          updatedBy: 'sys',
          status: 'active'
        }
      ]);
      vi.mocked(organisationReadinessService.evaluateReadiness).mockResolvedValue({
        isReady: true,
        percentage: 100,
        conditions: []
      });

      const report = await platformSupportService.generateDiagnosticReport('org_1');

      expect(report.organisationId).toBe('org_1');
      expect(report.hasOwnerOrAdmin).toBe(true);
      expect(report.healthScore).toBe(100);
      expect(report.warnings).toHaveLength(0);
      expect(report.readinessStatus).toBe('ready');
    });

    it('identifies health penalties and warnings for problematic tenants', async () => {
      vi.mocked(organisationRepository.getById).mockResolvedValue(mockOrgs[2]); // restricted
      vi.mocked(subscriptionResolverService.getCurrentSubscription).mockResolvedValue(mockSubscriptions[2]);
      vi.mocked(customerLifecycleService.getLifecycleState).mockResolvedValue({
        organisationId: 'org_3',
        tenantStatus: 'restricted',
        subscriptionStatus: 'expired',
        isOperational: false,
        isRestricted: true,
        isSuspended: false,
        isTrialing: false,
        isTrialExpiringSoon: false,
        isPastDue: false,
        isGraceExpiringSoon: false,
        activeBanners: []
      } as any);
      vi.mocked(usageMeteringService.getUsageMeters).mockResolvedValue({
        organisationId: 'org_3',
        billingPeriod: '2026-09',
        meters: {} as any,
        anyExceeded: true,
        anyWarning: true,
        anyCritical: false,
        lastSyncedAt: new Date().toISOString()
      });
      // No active admin
      vi.mocked(organisationMembershipRepository.getByOrganisation).mockResolvedValue([]);
      vi.mocked(organisationReadinessService.evaluateReadiness).mockResolvedValue({
        isReady: false,
        percentage: 40,
        conditions: [
          {
            key: 'admin_membership',
            label: 'Admin',
            description: 'Needs admin',
            met: false,
            required: true
          }
        ]
      });

      const report = await platformSupportService.generateDiagnosticReport('org_3');

      expect(report.hasOwnerOrAdmin).toBe(false);
      expect(report.healthScore).toBeLessThan(50);
      expect(report.warnings.length).toBeGreaterThan(0);
      expect(report.readinessStatus).toBe('action_required');
    });

    it('forces usage synchronization and creates audit record', async () => {
      vi.mocked(usageMeteringService.syncAllUsage).mockResolvedValue({
        organisationId: 'org_1',
        billingPeriod: '2026-09',
        meters: {
          'limits.learners': {
            key: 'limits.learners',
            name: 'Learners',
            description: 'Enrolled learners',
            current: 45,
            limit: 100,
            unit: 'learners',
            percentUsed: 45,
            status: 'ok',
            warning: false,
            exceeded: false
          }
        } as any,
        anyExceeded: false,
        anyWarning: false,
        anyCritical: false,
        lastSyncedAt: new Date().toISOString()
      });

      const summary = await platformSupportService.forceSyncUsage('org_1', 'admin_actor');

      expect(usageMeteringService.syncAllUsage).toHaveBeenCalledWith('org_1', 'admin_actor');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          organisationId: 'org_1',
          actorId: 'admin_actor',
          action: 'UPDATE',
          entityType: 'organisationUsage'
        })
      );
      expect(summary.meters['limits.learners']?.current).toBe(45);
    });

    it('extends trial period and updates subscription and audit log', async () => {
      vi.mocked(subscriptionResolverService.getCurrentSubscription).mockResolvedValue(mockSubscriptions[1]);
      vi.mocked(organisationRepository.getById).mockResolvedValue(mockOrgs[1]);

      await platformSupportService.extendTrial('org_2', 'support_actor', 14, 'Customer requested extension');

      expect(subscriptionRepository.update).toHaveBeenCalledWith(
        'sub_2',
        expect.objectContaining({
          subscriptionStatus: 'trialing'
        })
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          organisationId: 'org_2',
          actorId: 'support_actor',
          action: 'UPDATE',
          entityType: 'subscription'
        })
      );
    });

    it('grants grace extension and lifts restricted state if active', async () => {
      vi.mocked(subscriptionResolverService.getCurrentSubscription).mockResolvedValue(mockSubscriptions[2]);
      vi.mocked(organisationRepository.getById).mockResolvedValue(mockOrgs[2]); // restricted

      await platformSupportService.grantPastDueGrace('org_3', 'support_actor', 7, 'Grace extension granted');

      expect(subscriptionRepository.update).toHaveBeenCalledWith(
        'sub_3',
        expect.objectContaining({
          currentPeriodEnd: expect.any(String)
        })
      );
      expect(organisationRepository.update).toHaveBeenCalledWith(
        'org_3',
        'support_actor',
        expect.objectContaining({
          tenantStatus: 'active'
        })
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          organisationId: 'org_3',
          actorId: 'support_actor',
          action: 'UPDATE'
        })
      );
    });
  });
});
