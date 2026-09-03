import { subscriptionRepository } from '../../repositories/subscriptionRepository';
import { organisationRepository } from '../../repositories/organisationRepository';
import type { Subscription } from '../../types';

export class SubscriptionResolverService {
  /**
   * Resolves the primary subscription for an organisation.
   */
  async getCurrentSubscription(organisationId: string): Promise<Subscription | null> {
    if (!organisationId) return null;
    try {
      return await subscriptionRepository.getPrimarySubscription(organisationId);
    } catch {
      return null;
    }
  }

  /**
   * Resolves the effective plan ID with strict commercial precedence:
   * 1. Active/valid trialing/past-due subscription plan
   * 2. Transitional explicit platform plan assignment on organisation
   * 3. Legacy full-access fallback ('plan_legacy_full')
   */
  async getEffectivePlanId(organisationId: string): Promise<string> {
    if (!organisationId) return 'plan_legacy_full';

    // 1. Check Primary Subscription
    const sub = await this.getCurrentSubscription(organisationId);
    if (sub && this.isSubscriptionOperational(sub)) {
      return sub.planId;
    }

    // 2. Transitional Assigned Plan fallback
    try {
      const org = await organisationRepository.getById(organisationId);
      if (org?.assignedPlanId) {
        return org.assignedPlanId;
      }
    } catch {
      // safe fallback
    }

    // 3. Legacy Full Access fallback (zero disruption to established v1.0 tenants)
    return 'plan_legacy_full';
  }

  /**
   * Evaluates if a subscription currently permits operational platform usage.
   */
  isSubscriptionOperational(sub: Subscription | null): boolean {
    if (!sub) return false;

    // Active or complimentary
    if (sub.subscriptionStatus === 'active') {
      return true;
    }

    // Trialing (valid if not past trialEndsAt)
    if (sub.subscriptionStatus === 'trialing') {
      if (!sub.trialEndsAt) return true;
      return new Date(sub.trialEndsAt).getTime() > Date.now();
    }

    // Past due (operational during grace period)
    if (sub.subscriptionStatus === 'past_due') {
      return true;
    }

    // Cancelled with cancelAtPeriodEnd (active until period end)
    if (sub.cancelAtPeriodEnd && sub.currentPeriodEnd) {
      return new Date(sub.currentPeriodEnd).getTime() > Date.now();
    }

    return false;
  }
}

export const subscriptionResolverService = new SubscriptionResolverService();
