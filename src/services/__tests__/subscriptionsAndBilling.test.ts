import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saasSubscriptionService } from '../billing/saasSubscriptionService';
import { subscriptionResolverService } from '../billing/subscriptionResolverService';
import { subscriptionAccessPolicyService } from '../billing/subscriptionAccessPolicyService';
import { saasBillingService } from '../billing/saasBillingService';
import { subscriptionLifecycleRunner } from '../billing/subscriptionLifecycleRunner';
import { subscriptionRepository } from '../../repositories/subscriptionRepository';
import { subscriptionPlanRepository } from '../../repositories/subscriptionPlanRepository';
import { organisationRepository } from '../../repositories/organisationRepository';
import { saasBillingEventRepository } from '../../repositories/saasBillingEventRepository';
import { tenantLifecycleService } from '../tenantLifecycleService';
import { auditService } from '../auditService';
import type { Subscription, SubscriptionPlan, Organisation, SaaSBillingEvent } from '../../types';

// Mock DB and Repositories
vi.mock('../../lib/firebase', () => ({
  db: {}
}));

vi.mock('../../repositories/subscriptionRepository', () => ({
  subscriptionRepository: {
    getById: vi.fn(),
    getAll: vi.fn(),
    getByOrganisation: vi.fn(),
    getPrimarySubscription: vi.fn(),
    getByProviderSubscriptionId: vi.fn(),
    save: vi.fn(),
    update: vi.fn()
  }
}));

vi.mock('../../repositories/subscriptionPlanRepository', () => ({
  subscriptionPlanRepository: {
    getById: vi.fn(),
    getAll: vi.fn()
  }
}));

vi.mock('../../repositories/organisationRepository', () => ({
  organisationRepository: {
    getById: vi.fn(),
    getAll: vi.fn(),
    update: vi.fn()
  }
}));

vi.mock('../../repositories/saasBillingEventRepository', () => ({
  saasBillingEventRepository: {
    getById: vi.fn(),
    getByEventIdentity: vi.fn(),
    save: vi.fn(),
    update: vi.fn()
  }
}));

vi.mock('../tenantLifecycleService', () => ({
  tenantLifecycleService: {
    updateTenantStatus: vi.fn()
  }
}));

vi.mock('../auditService', () => ({
  auditService: {
    log: vi.fn()
  }
}));

describe('SaaS 2B: Subscriptions and Billing Commercial Layer', () => {
  const mockOrg: Organisation = {
    id: 'org_test_1',
    organisationId: 'org_test_1',
    name: 'Soweto Arts Academy',
    organisationType: 'arts_academy',
    tenantStatus: 'active',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system'
  };

  const mockPlan: SubscriptionPlan = {
    id: 'plan_professional',
    name: 'Professional Tier',
    code: 'professional',
    planStatus: 'active',
    displayOrder: 2,
    isPublic: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system',
    status: 'active'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(organisationRepository.getById).mockResolvedValue(mockOrg);
    vi.mocked(subscriptionPlanRepository.getById).mockResolvedValue(mockPlan);
    vi.mocked(subscriptionRepository.getPrimarySubscription).mockResolvedValue(null);
    vi.mocked(subscriptionRepository.save).mockResolvedValue(undefined);
    vi.mocked(subscriptionRepository.update).mockResolvedValue(undefined);
    vi.mocked(auditService.log).mockResolvedValue(undefined);
  });

  describe('1. Subscription Lifecycle Management', () => {
    it('creates a commercial 14-day trial with trialing status and price 0', async () => {
      const sub = await saasSubscriptionService.createTrial('admin_1', 'org_test_1', {
        planId: 'plan_professional',
        trialDays: 14
      });

      expect(sub.subscriptionStatus).toBe('trialing');
      expect(sub.priceAmount).toBe(0);
      expect(sub.billingMode).toBe('manual');
      expect(sub.trialStartedAt).toBeDefined();
      expect(sub.trialEndsAt).toBeDefined();
      expect(subscriptionRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: sub.id,
        subscriptionStatus: 'trialing'
      }));
      expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
        action: 'PLATFORM_START_TRIAL'
      }));
    });

    it('prevents starting a trial if organization already has an active subscription', async () => {
      vi.mocked(subscriptionRepository.getPrimarySubscription).mockResolvedValueOnce({
        id: 'sub_existing',
        subscriptionStatus: 'active'
      } as Subscription);

      await expect(
        saasSubscriptionService.createTrial('admin_1', 'org_test_1', {
          planId: 'plan_professional'
        })
      ).rejects.toThrow(/already has an active or trialing subscription/);
    });

    it('creates a manual subscription with required justification and integer price', async () => {
      const sub = await saasSubscriptionService.createManualSubscription('admin_1', 'org_test_1', {
        planId: 'plan_professional',
        billingInterval: 'monthly',
        currency: 'ZAR',
        priceAmount: 129900, // R1,299.00
        reason: 'Offline enterprise invoice signed'
      });

      expect(sub.subscriptionStatus).toBe('active');
      expect(sub.billingMode).toBe('manual');
      expect(sub.priceAmount).toBe(129900);
      expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
        action: 'PLATFORM_CREATE_SUBSCRIPTION',
        reason: 'Offline enterprise invoice signed'
      }));
    });

    it('creates complimentary access with mandatory reason and 0 price', async () => {
      const sub = await saasSubscriptionService.createComplimentarySubscription('admin_1', 'org_test_1', {
        planId: 'plan_professional',
        reason: 'Pilot arts partner complimentary grant'
      });

      expect(sub.subscriptionStatus).toBe('active');
      expect(sub.billingMode).toBe('complimentary');
      expect(sub.priceAmount).toBe(0);
      expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
        action: 'PLATFORM_CREATE_COMPLIMENTARY_SUBSCRIPTION'
      }));
    });

    it('handles cancellation: immediate vs period-end', async () => {
      const existingSub: Subscription = {
        id: 'sub_active_1',
        organisationId: 'org_test_1',
        planId: 'plan_professional',
        subscriptionStatus: 'active',
        billingMode: 'provider',
        billingInterval: 'monthly',
        currency: 'ZAR',
        priceAmount: 129900,
        cancelAtPeriodEnd: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'admin_1',
        updatedBy: 'admin_1',
        status: 'active'
      };
      vi.mocked(subscriptionRepository.getById).mockResolvedValue(existingSub);

      // Period end
      const periodEndSub = await saasSubscriptionService.cancelSubscription('admin_1', 'sub_active_1', {
        cancelAtPeriodEnd: true,
        reason: 'Customer requested cancellation at renewal'
      });
      expect(periodEndSub.cancelAtPeriodEnd).toBe(true);
      expect(periodEndSub.subscriptionStatus).toBe('active');

      // Immediate
      const immediateSub = await saasSubscriptionService.cancelSubscription('admin_1', 'sub_active_1', {
        cancelAtPeriodEnd: false,
        reason: 'Customer requested immediate termination'
      });
      expect(immediateSub.subscriptionStatus).toBe('cancelled');
    });

    it('reactivates a cancelled subscription', async () => {
      const cancelledSub: Subscription = {
        id: 'sub_canc_1',
        organisationId: 'org_test_1',
        planId: 'plan_professional',
        subscriptionStatus: 'cancelled',
        billingMode: 'manual',
        billingInterval: 'monthly',
        currency: 'ZAR',
        priceAmount: 129900,
        cancelAtPeriodEnd: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'admin_1',
        updatedBy: 'admin_1',
        status: 'active'
      };
      vi.mocked(subscriptionRepository.getById).mockResolvedValue(cancelledSub);

      const reactivated = await saasSubscriptionService.reactivateSubscription('admin_1', 'sub_canc_1');
      expect(reactivated.subscriptionStatus).toBe('active');
      expect(reactivated.cancelAtPeriodEnd).toBe(false);
      expect(reactivated.reactivatedAt).toBeDefined();
    });

    it('expires trial and triggers tenant restriction', async () => {
      const trialSub: Subscription = {
        id: 'sub_trial_exp',
        organisationId: 'org_test_1',
        planId: 'plan_professional',
        subscriptionStatus: 'trialing',
        billingMode: 'manual',
        billingInterval: 'monthly',
        currency: 'ZAR',
        priceAmount: 0,
        cancelAtPeriodEnd: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'admin_1',
        updatedBy: 'admin_1',
        status: 'active'
      };
      vi.mocked(subscriptionRepository.getById).mockResolvedValue(trialSub);

      const expired = await saasSubscriptionService.expireTrial('sub_trial_exp');
      expect(expired.subscriptionStatus).toBe('expired');
      expect(tenantLifecycleService.updateTenantStatus).toHaveBeenCalledWith(expect.objectContaining({
        targetStatus: 'restricted',
        organisationId: 'org_test_1'
      }));
      expect(organisationRepository.update).toHaveBeenCalledWith('org_test_1', 'system', {
        restrictionReasonType: 'trial_expired'
      });
    });
  });

  describe('2. Subscription-to-Plan Resolution Hierarchy', () => {
    it('resolves plan from active subscription when present', async () => {
      vi.mocked(subscriptionRepository.getPrimarySubscription).mockResolvedValueOnce({
        id: 'sub_1',
        organisationId: 'org_test_1',
        planId: 'plan_premium',
        subscriptionStatus: 'active',
        billingMode: 'manual',
        billingInterval: 'monthly',
        currency: 'ZAR',
        priceAmount: 249900,
        cancelAtPeriodEnd: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'admin_1',
        updatedBy: 'admin_1',
        status: 'active'
      });

      const effectivePlanId = await subscriptionResolverService.getEffectivePlanId('org_test_1');
      expect(effectivePlanId).toBe('plan_premium');
    });

    it('falls back to transitional assigned plan when no active subscription exists', async () => {
      vi.mocked(subscriptionRepository.getPrimarySubscription).mockResolvedValueOnce(null);
      vi.mocked(organisationRepository.getById).mockResolvedValueOnce({
        ...mockOrg,
        assignedPlanId: 'plan_starter'
      });

      const effectivePlanId = await subscriptionResolverService.getEffectivePlanId('org_test_1');
      expect(effectivePlanId).toBe('plan_starter');
    });

    it('falls back to legacy full access (plan_legacy_full) when no subscription or assigned plan exists', async () => {
      vi.mocked(subscriptionRepository.getPrimarySubscription).mockResolvedValueOnce(null);
      vi.mocked(organisationRepository.getById).mockResolvedValueOnce({
        ...mockOrg,
        assignedPlanId: undefined
      });

      const effectivePlanId = await subscriptionResolverService.getEffectivePlanId('org_test_1');
      expect(effectivePlanId).toBe('plan_legacy_full');
    });

    it('correctly reports operational status for active, trialing, past-due and cancelled subscriptions', () => {
      const activeSub = { subscriptionStatus: 'active' } as Subscription;
      expect(subscriptionResolverService.isSubscriptionOperational(activeSub)).toBe(true);

      const validTrialSub = {
        subscriptionStatus: 'trialing',
        trialEndsAt: new Date(Date.now() + 86400000).toISOString()
      } as Subscription;
      expect(subscriptionResolverService.isSubscriptionOperational(validTrialSub)).toBe(true);

      const expiredTrialSub = {
        subscriptionStatus: 'trialing',
        trialEndsAt: new Date(Date.now() - 86400000).toISOString()
      } as Subscription;
      expect(subscriptionResolverService.isSubscriptionOperational(expiredTrialSub)).toBe(false);

      const pastDueSub = { subscriptionStatus: 'past_due' } as Subscription;
      expect(subscriptionResolverService.isSubscriptionOperational(pastDueSub)).toBe(true);

      const cancelledSub = { subscriptionStatus: 'cancelled', cancelAtPeriodEnd: false } as Subscription;
      expect(subscriptionResolverService.isSubscriptionOperational(cancelledSub)).toBe(false);

      const periodEndCancelledSub = {
        subscriptionStatus: 'active',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date(Date.now() + 86400000).toISOString()
      } as Subscription;
      expect(subscriptionResolverService.isSubscriptionOperational(periodEndCancelledSub)).toBe(true);
    });
  });

  describe('3. Webhook Signature & Idempotency Protection', () => {
    it('fails when signature is invalid or missing', async () => {
      await expect(
        saasBillingService.processWebhook('{"id":"evt_1"}', 'invalid_signature')
      ).rejects.toThrow(/signature verification failed/i);
    });

    it('recognizes duplicate events and achieves idempotency without duplicate side-effects', async () => {
      const rawPayload = JSON.stringify({
        id: 'evt_dup_123',
        type: 'invoice_paid',
        data: {
          organisationId: 'org_test_1',
          internalSubscriptionId: 'sub_1'
        }
      });

      vi.mocked(saasBillingEventRepository.getByEventIdentity).mockResolvedValueOnce({
        id: 'bevt_existing_1',
        providerType: 'sandbox',
        providerEventId: 'evt_dup_123',
        eventType: 'invoice_paid',
        processingStatus: 'processed'
      } as SaaSBillingEvent);

      const result = await saasBillingService.processWebhook(rawPayload, 'valid_sig_sandbox');
      expect(result.success).toBe(true);
      expect(result.idempotentDuplicate).toBe(true);
      // Ensure no new database save or audit log occurred for the duplicate
      expect(saasBillingEventRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('4. Platform Manual Suspension Protection', () => {
    it('does NOT restore tenant if tenant was manually suspended by platform admin', async () => {
      vi.mocked(organisationRepository.getById).mockResolvedValueOnce({
        ...mockOrg,
        tenantStatus: 'suspended',
        restrictionReasonType: 'manual_platform_action'
      });

      const recovery = await subscriptionAccessPolicyService.handlePaymentRecovery('org_test_1', {
        id: 'sub_1'
      } as Subscription);

      expect(recovery.restored).toBe(false);
      expect(recovery.reason).toContain('manually suspended');
      expect(tenantLifecycleService.updateTenantStatus).not.toHaveBeenCalled();
    });

    it('does NOT lift restriction if restriction was applied manually by platform admin', async () => {
      vi.mocked(organisationRepository.getById).mockResolvedValueOnce({
        ...mockOrg,
        tenantStatus: 'restricted',
        restrictionReasonType: 'manual_platform_action'
      });

      const recovery = await subscriptionAccessPolicyService.handlePaymentRecovery('org_test_1', {
        id: 'sub_1'
      } as Subscription);

      expect(recovery.restored).toBe(false);
      expect(recovery.reason).toContain('manual platform action');
      expect(tenantLifecycleService.updateTenantStatus).not.toHaveBeenCalled();
    });

    it('restores commercial tenant restriction after payment if restricted specifically for billing_past_due', async () => {
      vi.mocked(organisationRepository.getById).mockResolvedValueOnce({
        ...mockOrg,
        tenantStatus: 'restricted',
        restrictionReasonType: 'billing_past_due'
      });

      const recovery = await subscriptionAccessPolicyService.handlePaymentRecovery('org_test_1', {
        id: 'sub_1'
      } as Subscription);

      expect(recovery.restored).toBe(true);
      expect(tenantLifecycleService.updateTenantStatus).toHaveBeenCalledWith(expect.objectContaining({
        targetStatus: 'active',
        organisationId: 'org_test_1'
      }));
      expect(organisationRepository.update).toHaveBeenCalledWith('org_test_1', 'system', {
        restrictionReasonType: undefined
      });
      expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
        action: 'PLATFORM_RESTORE_TENANT_AFTER_BILLING'
      }));
    });
  });

  describe('5. Lifecycle Runner Background Automation', () => {
    it('processes expired trials and concludes period-end cancellations', async () => {
      const now = Date.now();
      const subs: Subscription[] = [
        // Expired trial
        {
          id: 'sub_exp_trial',
          organisationId: 'org_test_1',
          planId: 'plan_professional',
          subscriptionStatus: 'trialing',
          billingMode: 'manual',
          billingInterval: 'monthly',
          currency: 'ZAR',
          priceAmount: 0,
          trialEndsAt: new Date(now - 10000).toISOString(),
          cancelAtPeriodEnd: false,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          createdBy: 'admin_1',
          updatedBy: 'admin_1',
          status: 'active'
        },
        // Active healthy subscription
        {
          id: 'sub_healthy',
          organisationId: 'org_test_2',
          planId: 'plan_professional',
          subscriptionStatus: 'active',
          billingMode: 'manual',
          billingInterval: 'monthly',
          currency: 'ZAR',
          priceAmount: 129900,
          currentPeriodEnd: new Date(now + 10000000).toISOString(),
          cancelAtPeriodEnd: false,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          createdBy: 'admin_1',
          updatedBy: 'admin_1',
          status: 'active'
        },
        // Period end cancellation due
        {
          id: 'sub_period_cancel',
          organisationId: 'org_test_3',
          planId: 'plan_professional',
          subscriptionStatus: 'active',
          billingMode: 'provider',
          billingInterval: 'monthly',
          currency: 'ZAR',
          priceAmount: 129900,
          cancelAtPeriodEnd: true,
          currentPeriodEnd: new Date(now - 5000).toISOString(),
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          createdBy: 'admin_1',
          updatedBy: 'admin_1',
          status: 'active'
        }
      ];

      vi.mocked(subscriptionRepository.getAll).mockResolvedValue(subs);
      vi.mocked(subscriptionRepository.getById).mockImplementation(async (id) => {
        return subs.find((s) => s.id === id) || null;
      });

      const report = await subscriptionLifecycleRunner.runDailyLifecycleCheck();

      expect(report.expiredTrials).toBe(1);
      expect(report.periodEndCancelled).toBe(1);
      expect(subscriptionRepository.update).toHaveBeenCalledWith('sub_period_cancel', expect.objectContaining({
        subscriptionStatus: 'cancelled'
      }));
    });
  });
});
