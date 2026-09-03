import { subscriptionRepository } from '../../repositories/subscriptionRepository';
import { subscriptionPlanRepository } from '../../repositories/subscriptionPlanRepository';
import { organisationRepository } from '../../repositories/organisationRepository';
import { auditService } from '../auditService';
import { tenantLifecycleService } from '../tenantLifecycleService';
import { entitlementResolverService } from '../entitlementResolverService';
import type {
  Subscription,
  BillingInterval
} from '../../types';

export interface CreateTrialOptions {
  planId: string;
  trialDays?: number;
  notes?: string;
}

export interface CreateManualSubscriptionOptions {
  planId: string;
  billingInterval: BillingInterval;
  currency: string;
  priceAmount: number; // In minor units (cents)
  currentPeriodDays?: number;
  reason: string;
  notes?: string;
}

export interface CreateComplimentarySubscriptionOptions {
  planId: string;
  reason: string;
  expiresAt?: string;
  notes?: string;
}

export interface CancelSubscriptionOptions {
  cancelAtPeriodEnd: boolean;
  reason: string;
}

export interface ChangePlanOptions {
  effectiveImmediately?: boolean;
  reason?: string;
}

export const saasSubscriptionService = {
  /**
   * Starts a commercial trial for an organisation.
   */
  async createTrial(
    actorId: string,
    organisationId: string,
    options: CreateTrialOptions
  ): Promise<Subscription> {
    const org = await organisationRepository.getById(organisationId);
    if (!org) {
      throw new Error(`Organisation '${organisationId}' not found.`);
    }

    const plan = await subscriptionPlanRepository.getById(options.planId);
    if (!plan || plan.planStatus === 'archived') {
      throw new Error(`Plan '${options.planId}' is invalid or archived.`);
    }

    // Check for existing active or trialing subscription to prevent duplicates
    const primary = await subscriptionRepository.getPrimarySubscription(organisationId);
    if (primary && ['active', 'trialing'].includes(primary.subscriptionStatus)) {
      throw new Error(
        `Organisation '${organisationId}' already has an active or trialing subscription (${primary.id}).`
      );
    }

    const now = new Date();
    const trialDays = options.trialDays && options.trialDays > 0 ? options.trialDays : 14;
    const endsDate = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    const subscription: Subscription = {
      id: `sub_${organisationId}_trial_${Date.now()}`,
      organisationId,
      planId: plan.id,
      subscriptionStatus: 'trialing',
      billingMode: 'manual',
      billingInterval: 'monthly',
      currency: 'ZAR',
      priceAmount: 0,
      trialStartedAt: now.toISOString(),
      trialEndsAt: endsDate.toISOString(),
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: endsDate.toISOString(),
      cancelAtPeriodEnd: false,
      notes: options.notes,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: actorId,
      updatedBy: actorId,
      status: 'active'
    };

    await subscriptionRepository.save(subscription);

    await auditService.log({
      organisationId,
      actorId,
      action: 'PLATFORM_START_TRIAL',
      entityType: 'subscription',
      entityId: subscription.id,
      scopeType: 'platform',
      reason: `Started ${trialDays}-day trial on plan '${plan.name}' (${plan.code})`,
      after: {
        planId: plan.id,
        trialEndsAt: subscription.trialEndsAt
      }
    });

    await this.invalidateEntitlementCache(organisationId);

    return subscription;
  },

  /**
   * Creates a manual subscription (e.g. for offline invoicing, enterprise pilot).
   */
  async createManualSubscription(
    actorId: string,
    organisationId: string,
    options: CreateManualSubscriptionOptions
  ): Promise<Subscription> {
    if (!options.reason || options.reason.trim() === '') {
      throw new Error('A mandatory justification reason is required for creating a manual subscription.');
    }

    const org = await organisationRepository.getById(organisationId);
    if (!org) {
      throw new Error(`Organisation '${organisationId}' not found.`);
    }

    const plan = await subscriptionPlanRepository.getById(options.planId);
    if (!plan || plan.planStatus === 'archived') {
      throw new Error(`Plan '${options.planId}' is invalid or archived.`);
    }

    const now = new Date();
    const periodDays = options.currentPeriodDays || (options.billingInterval === 'annual' ? 365 : 30);
    const endDate = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

    const subscription: Subscription = {
      id: `sub_${organisationId}_manual_${Date.now()}`,
      organisationId,
      planId: plan.id,
      subscriptionStatus: 'active',
      billingMode: 'manual',
      billingInterval: options.billingInterval,
      currency: options.currency.toUpperCase(),
      priceAmount: Math.round(options.priceAmount),
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: endDate.toISOString(),
      cancelAtPeriodEnd: false,
      notes: options.notes,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: actorId,
      updatedBy: actorId,
      status: 'active'
    };

    await subscriptionRepository.save(subscription);

    await auditService.log({
      organisationId,
      actorId,
      action: 'PLATFORM_CREATE_SUBSCRIPTION',
      entityType: 'subscription',
      entityId: subscription.id,
      scopeType: 'platform',
      reason: options.reason,
      after: {
        planId: plan.id,
        billingMode: 'manual',
        priceAmount: subscription.priceAmount
      }
    });

    await this.invalidateEntitlementCache(organisationId);

    return subscription;
  },

  /**
   * Grants complimentary access (e.g. pilot partner, internal demo).
   */
  async createComplimentarySubscription(
    actorId: string,
    organisationId: string,
    options: CreateComplimentarySubscriptionOptions
  ): Promise<Subscription> {
    if (!options.reason || options.reason.trim() === '') {
      throw new Error('A mandatory justification reason is required for complimentary access.');
    }

    const org = await organisationRepository.getById(organisationId);
    if (!org) {
      throw new Error(`Organisation '${organisationId}' not found.`);
    }

    const plan = await subscriptionPlanRepository.getById(options.planId);
    if (!plan || plan.planStatus === 'archived') {
      throw new Error(`Plan '${options.planId}' is invalid or archived.`);
    }

    const now = new Date();
    const endDate = options.expiresAt || new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const subscription: Subscription = {
      id: `sub_${organisationId}_comp_${Date.now()}`,
      organisationId,
      planId: plan.id,
      subscriptionStatus: 'active',
      billingMode: 'complimentary',
      billingInterval: 'annual',
      currency: 'ZAR',
      priceAmount: 0,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: endDate,
      cancelAtPeriodEnd: false,
      notes: options.notes,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: actorId,
      updatedBy: actorId,
      status: 'active'
    };

    await subscriptionRepository.save(subscription);

    await auditService.log({
      organisationId,
      actorId,
      action: 'PLATFORM_CREATE_COMPLIMENTARY_SUBSCRIPTION',
      entityType: 'subscription',
      entityId: subscription.id,
      scopeType: 'platform',
      reason: options.reason,
      after: {
        planId: plan.id,
        billingMode: 'complimentary',
        expiresAt: endDate
      }
    });

    await this.invalidateEntitlementCache(organisationId);

    return subscription;
  },

  /**
   * Transitions subscription to active state from provider confirmation or admin action.
   */
  async activateSubscription(
    actorId: string,
    subscriptionId: string,
    providerDetails?: {
      providerType?: string;
      providerCustomerId?: string;
      providerSubscriptionId?: string;
      currentPeriodStart?: string;
      currentPeriodEnd?: string;
    }
  ): Promise<Subscription> {
    const sub = await subscriptionRepository.getById(subscriptionId);
    if (!sub) {
      throw new Error(`Subscription '${subscriptionId}' not found.`);
    }

    const now = new Date().toISOString();
    const updates: Partial<Subscription> = {
      subscriptionStatus: 'active',
      cancelAtPeriodEnd: false,
      updatedAt: now,
      updatedBy: actorId,
      ...(providerDetails?.providerType && { providerType: providerDetails.providerType }),
      ...(providerDetails?.providerCustomerId && { providerCustomerId: providerDetails.providerCustomerId }),
      ...(providerDetails?.providerSubscriptionId && { providerSubscriptionId: providerDetails.providerSubscriptionId }),
      ...(providerDetails?.currentPeriodStart && { currentPeriodStart: providerDetails.currentPeriodStart }),
      ...(providerDetails?.currentPeriodEnd && { currentPeriodEnd: providerDetails.currentPeriodEnd })
    };

    await subscriptionRepository.update(subscriptionId, updates);

    await auditService.log({
      organisationId: sub.organisationId,
      actorId,
      action: 'PLATFORM_ACTIVATE_SUBSCRIPTION',
      entityType: 'subscription',
      entityId: subscriptionId,
      scopeType: 'platform',
      before: { subscriptionStatus: sub.subscriptionStatus },
      after: { subscriptionStatus: 'active' }
    });

    await this.invalidateEntitlementCache(sub.organisationId);

    return { ...sub, ...updates };
  },

  /**
   * Marks subscription as past due.
   */
  async markPastDue(
    subscriptionId: string,
    reason = 'Subscription payment failed or overdue'
  ): Promise<Subscription> {
    const sub = await subscriptionRepository.getById(subscriptionId);
    if (!sub) {
      throw new Error(`Subscription '${subscriptionId}' not found.`);
    }

    const now = new Date().toISOString();
    await subscriptionRepository.update(subscriptionId, {
      subscriptionStatus: 'past_due',
      updatedAt: now
    });

    await auditService.log({
      organisationId: sub.organisationId,
      actorId: 'system',
      action: 'PLATFORM_MARK_SUBSCRIPTION_PAST_DUE',
      entityType: 'subscription',
      entityId: subscriptionId,
      scopeType: 'platform',
      reason,
      before: { subscriptionStatus: sub.subscriptionStatus },
      after: { subscriptionStatus: 'past_due' }
    });

    await this.invalidateEntitlementCache(sub.organisationId);

    return { ...sub, subscriptionStatus: 'past_due', updatedAt: now };
  },

  /**
   * Cancels a subscription either at period end or immediately.
   */
  async cancelSubscription(
    actorId: string,
    subscriptionId: string,
    options: CancelSubscriptionOptions
  ): Promise<Subscription> {
    if (!options.reason || options.reason.trim() === '') {
      throw new Error('A mandatory reason is required for subscription cancellation.');
    }

    const sub = await subscriptionRepository.getById(subscriptionId);
    if (!sub) {
      throw new Error(`Subscription '${subscriptionId}' not found.`);
    }

    const now = new Date().toISOString();
    const updates: Partial<Subscription> = {
      cancelledAt: now,
      cancellationReason: options.reason,
      updatedAt: now,
      updatedBy: actorId
    };

    if (options.cancelAtPeriodEnd) {
      updates.cancelAtPeriodEnd = true;
      // Stays active until period end
    } else {
      updates.subscriptionStatus = 'cancelled';
      updates.cancelAtPeriodEnd = false;
    }

    await subscriptionRepository.update(subscriptionId, updates);

    await auditService.log({
      organisationId: sub.organisationId,
      actorId,
      action: 'PLATFORM_CANCEL_SUBSCRIPTION',
      entityType: 'subscription',
      entityId: subscriptionId,
      scopeType: 'platform',
      reason: options.reason,
      after: {
        cancelAtPeriodEnd: options.cancelAtPeriodEnd,
        subscriptionStatus: updates.subscriptionStatus || sub.subscriptionStatus
      }
    });

    await this.invalidateEntitlementCache(sub.organisationId);

    return { ...sub, ...updates };
  },

  /**
   * Reactivates a cancelled or paused subscription.
   */
  async reactivateSubscription(
    actorId: string,
    subscriptionId: string
  ): Promise<Subscription> {
    const sub = await subscriptionRepository.getById(subscriptionId);
    if (!sub) {
      throw new Error(`Subscription '${subscriptionId}' not found.`);
    }

    const now = new Date().toISOString();
    const updates: Partial<Subscription> = {
      subscriptionStatus: 'active',
      cancelAtPeriodEnd: false,
      reactivatedAt: now,
      updatedAt: now,
      updatedBy: actorId
    };

    await subscriptionRepository.update(subscriptionId, updates);

    await auditService.log({
      organisationId: sub.organisationId,
      actorId,
      action: 'PLATFORM_REACTIVATE_SUBSCRIPTION',
      entityType: 'subscription',
      entityId: subscriptionId,
      scopeType: 'platform',
      before: { subscriptionStatus: sub.subscriptionStatus },
      after: { subscriptionStatus: 'active' }
    });

    await this.invalidateEntitlementCache(sub.organisationId);

    return { ...sub, ...updates };
  },

  /**
   * Changes the subscription plan (upgrade / downgrade).
   */
  async changePlan(
    actorId: string,
    subscriptionId: string,
    newPlanId: string,
    options: ChangePlanOptions = {}
  ): Promise<Subscription> {
    const sub = await subscriptionRepository.getById(subscriptionId);
    if (!sub) {
      throw new Error(`Subscription '${subscriptionId}' not found.`);
    }

    const newPlan = await subscriptionPlanRepository.getById(newPlanId);
    if (!newPlan || newPlan.planStatus === 'archived') {
      throw new Error(`Plan '${newPlanId}' is invalid or archived.`);
    }

    const previousPlanId = sub.planId;
    const now = new Date().toISOString();

    const updates: Partial<Subscription> = {
      planId: newPlan.id,
      updatedAt: now,
      updatedBy: actorId
    };

    await subscriptionRepository.update(subscriptionId, updates);

    await auditService.log({
      organisationId: sub.organisationId,
      actorId,
      action: 'PLATFORM_CHANGE_SUBSCRIPTION_PLAN',
      entityType: 'subscription',
      entityId: subscriptionId,
      scopeType: 'platform',
      reason: options.reason || `Plan changed from ${previousPlanId} to ${newPlan.id}`,
      before: { planId: previousPlanId },
      after: { planId: newPlan.id }
    });

    await this.invalidateEntitlementCache(sub.organisationId);

    return { ...sub, ...updates };
  },

  /**
   * Expires a trial subscription and safely restricts tenant access.
   */
  async expireTrial(subscriptionId: string): Promise<Subscription> {
    const sub = await subscriptionRepository.getById(subscriptionId);
    if (!sub) {
      throw new Error(`Subscription '${subscriptionId}' not found.`);
    }

    const now = new Date().toISOString();
    await subscriptionRepository.update(subscriptionId, {
      subscriptionStatus: 'expired',
      updatedAt: now
    });

    // Safely apply tenant restriction policy
    try {
      const org = await organisationRepository.getById(sub.organisationId);
      if (org && org.tenantStatus === 'active') {
        await tenantLifecycleService.updateTenantStatus({
          actorId: 'system',
          organisationId: sub.organisationId,
          targetStatus: 'restricted',
          reason: 'Trial period has expired'
        });

        // Set restriction reason type
        await organisationRepository.update(sub.organisationId, 'system', {
          restrictionReasonType: 'trial_expired'
        });
      }
    } catch (err) {
      console.error(`[SaaSSubscriptionService] Failed to restrict tenant on trial expiry:`, err);
    }

    await auditService.log({
      organisationId: sub.organisationId,
      actorId: 'system',
      action: 'PLATFORM_RESTRICT_TENANT_FOR_BILLING',
      entityType: 'subscription',
      entityId: subscriptionId,
      scopeType: 'platform',
      reason: 'Trial expired; organisation restricted to read-only admin access.',
      after: { subscriptionStatus: 'expired' }
    });

    await this.invalidateEntitlementCache(sub.organisationId);

    return { ...sub, subscriptionStatus: 'expired', updatedAt: now };
  },

  async invalidateEntitlementCache(organisationId: string): Promise<void> {
    entitlementResolverService.invalidateCache(organisationId);
  }
};
