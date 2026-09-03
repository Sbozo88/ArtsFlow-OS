import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subscriptionLifecycleRunner } from '../billing/subscriptionLifecycleRunner';
import { subscriptionRepository } from '../../repositories/subscriptionRepository';
import { organisationRepository } from '../../repositories/organisationRepository';
import { tenantLifecycleService } from '../tenantLifecycleService';
import { saasSubscriptionService } from '../billing/saasSubscriptionService';
import { auditService } from '../auditService';
import type { Subscription, Organisation } from '../../types';

vi.mock('../../lib/firebase', () => ({
  db: {}
}));

vi.mock('../../repositories/subscriptionRepository', () => ({
  subscriptionRepository: {
    getAll: vi.fn(),
    getPrimarySubscription: vi.fn(),
    update: vi.fn()
  }
}));

vi.mock('../../repositories/organisationRepository', () => ({
  organisationRepository: {
    getById: vi.fn(),
    update: vi.fn()
  }
}));

vi.mock('../tenantLifecycleService', () => ({
  tenantLifecycleService: {
    updateTenantStatus: vi.fn()
  }
}));

vi.mock('../billing/saasSubscriptionService', () => ({
  saasSubscriptionService: {
    expireTrial: vi.fn()
  }
}));

vi.mock('../auditService', () => ({
  auditService: {
    log: vi.fn()
  }
}));

describe('Subscription Lifecycle Automation Runner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('expires overdue trialing subscriptions and calls expireTrial in live mode', async () => {
    const overdueTrialSub: Partial<Subscription> = {
      id: 'sub_overdue_trial',
      organisationId: 'org_alpha',
      subscriptionStatus: 'trialing',
      trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    };

    vi.mocked(subscriptionRepository.getAll).mockResolvedValue([overdueTrialSub as Subscription]);
    vi.mocked(saasSubscriptionService.expireTrial).mockResolvedValue({} as any);

    const result = await subscriptionLifecycleRunner.runDailyLifecycleCheck();

    expect(result.expiredTrials).toBe(1);
    expect(result.pastDueRestricted).toBe(0);
    expect(result.periodEndCancelled).toBe(0);
    expect(result.dryRun).toBe(false);
    expect(saasSubscriptionService.expireTrial).toHaveBeenCalledWith('sub_overdue_trial');
  });

  it('detects overdue trialing subscriptions without writing mutations in dry-run mode', async () => {
    const overdueTrialSub: Partial<Subscription> = {
      id: 'sub_overdue_trial_dry',
      organisationId: 'org_alpha',
      subscriptionStatus: 'trialing',
      trialEndsAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    };

    vi.mocked(subscriptionRepository.getAll).mockResolvedValue([overdueTrialSub as Subscription]);

    const result = await subscriptionLifecycleRunner.runDailyLifecycleCheck({ dryRun: true });

    expect(result.expiredTrials).toBe(1);
    expect(result.dryRun).toBe(true);
    expect(saasSubscriptionService.expireTrial).not.toHaveBeenCalled();
  });

  it('restricts active tenant when past-due subscription exceeds grace period (7 days)', async () => {
    const pastDueSub: Partial<Subscription> = {
      id: 'sub_past_due_overdue',
      organisationId: 'org_beta',
      subscriptionStatus: 'past_due',
      currentPeriodEnd: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago (grace is 7)
    };

    const activeOrg: Partial<Organisation> = {
      id: 'org_beta',
      name: 'Beta Dance Academy',
      tenantStatus: 'active'
    };

    vi.mocked(subscriptionRepository.getAll).mockResolvedValue([pastDueSub as Subscription]);
    vi.mocked(organisationRepository.getById).mockResolvedValue(activeOrg as Organisation);

    const result = await subscriptionLifecycleRunner.runDailyLifecycleCheck();

    expect(result.pastDueRestricted).toBe(1);
    expect(tenantLifecycleService.updateTenantStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        organisationId: 'org_beta',
        targetStatus: 'restricted',
        reason: 'Subscription past due grace period expired.'
      })
    );
    expect(organisationRepository.update).toHaveBeenCalledWith(
      'org_beta',
      'system',
      expect.objectContaining({ restrictionReasonType: 'billing_past_due' })
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        organisationId: 'org_beta',
        action: 'PLATFORM_RESTRICT_TENANT_FOR_BILLING'
      })
    );
  });

  it('transitions active subscription marked cancelAtPeriodEnd to cancelled when period concludes', async () => {
    const concludedSub: Partial<Subscription> = {
      id: 'sub_cancel_pending',
      organisationId: 'org_gamma',
      subscriptionStatus: 'active',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date(Date.now() - 1000).toISOString() // expired 1s ago
    };

    const activeOrg: Partial<Organisation> = {
      id: 'org_gamma',
      tenantStatus: 'active'
    };

    vi.mocked(subscriptionRepository.getAll).mockResolvedValue([concludedSub as Subscription]);
    vi.mocked(subscriptionRepository.getPrimarySubscription).mockResolvedValue({
      id: 'sub_cancel_pending',
      subscriptionStatus: 'cancelled'
    } as any);
    vi.mocked(organisationRepository.getById).mockResolvedValue(activeOrg as Organisation);

    const result = await subscriptionLifecycleRunner.runDailyLifecycleCheck();

    expect(result.periodEndCancelled).toBe(1);
    expect(subscriptionRepository.update).toHaveBeenCalledWith(
      'sub_cancel_pending',
      expect.objectContaining({
        subscriptionStatus: 'cancelled',
        cancelAtPeriodEnd: false
      })
    );
    expect(tenantLifecycleService.updateTenantStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        organisationId: 'org_gamma',
        targetStatus: 'restricted'
      })
    );
  });

  it('resiliently handles errors without halting iteration over other subscriptions', async () => {
    const failingSub: Partial<Subscription> = {
      id: 'sub_broken',
      organisationId: 'org_err',
      subscriptionStatus: 'trialing',
      trialEndsAt: new Date(Date.now() - 10000).toISOString()
    };
    const healthySub: Partial<Subscription> = {
      id: 'sub_healthy',
      organisationId: 'org_ok',
      subscriptionStatus: 'trialing',
      trialEndsAt: new Date(Date.now() - 10000).toISOString()
    };

    vi.mocked(subscriptionRepository.getAll).mockResolvedValue([
      failingSub as Subscription,
      healthySub as Subscription
    ]);
    vi.mocked(saasSubscriptionService.expireTrial)
      .mockRejectedValueOnce(new Error('Simulated Firestore write failure'))
      .mockResolvedValueOnce({} as any);

    const result = await subscriptionLifecycleRunner.runDailyLifecycleCheck();

    expect(result.expiredTrials).toBe(1); // healthy one succeeded
  });
});
