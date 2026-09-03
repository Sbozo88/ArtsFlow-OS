import { describe, it, expect, vi, beforeEach } from 'vitest';
import { customerLifecycleService } from '../customerLifecycleService';
import { usageMeteringService } from '../usageMeteringService';
import { learnerService } from '../learnerService';
import { organisationUsageRepository } from '../../repositories/organisationUsageRepository';
import { organisationRepository } from '../../repositories/organisationRepository';
import { subscriptionResolverService } from '../billing/subscriptionResolverService';
import { entitlementResolverService } from '../entitlementResolverService';
import { learnerRepository } from '../../repositories/learnerRepository';
import { organisationMembershipRepository } from '../../repositories/organisationMembershipRepository';
import { documentRepository } from '../../repositories/documentRepository';
import type {
  Organisation,
  Subscription,
  OrganisationUsage,
  Learner,
  OrganisationMembership
} from '../../types';

// Mock DB
vi.mock('../../lib/firebase', () => ({
  db: {}
}));

const createMockUsage = (orgId: string, overrides: Partial<OrganisationUsage> = {}): OrganisationUsage => ({
  id: `usage_${orgId}`,
  organisationId: orgId,
  billingPeriod: '2026-09',
  learnersCount: 0,
  staffUsersCount: 0,
  storageMb: 0,
  monthlyCommunicationsCount: 0,
  automationRunsCount: 0,
  lastSyncedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system',
  updatedBy: 'system',
  status: 'active',
  ...overrides
});

// Mock Repositories and Services
vi.mock('../../repositories/organisationUsageRepository', () => ({
  organisationUsageRepository: {
    getByOrganisation: vi.fn(),
    getOrCreate: vi.fn(),
    save: vi.fn(),
    incrementMeter: vi.fn(),
    updateUsage: vi.fn(),
    resetCycleMeters: vi.fn()
  }
}));

vi.mock('../../repositories/organisationRepository', () => ({
  organisationRepository: {
    getById: vi.fn(),
    update: vi.fn()
  }
}));

vi.mock('../billing/subscriptionResolverService', () => ({
  subscriptionResolverService: {
    getCurrentSubscription: vi.fn(),
    getEffectivePlanId: vi.fn().mockResolvedValue('plan_growth'),
    isSubscriptionOperational: vi.fn().mockReturnValue(true)
  }
}));

vi.mock('../entitlementResolverService', () => ({
  entitlementResolverService: {
    getEntitlements: vi.fn(),
    hasFeature: vi.fn(),
    getLimit: vi.fn()
  }
}));

vi.mock('../../repositories/learnerRepository', () => ({
  learnerRepository: {
    getAll: vi.fn(),
    getByOrganisation: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  }
}));

vi.mock('../../repositories/organisationMembershipRepository', () => ({
  organisationMembershipRepository: {
    getAll: vi.fn(),
    getByOrganisation: vi.fn(),
    getByOrganisationAndUser: vi.fn(),
    save: vi.fn()
  }
}));

vi.mock('../../repositories/documentRepository', () => ({
  documentRepository: {
    getAll: vi.fn(),
    getByOrganisation: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    save: vi.fn()
  }
}));

describe('Fast Phase 4: Customer Lifecycle & Usage Metering Service', () => {
  const orgId = 'org-lifecycle-test';
  const actorId = 'actor-test-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Customer Lifecycle Management', () => {
    it('evaluates active trial period and calculates remaining days', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const mockOrg = {
        id: orgId,
        organisationId: orgId,
        organisationType: 'dance_studio',
        name: 'Ballet Academy',
        slug: 'ballet-academy',
        tenantStatus: 'trial',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'test',
        updatedBy: 'test'
      } as unknown as Organisation;

      const mockSub = {
        id: 'sub-trial',
        organisationId: orgId,
        planId: 'plan_starter',
        subscriptionStatus: 'trialing',
        billingInterval: 'monthly',
        priceAmount: 4900,
        currency: 'USD',
        trialStartsAt: new Date().toISOString(),
        trialEndsAt: futureDate.toISOString(),
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: futureDate.toISOString(),
        billingMode: 'provider',
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as unknown as Subscription;

      vi.mocked(organisationRepository.getById).mockResolvedValue(mockOrg);
      vi.mocked(subscriptionResolverService.getCurrentSubscription).mockResolvedValue(mockSub);
      vi.mocked(subscriptionResolverService.getEffectivePlanId).mockResolvedValue('plan_starter');
      vi.mocked(subscriptionResolverService.isSubscriptionOperational).mockReturnValue(true);

      const state = await customerLifecycleService.getLifecycleState(orgId);

      expect(state.isTrialing).toBe(true);
      expect(state.trialDaysRemaining).toBeGreaterThanOrEqual(4);
      expect(state.isOperational).toBe(true);
      expect(state.activeBanners.some((b) => b.id === 'trial_countdown')).toBe(true);
    });

    it('blocks operational mutation when tenantStatus is suspended', async () => {
      const mockOrg = {
        id: orgId,
        organisationId: orgId,
        organisationType: 'dance_studio',
        name: 'Suspended Studio',
        slug: 'suspended-studio',
        tenantStatus: 'suspended',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'test',
        updatedBy: 'test'
      } as unknown as Organisation;

      vi.mocked(organisationRepository.getById).mockResolvedValue(mockOrg);
      vi.mocked(subscriptionResolverService.getCurrentSubscription).mockResolvedValue(null);
      vi.mocked(subscriptionResolverService.getEffectivePlanId).mockResolvedValue('plan_legacy_full');
      vi.mocked(subscriptionResolverService.isSubscriptionOperational).mockReturnValue(false);

      const state = await customerLifecycleService.getLifecycleState(orgId);
      expect(state.isOperational).toBe(false);
      expect(state.isSuspended).toBe(true);
      expect(state.activeBanners.some((b) => b.type === 'danger')).toBe(true);

      await expect(
        customerLifecycleService.assertCanMutateOperationalData(orgId, actorId)
      ).rejects.toThrowError(/suspended/i);
    });

    it('restricts tenant when trial has expired without payment method', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);

      const mockOrg = {
        id: orgId,
        organisationId: orgId,
        organisationType: 'dance_studio',
        name: 'Expired Studio',
        slug: 'expired-studio',
        tenantStatus: 'trial',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'test',
        updatedBy: 'test'
      } as unknown as Organisation;

      const mockSub = {
        id: 'sub-expired',
        organisationId: orgId,
        planId: 'plan_starter',
        subscriptionStatus: 'trialing',
        billingInterval: 'monthly',
        priceAmount: 4900,
        currency: 'USD',
        trialEndsAt: pastDate.toISOString(),
        currentPeriodStart: pastDate.toISOString(),
        currentPeriodEnd: pastDate.toISOString(),
        billingMode: 'provider',
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as unknown as Subscription;

      vi.mocked(organisationRepository.getById).mockResolvedValue(mockOrg);
      vi.mocked(subscriptionResolverService.getCurrentSubscription).mockResolvedValue(mockSub);
      vi.mocked(subscriptionResolverService.getEffectivePlanId).mockResolvedValue('plan_starter');
      vi.mocked(subscriptionResolverService.isSubscriptionOperational).mockReturnValue(false);

      const state = await customerLifecycleService.getLifecycleState(orgId);
      expect(state.trialDaysRemaining).toBe(0);
      expect(state.isOperational).toBe(false);

      await expect(
        customerLifecycleService.assertCanMutateOperationalData(orgId, actorId)
      ).rejects.toThrowError(/trial expiry/i);
    });

    it('allows operational data during past-due grace period with a warning banner', async () => {
      const mockOrg = {
        id: orgId,
        organisationId: orgId,
        organisationType: 'dance_studio',
        name: 'Grace Period Studio',
        slug: 'grace-studio',
        tenantStatus: 'active',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'test',
        updatedBy: 'test'
      } as unknown as Organisation;

      const recentPastDue = new Date();
      recentPastDue.setDate(recentPastDue.getDate() - 3); // 3 days past due (within 7-day grace)

      const mockSub = {
        id: 'sub-past-due',
        organisationId: orgId,
        planId: 'plan_growth',
        subscriptionStatus: 'past_due',
        billingInterval: 'monthly',
        priceAmount: 9900,
        currency: 'USD',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: recentPastDue.toISOString(),
        billingMode: 'provider',
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
        updatedAt: recentPastDue.toISOString()
      } as unknown as Subscription;

      vi.mocked(organisationRepository.getById).mockResolvedValue(mockOrg);
      vi.mocked(subscriptionResolverService.getCurrentSubscription).mockResolvedValue(mockSub);
      vi.mocked(subscriptionResolverService.getEffectivePlanId).mockResolvedValue('plan_growth');
      vi.mocked(subscriptionResolverService.isSubscriptionOperational).mockReturnValue(true);

      const state = await customerLifecycleService.getLifecycleState(orgId);
      expect(state.isPastDue).toBe(true);
      expect(state.isOperational).toBe(true);
      expect(state.activeBanners.some((b) => b.id === 'past_due_warning')).toBe(true);

      await expect(
        customerLifecycleService.assertCanMutateOperationalData(orgId, actorId)
      ).resolves.not.toThrow();
    });
  });

  describe('Usage & Limit Metering Service', () => {
    it('returns calculated usage meters with correct statuses and percentages', async () => {
      const mockUsage = createMockUsage(orgId, {
        learnersCount: 45,
        staffUsersCount: 4,
        storageMb: 800,
        monthlyCommunicationsCount: 480,
        automationRunsCount: 15
      });

      vi.mocked(organisationUsageRepository.getByOrganisation).mockResolvedValue([mockUsage]);
      vi.mocked(organisationUsageRepository.getOrCreate).mockResolvedValue(mockUsage);
      vi.mocked(entitlementResolverService.getLimit).mockImplementation(async (_org, key) => {
        if (key === 'limits.learners') return 50; // 45/50 = 90% -> warning
        if (key === 'limits.staff_users') return 10; // 4/10 = 40% -> ok
        if (key === 'limits.storage_mb') return 1000; // 800/1000 = 80% -> warning
        if (key === 'limits.monthly_communications') return 500; // 480/500 = 96% -> critical
        if (key === 'limits.automation_runs') return null; // unlimited -> ok
        return null;
      });

      const summary = await usageMeteringService.getUsageMeters(orgId);

      expect(summary.meters['limits.learners'].percentUsed).toBe(90);
      expect(summary.meters['limits.learners'].status).toBe('critical');

      expect(summary.meters['limits.staff_users'].percentUsed).toBe(40);
      expect(summary.meters['limits.staff_users'].status).toBe('ok');

      expect(summary.meters['limits.monthly_communications'].percentUsed).toBe(96);
      expect(summary.meters['limits.monthly_communications'].status).toBe('critical');

      expect(summary.meters['limits.automation_runs'].limit).toBeNull();
      expect(summary.meters['limits.automation_runs'].status).toBe('ok');

      expect(summary.anyWarning).toBe(true);
      expect(summary.anyCritical).toBe(true);
      expect(summary.anyExceeded).toBe(false);
    });

    it('assertWithinLimit allows within limit and throws PlanLimitExceededError when capacity reached', async () => {
      const mockUsage = createMockUsage(orgId, {
        learnersCount: 50,
        staffUsersCount: 5,
        storageMb: 10,
        monthlyCommunicationsCount: 10,
        automationRunsCount: 5
      });

      vi.mocked(organisationUsageRepository.getByOrganisation).mockResolvedValue([mockUsage]);
      vi.mocked(organisationUsageRepository.getOrCreate).mockResolvedValue(mockUsage);
      vi.mocked(entitlementResolverService.getLimit).mockImplementation(async (_org, key) => {
        if (key === 'limits.learners') return 50;
        return null;
      });

      // Asserting 0 new items is ok (currently at 50/50)
      await expect(
        usageMeteringService.assertWithinLimit(orgId, 'limits.learners', 0)
      ).resolves.not.toThrow();

      // Asserting 1 new learner when current is 50 and limit is 50 must throw
      await expect(
        usageMeteringService.assertWithinLimit(orgId, 'limits.learners', 1)
      ).rejects.toThrowError(/would exceed your plan limit/i);
    });

    it('reconciles usage accurately from operational collections in syncAllUsage', async () => {
      vi.mocked(learnerRepository.getByOrganisation).mockResolvedValue([
        { id: 'l1', learnerStatus: 'active' },
        { id: 'l2', learnerStatus: 'active' },
        { id: 'l3', learnerStatus: 'archived' }
      ] as any);

      vi.mocked(organisationMembershipRepository.getByOrganisation).mockResolvedValue([
        { id: 'm1', role: 'teacher', membershipStatus: 'active' },
        { id: 'm2', role: 'admin', membershipStatus: 'active' }
      ] as OrganisationMembership[]);

      vi.mocked(documentRepository.getByOrganisation).mockResolvedValue([
        { id: 'd1', fileSizeBytes: 500000 },
        { id: 'd2', fileSizeBytes: 500000 }
      ] as any);

      const reconciledUsage = createMockUsage(orgId, {
        learnersCount: 2,
        staffUsersCount: 2,
        storageMb: 1
      });

      vi.mocked(organisationUsageRepository.getOrCreate).mockResolvedValue(reconciledUsage);
      vi.mocked(organisationUsageRepository.updateUsage).mockResolvedValue(reconciledUsage);
      vi.mocked(entitlementResolverService.getLimit).mockResolvedValue(100);

      const summary = await usageMeteringService.syncAllUsage(orgId, actorId);

      expect(summary.meters['limits.learners'].current).toBe(2); // 2 active learners
      expect(summary.meters['limits.staff_users'].current).toBe(2); // 2 active staff
      expect(summary.meters['limits.storage_mb'].current).toBe(1); // 1,000,000 bytes ≈ 1 MB
    });
  });

  describe('Operational Mutation Guards Integration', () => {
    it('prevents creating a learner if the plan limit is reached', async () => {
      const mockUsage = createMockUsage(orgId, {
        learnersCount: 25,
        staffUsersCount: 3,
        storageMb: 100
      });

      vi.mocked(organisationUsageRepository.getByOrganisation).mockResolvedValue([mockUsage]);
      vi.mocked(organisationUsageRepository.getOrCreate).mockResolvedValue(mockUsage);
      vi.mocked(entitlementResolverService.getLimit).mockResolvedValue(25); // Limit is 25!
      vi.mocked(organisationRepository.getById).mockResolvedValue({
        id: orgId,
        name: 'Dance Lab',
        tenantStatus: 'active'
      } as Organisation);

      await expect(
        learnerService.createLearner(orgId, actorId, {
          firstName: 'Sarah',
          lastName: 'Smith',
          dateOfBirth: '2010-05-10'
        } as any)
      ).rejects.toThrowError(/would exceed your plan limit/i);
    });

    it('records meter consumption when creating a learner within limits', async () => {
      const mockUsage = createMockUsage(orgId, {
        learnersCount: 10,
        staffUsersCount: 3,
        storageMb: 100
      });

      vi.mocked(organisationUsageRepository.getByOrganisation).mockResolvedValue([mockUsage]);
      vi.mocked(organisationUsageRepository.getOrCreate).mockResolvedValue(mockUsage);
      vi.mocked(entitlementResolverService.getLimit).mockResolvedValue(50);
      vi.mocked(organisationRepository.getById).mockResolvedValue({
        id: orgId,
        name: 'Dance Lab',
        tenantStatus: 'active'
      } as Organisation);

      const createdLearner: Learner = {
        id: 'learner-created',
        organisationId: orgId,
        firstName: 'Anna',
        lastName: 'Pavlova',
        learnerStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as any;

      vi.mocked(learnerRepository.create).mockResolvedValue(createdLearner);

      const result = await learnerService.createLearner(orgId, actorId, {
        firstName: 'Anna',
        lastName: 'Pavlova',
        dateOfBirth: '2012-01-01'
      } as any);

      expect(result.id).toBe('learner-created');
      expect(organisationUsageRepository.incrementMeter).toHaveBeenCalledWith(
        orgId,
        actorId,
        'limits.learners',
        1
      );
    });
  });
});
