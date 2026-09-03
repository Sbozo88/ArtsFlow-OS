import { organisationRepository } from '../repositories/organisationRepository';
import { subscriptionResolverService } from './billing/subscriptionResolverService';
import { subscriptionRepository } from '../repositories/subscriptionRepository';
import { tenantLifecycleService } from './tenantLifecycleService';
import { tenantAccessService } from './tenantAccessService';
import { SubscriptionAccessPolicyService } from './billing/subscriptionAccessPolicyService';
import { auditService } from './auditService';
import {
  type CustomerLifecycleState,
  type LifecycleNoticeBanner,
  type LifecycleAccessLevel,
  TenantRestrictedError
} from '../types';

export class CustomerLifecycleService {
  /**
   * Evaluates the complete customer lifecycle state for an organisation.
   */
  async getLifecycleState(organisationId: string): Promise<CustomerLifecycleState> {
    const org = await organisationRepository.getById(organisationId);
    if (!org) {
      throw new Error(`Organisation not found: ${organisationId}`);
    }

    const sub = await subscriptionResolverService.getCurrentSubscription(organisationId);
    const planId = await subscriptionResolverService.getEffectivePlanId(organisationId);
    const tenantStatus = org.tenantStatus || 'active';
    const now = Date.now();

    // 1. Trial Metadata
    const isTrialExpired = Boolean(
      (sub?.subscriptionStatus === 'trialing' || tenantStatus === 'trial') &&
      sub?.trialEndsAt &&
      new Date(sub.trialEndsAt).getTime() <= now
    );

    const isTrialing =
      !isTrialExpired &&
      (sub?.subscriptionStatus === 'trialing' ||
      tenantStatus === 'trial' ||
      Boolean(sub?.trialEndsAt && new Date(sub.trialEndsAt).getTime() > now));

    let trialDaysRemaining: number | undefined = undefined;
    let isTrialExpiringSoon = false;

    if (sub?.trialEndsAt) {
      const msLeft = new Date(sub.trialEndsAt).getTime() - now;
      trialDaysRemaining = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
      isTrialExpiringSoon = trialDaysRemaining <= 3 && trialDaysRemaining > 0;
    }

    // 2. Past-Due Metadata
    const isPastDue = sub?.subscriptionStatus === 'past_due';
    let pastDueGraceDaysRemaining: number | undefined = undefined;
    let isGraceExpiringSoon = false;

    if (isPastDue && sub?.currentPeriodEnd) {
      const graceMs =
        SubscriptionAccessPolicyService.DEFAULT_PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000;
      const graceExpiry = new Date(sub.currentPeriodEnd).getTime() + graceMs;
      const msLeft = graceExpiry - now;
      pastDueGraceDaysRemaining = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
      isGraceExpiringSoon = pastDueGraceDaysRemaining <= 2;
    }

    // 3. Restriction / Suspension Metadata
    const isRestricted = tenantStatus === 'restricted' || isTrialExpired;
    const isSuspended = tenantStatus === 'suspended';
    const isOperational = tenantAccessService.isTenantOperational(tenantStatus) && !isTrialExpired && !isRestricted;

    let accessLevel: LifecycleAccessLevel = 'full';
    if (isSuspended) {
      accessLevel = 'blocked';
    } else if (isRestricted || !isOperational) {
      accessLevel = 'read_only_admin';
    }

    // 4. Build Active Banners
    const activeBanners: LifecycleNoticeBanner[] = [];

    if (isSuspended) {
      activeBanners.push({
        id: 'suspended_notice',
        type: 'danger',
        title: 'Organisation Suspended',
        message:
          org.suspensionReason ||
          'This organisation has been suspended by platform administration. All access is currently paused.',
        ctaLabel: 'Contact Support',
        ctaAction: 'contact_support'
      });
    } else if (isTrialExpired) {
      activeBanners.push({
        id: 'trial_expired',
        type: 'danger',
        title: 'Trial Expired',
        message:
          'Your trial has expired. Operational features are paused until you choose a subscription plan.',
        ctaLabel: 'Choose Plan',
        ctaAction: 'upgrade',
        ctaPath: '/settings/billing'
      });
    } else if (isRestricted) {
      const msg =
        org.restrictionReason ||
        (org.restrictionReasonType === 'trial_expired'
          ? 'Your 14-day free trial has expired. Operational features are paused until you choose a subscription plan.'
          : org.restrictionReasonType === 'billing_past_due'
            ? 'Your renewal payment grace period has elapsed. Please settle your account to restore operational access.'
            : 'Operational access is currently restricted. School administrators retain read-only access to billing and export settings.');

      activeBanners.push({
        id: 'restricted_notice',
        type: 'danger',
        title: 'Account Restricted (Read-Only)',
        message: msg,
        ctaLabel: 'Manage Subscription',
        ctaAction: 'update_billing',
        ctaPath: '/settings/billing'
      });
    } else if (isPastDue) {
      const days = pastDueGraceDaysRemaining !== undefined ? pastDueGraceDaysRemaining : 0;
      activeBanners.push({
        id: 'past_due_warning',
        type: 'danger',
        title: 'Payment Past Due',
        message: `Your last renewal payment was unsuccessful. You have ${days} day${days === 1 ? '' : 's'} remaining in your grace period before operational access is restricted.`,
        ctaLabel: 'Update Payment Method',
        ctaAction: 'update_billing',
        ctaPath: '/settings/billing'
      });
    } else if (isTrialing && trialDaysRemaining !== undefined) {
      activeBanners.push({
        id: 'trial_countdown',
        type: isTrialExpiringSoon ? 'warning' : 'info',
        title: trialDaysRemaining === 0 ? 'Trial Expires Today' : `${trialDaysRemaining} Day${trialDaysRemaining === 1 ? '' : 's'} Remaining in Trial`,
        message: 'You are currently on a full-feature trial. Choose a commercial plan to keep your school operating smoothly.',
        ctaLabel: 'Select a Plan',
        ctaAction: 'upgrade',
        ctaPath: '/settings/billing'
      });
    }

    return {
      organisationId,
      tenantStatus,
      subscriptionStatus: sub?.subscriptionStatus,
      planId,
      planName: planId.replace(/^plan_/, '').replace(/_/g, ' ').toUpperCase(),
      isOperational,
      accessLevel,

      isTrialing,
      trialEndsAt: sub?.trialEndsAt,
      trialDaysRemaining,
      isTrialExpiringSoon,

      isPastDue,
      pastDueSince: sub?.currentPeriodEnd,
      pastDueGraceDaysRemaining,
      isGraceExpiringSoon,

      isRestricted,
      restrictionReason: org.restrictionReason,
      restrictionReasonType: org.restrictionReasonType,
      isSuspended,
      suspensionReason: org.suspensionReason,

      activeBanners
    };
  }

  /**
   * Asserts whether mutations on operational data (learners, classes, documents, invoices) are permitted.
   * Throws TenantRestrictedError if restricted or suspended.
   */
  async assertCanMutateOperationalData(organisationId: string, _role?: string): Promise<void> {
    const state = await this.getLifecycleState(organisationId);

    if (state.isSuspended) {
      throw new Error(
        state.suspensionReason || 'Organisation has been suspended by platform administration.'
      );
    }

    if (state.isRestricted) {
      throw new TenantRestrictedError(
        state.restrictionReason ||
          'Organisation is restricted due to billing or trial expiry. Operational mutations are paused.',
        state.restrictionReasonType
      );
    }

    if (!state.isOperational) {
      throw new TenantRestrictedError(
        'Organisation is not operational.',
        state.restrictionReasonType
      );
    }
  }

  /**
   * Evaluates lifecycle boundaries and applies automated transitions if expired.
   */
  async runLifecycleEvaluation(
    organisationId: string,
    actorId: string = 'system'
  ): Promise<CustomerLifecycleState> {
    const org = await organisationRepository.getById(organisationId);
    if (!org) {
      throw new Error(`Organisation not found: ${organisationId}`);
    }

    const sub = await subscriptionResolverService.getCurrentSubscription(organisationId);
    const now = Date.now();

    // 1. Trial Expiry Check
    if (
      sub &&
      sub.subscriptionStatus === 'trialing' &&
      sub.trialEndsAt &&
      new Date(sub.trialEndsAt).getTime() <= now
    ) {
      if (org.tenantStatus === 'trial' || org.tenantStatus === 'active') {
        await tenantLifecycleService.updateTenantStatus({
          actorId,
          organisationId,
          targetStatus: 'restricted',
          reason: '14-day trial period expired without commercial plan selection.'
        });

        await organisationRepository.update(organisationId, actorId, {
          restrictionReasonType: 'trial_expired'
        });

        await subscriptionRepository.update(sub.id, {
          subscriptionStatus: 'expired',
          expiryReason: 'Trial period concluded.',
          updatedAt: new Date().toISOString()
        });

        await auditService.log({
          organisationId,
          actorId,
          action: 'PLATFORM_RESTRICT_TENANT_FOR_BILLING',
          entityType: 'subscription',
          entityId: sub.id,
          scopeType: 'platform',
          reason: 'Automated trial expiry restriction applied.'
        });
      }
    }

    // 2. Past-Due Grace Period Check
    if (
      sub &&
      sub.subscriptionStatus === 'past_due' &&
      sub.currentPeriodEnd
    ) {
      const graceMs =
        SubscriptionAccessPolicyService.DEFAULT_PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000;
      const graceExpiry = new Date(sub.currentPeriodEnd).getTime() + graceMs;

      if (graceExpiry <= now && org.tenantStatus === 'active') {
        await tenantLifecycleService.updateTenantStatus({
          actorId,
          organisationId,
          targetStatus: 'restricted',
          reason: 'Subscription past due grace period elapsed without payment recovery.'
        });

        await organisationRepository.update(organisationId, actorId, {
          restrictionReasonType: 'billing_past_due'
        });

        await auditService.log({
          organisationId,
          actorId,
          action: 'PLATFORM_RESTRICT_TENANT_FOR_BILLING',
          entityType: 'subscription',
          entityId: sub.id,
          scopeType: 'platform',
          reason: 'Automated past-due grace period restriction applied.'
        });
      }
    }

    return this.getLifecycleState(organisationId);
  }
}

export const customerLifecycleService = new CustomerLifecycleService();
