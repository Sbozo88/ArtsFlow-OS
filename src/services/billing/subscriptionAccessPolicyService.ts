import { subscriptionResolverService } from './subscriptionResolverService';
import { organisationRepository } from '../../repositories/organisationRepository';
import { tenantLifecycleService } from '../tenantLifecycleService';
import { auditService } from '../auditService';
import type { Subscription } from '../../types';

export class SubscriptionAccessPolicyService {
  public static readonly DEFAULT_TRIAL_DAYS = 14;
  public static readonly DEFAULT_PAST_DUE_GRACE_DAYS = 7;

  /**
   * Checks if an organisation is allowed operational access based on its commercial billing state.
   */
  async canAccessOperations(organisationId: string): Promise<boolean> {
    const org = await organisationRepository.getById(organisationId);
    if (!org) return false;

    // Platform-level manual suspension always takes absolute precedence
    if (org.tenantStatus === 'suspended') {
      return false;
    }

    // If restricted for manual platform action, block operations
    if (org.tenantStatus === 'restricted' && org.restrictionReasonType === 'manual_platform_action') {
      return false;
    }

    const sub = await subscriptionResolverService.getCurrentSubscription(organisationId);
    // Legacy organisation with no subscription remains operational
    if (!sub) {
      return org.tenantStatus !== 'restricted';
    }

    return subscriptionResolverService.isSubscriptionOperational(sub);
  }

  /**
   * Handles payment recovery when a subscription returns to active state.
   * CRITICAL SECURITY RULE (Section 57):
   * If tenant was manually suspended or restricted for manual platform reasons,
   * a successful billing event must NOT automatically reactivate the tenant.
   */
  async handlePaymentRecovery(
    organisationId: string,
    subscription: Subscription
  ): Promise<{ restored: boolean; reason: string }> {
    const org = await organisationRepository.getById(organisationId);
    if (!org) {
      return { restored: false, reason: 'Organisation not found' };
    }

    // 1. Never override manual platform suspension
    if (org.tenantStatus === 'suspended') {
      return {
        restored: false,
        reason: 'Tenant is manually suspended by platform administration. Billing recovery cannot unsuspend.'
      };
    }

    // 2. Never override manual platform restriction
    if (org.tenantStatus === 'restricted' && org.restrictionReasonType === 'manual_platform_action') {
      return {
        restored: false,
        reason: 'Tenant restriction is due to a manual platform action. Billing recovery cannot lift restriction.'
      };
    }

    // 3. If restricted specifically due to billing past due or trial expired, safely restore to active
    if (
      org.tenantStatus === 'restricted' &&
      (org.restrictionReasonType === 'billing_past_due' || org.restrictionReasonType === 'trial_expired')
    ) {
      await tenantLifecycleService.updateTenantStatus({
        actorId: 'system',
        organisationId,
        targetStatus: 'active',
        reason: 'Subscription payment verified. Commercial access restored.'
      });

      await organisationRepository.update(organisationId, 'system', {
        restrictionReasonType: undefined
      });

      await auditService.log({
        organisationId,
        actorId: 'system',
        action: 'PLATFORM_RESTORE_TENANT_AFTER_BILLING',
        entityType: 'organisation',
        entityId: organisationId,
        scopeType: 'platform',
        reason: `Commercial access restored following payment recovery for subscription ${subscription.id}`
      });

      return { restored: true, reason: 'Commercial access successfully restored.' };
    }

    return { restored: false, reason: 'No commercial restriction to restore.' };
  }
}

export const subscriptionAccessPolicyService = new SubscriptionAccessPolicyService();
