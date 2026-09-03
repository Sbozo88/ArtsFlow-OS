import { subscriptionRepository } from '../../repositories/subscriptionRepository';
import { organisationRepository } from '../../repositories/organisationRepository';
import { tenantLifecycleService } from '../tenantLifecycleService';
import { saasSubscriptionService } from './saasSubscriptionService';
import { SubscriptionAccessPolicyService } from './subscriptionAccessPolicyService';
import { auditService } from '../auditService';

export interface LifecycleRunResult {
  expiredTrials: number;
  pastDueRestricted: number;
  periodEndCancelled: number;
  processedAt: string;
}

export const subscriptionLifecycleRunner = {
  /**
   * Executes scheduled idempotent lifecycle jobs across subscriptions:
   * 1. Expires overdue trials and applies tenant restriction policy.
   * 2. Checks past-due subscriptions exceeding the grace period and restricts tenant access.
   * 3. Transitions subscriptions set to cancelAtPeriodEnd once current period concludes.
   */
  async runDailyLifecycleCheck(): Promise<LifecycleRunResult> {
    const allSubs = await subscriptionRepository.getAll();
    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    let expiredTrials = 0;
    let pastDueRestricted = 0;
    let periodEndCancelled = 0;

    for (const sub of allSubs) {
      // 1. Trial Expiry Check
      if (
        sub.subscriptionStatus === 'trialing' &&
        sub.trialEndsAt &&
        new Date(sub.trialEndsAt).getTime() <= now
      ) {
        try {
          await saasSubscriptionService.expireTrial(sub.id);
          expiredTrials++;
        } catch (err) {
          console.error(`[LifecycleRunner] Error expiring trial ${sub.id}:`, err);
        }
        continue;
      }

      // 2. Past-Due Grace Period Expiry Check
      if (sub.subscriptionStatus === 'past_due' && sub.currentPeriodEnd) {
        const graceMs =
          SubscriptionAccessPolicyService.DEFAULT_PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000;
        const graceExpiry = new Date(sub.currentPeriodEnd).getTime() + graceMs;

        if (graceExpiry <= now) {
          try {
            const org = await organisationRepository.getById(sub.organisationId);
            if (org && org.tenantStatus === 'active') {
              await tenantLifecycleService.updateTenantStatus({
                actorId: 'system',
                organisationId: sub.organisationId,
                targetStatus: 'restricted',
                reason: 'Subscription past due grace period expired.'
              });

              await organisationRepository.update(sub.organisationId, 'system', {
                restrictionReasonType: 'billing_past_due'
              });

              await auditService.log({
                organisationId: sub.organisationId,
                actorId: 'system',
                action: 'PLATFORM_RESTRICT_TENANT_FOR_BILLING',
                entityType: 'subscription',
                entityId: sub.id,
                scopeType: 'platform',
                reason: 'Past-due grace period elapsed without payment recovery.'
              });

              pastDueRestricted++;
            }
          } catch (err) {
            console.error(`[LifecycleRunner] Error restricting past-due tenant for sub ${sub.id}:`, err);
          }
        }
      }

      // 3. Cancel At Period End Transition
      if (
        sub.cancelAtPeriodEnd &&
        sub.subscriptionStatus === 'active' &&
        sub.currentPeriodEnd &&
        new Date(sub.currentPeriodEnd).getTime() <= now
      ) {
        try {
          await subscriptionRepository.update(sub.id, {
            subscriptionStatus: 'cancelled',
            cancelAtPeriodEnd: false,
            cancelledAt: nowIso,
            updatedAt: nowIso
          });

          // Check if organisation has any other active subscriptions
          const primary = await subscriptionRepository.getPrimarySubscription(sub.organisationId);
          if (!primary || primary.subscriptionStatus === 'cancelled') {
            const org = await organisationRepository.getById(sub.organisationId);
            if (org && org.tenantStatus === 'active') {
              await tenantLifecycleService.updateTenantStatus({
                actorId: 'system',
                organisationId: sub.organisationId,
                targetStatus: 'restricted',
                reason: 'Subscription cancelled at period end.'
              });
            }
          }

          await auditService.log({
            organisationId: sub.organisationId,
            actorId: 'system',
            action: 'PLATFORM_CANCEL_SUBSCRIPTION',
            entityType: 'subscription',
            entityId: sub.id,
            scopeType: 'platform',
            reason: 'Subscription period concluded; status transitioned to cancelled.'
          });

          periodEndCancelled++;
        } catch (err) {
          console.error(`[LifecycleRunner] Error processing period end cancellation for sub ${sub.id}:`, err);
        }
      }
    }

    return {
      expiredTrials,
      pastDueRestricted,
      periodEndCancelled,
      processedAt: nowIso
    };
  }
};
