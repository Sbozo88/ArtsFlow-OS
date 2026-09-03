import { saasBillingEventRepository } from '../../repositories/saasBillingEventRepository';
import { saasCheckoutSessionRepository } from '../../repositories/saasCheckoutSessionRepository';
import { planPriceRepository } from '../../repositories/planPriceRepository';
import { billingCustomerRepository } from '../../repositories/billingCustomerRepository';
import { subscriptionRepository } from '../../repositories/subscriptionRepository';
import { subscriptionPlanRepository } from '../../repositories/subscriptionPlanRepository';
import { organisationRepository } from '../../repositories/organisationRepository';
import { defaultBillingProvider } from './saasBillingProvider';
import { saasSubscriptionService } from './saasSubscriptionService';
import { subscriptionAccessPolicyService } from './subscriptionAccessPolicyService';
import { STANDARD_TEST_PRICES } from '../../config/planPricesRegistry';
import { auditService } from '../auditService';
import type {
  AuthUser,
  BillingInterval,
  SaaSCheckoutSession,
  SaaSBillingEvent
} from '../../types';

export interface InitiateCheckoutInput {
  organisationId: string;
  planId: string;
  billingInterval: BillingInterval;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface WebhookProcessResult {
  success: boolean;
  idempotentDuplicate?: boolean;
  eventId?: string;
  eventType?: string;
  error?: string;
}

export const saasBillingService = {
  /**
   * Initiates a SaaS checkout session.
   * Enforces caller authority, cross-tenant isolation, and trusted server-side price resolution.
   */
  async createCheckoutSession(
    caller: AuthUser,
    input: InitiateCheckoutInput
  ): Promise<{ session: SaaSCheckoutSession; checkoutUrl: string }> {
    // 1. Cross-tenant & Role check
    const isSuperAdmin = caller.platformRole === 'super_admin';
    const isOrgAdmin = caller.role === 'organisation_admin' && caller.organisationId === input.organisationId;

    if (!isSuperAdmin && !isOrgAdmin) {
      throw new Error(
        `Unauthorized: Only Organisation Admins of organisation '${input.organisationId}' may initiate SaaS checkout.`
      );
    }

    const org = await organisationRepository.getById(input.organisationId);
    if (!org) {
      throw new Error(`Organisation '${input.organisationId}' not found.`);
    }

    const plan = await subscriptionPlanRepository.getById(input.planId);
    if (!plan || plan.planStatus === 'archived') {
      throw new Error(`Plan '${input.planId}' is invalid or archived.`);
    }

    const currency = (input.currency || 'ZAR').toUpperCase();

    // 2. Server-side trusted price resolution (Prevents client price tampering)
    let price = await planPriceRepository.getPrice(input.planId, currency, input.billingInterval);
    if (!price) {
      // Fall back to standard test pricing registry if unseeded in DB
      const testCfg = STANDARD_TEST_PRICES.find(
        (p) => p.planId === input.planId || p.planCode === plan.code
      );
      if (testCfg && testCfg.currency === currency) {
        price = {
          id: `seed_price_${plan.code}_${input.billingInterval}`,
          planId: plan.id,
          currency,
          billingInterval: input.billingInterval,
          amount: input.billingInterval === 'annual' ? testCfg.annualAmount : testCfg.monthlyAmount,
          priceStatus: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
          updatedBy: 'system',
          status: 'active'
        };
      } else {
        throw new Error(
          `No active price configured for plan '${plan.name}' with interval '${input.billingInterval}' and currency '${currency}'.`
        );
      }
    }

    // 3. Resolve or create provider customer
    let customer = await billingCustomerRepository.getByOrganisation(input.organisationId);
    if (!customer) {
      const custResult = await defaultBillingProvider.createCustomer(
        input.organisationId,
        caller.email || org.email || `billing@${org.slug || 'org'}.com`,
        caller.displayName || org.name
      );

      customer = {
        id: `bcus_${input.organisationId}`,
        organisationId: input.organisationId,
        providerType: defaultBillingProvider.providerType,
        providerCustomerId: custResult.providerCustomerId,
        billingEmail: custResult.email,
        billingName: custResult.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };
      await billingCustomerRepository.save(customer);
    }

    // 4. Create session with provider
    const sessionResult = await defaultBillingProvider.createCheckoutSession({
      organisationId: input.organisationId,
      organisationName: org.name,
      planId: plan.id,
      planName: plan.name,
      price,
      customerEmail: customer.billingEmail || caller.email || 'billing@artsflow.com',
      customerName: customer.billingName || caller.displayName || undefined,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      existingProviderCustomerId: customer.providerCustomerId
    });

    // 5. Persist checkout session
    const checkoutSession: SaaSCheckoutSession = {
      id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      organisationId: input.organisationId,
      planId: plan.id,
      priceId: price.id,
      providerType: defaultBillingProvider.providerType,
      providerSessionId: sessionResult.providerSessionId,
      checkoutStatus: 'created',
      checkoutUrl: sessionResult.checkoutUrl,
      expiresAt: sessionResult.expiresAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    };

    await saasCheckoutSessionRepository.save(checkoutSession);

    return { session: checkoutSession, checkoutUrl: sessionResult.checkoutUrl };
  },

  /**
   * Processes an incoming SaaS billing webhook.
   * Enforces signature verification and strict idempotency on (providerType + providerEventId).
   */
  async processWebhook(
    rawPayload: string,
    signature: string,
    headers?: Record<string, string>
  ): Promise<WebhookProcessResult> {
    // 1. Signature Verification
    const verifiedEvent = await defaultBillingProvider.verifyWebhook(rawPayload, signature, headers);

    // 2. Idempotency Check
    const existing = await saasBillingEventRepository.getByEventIdentity(
      verifiedEvent.providerType,
      verifiedEvent.providerEventId
    );

    if (existing && existing.processingStatus === 'processed') {
      // Idempotent duplicate: return immediately without duplicate mutations or duplicate audits
      return {
        success: true,
        idempotentDuplicate: true,
        eventId: existing.id,
        eventType: existing.eventType
      };
    }

    const now = new Date().toISOString();
    const eventRecord: SaaSBillingEvent = existing || {
      id: `bevt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      organisationId: verifiedEvent.organisationId,
      providerType: verifiedEvent.providerType,
      providerEventId: verifiedEvent.providerEventId,
      eventType: verifiedEvent.eventType,
      processingStatus: 'pending',
      providerCustomerId: verifiedEvent.providerCustomerId,
      providerSubscriptionId: verifiedEvent.providerSubscriptionId,
      subscriptionId: verifiedEvent.subscriptionId,
      safePayloadSummary: verifiedEvent.safePayloadSummary,
      receivedAt: verifiedEvent.receivedAt,
      createdAt: now,
      updatedAt: now,
      status: 'active'
    };

    await saasBillingEventRepository.save(eventRecord);

    try {
      // 3. Resolve Subscription Target
      let targetSub = verifiedEvent.subscriptionId
        ? await subscriptionRepository.getById(verifiedEvent.subscriptionId)
        : null;

      if (!targetSub && verifiedEvent.providerSubscriptionId) {
        targetSub = await subscriptionRepository.getByProviderSubscriptionId(
          verifiedEvent.providerSubscriptionId
        );
      }

      if (!targetSub && verifiedEvent.organisationId) {
        targetSub = await subscriptionRepository.getPrimarySubscription(verifiedEvent.organisationId);
      }

      // 4. Dispatch Event Handling
      switch (verifiedEvent.eventType) {
        case 'subscription_activated':
        case 'subscription_created':
        case 'invoice_paid': {
          if (targetSub) {
            await saasSubscriptionService.activateSubscription('system', targetSub.id, {
              providerType: verifiedEvent.providerType,
              providerCustomerId: verifiedEvent.providerCustomerId,
              providerSubscriptionId: verifiedEvent.providerSubscriptionId
            });

            // Restore commercial tenant restriction if applicable (Respects manual platform suspension!)
            await subscriptionAccessPolicyService.handlePaymentRecovery(
              targetSub.organisationId,
              targetSub
            );
          }
          break;
        }

        case 'invoice_payment_failed': {
          if (targetSub) {
            await saasSubscriptionService.markPastDue(
              targetSub.id,
              'Webhook notification: payment failed'
            );
          }
          break;
        }

        case 'subscription_cancelled': {
          if (targetSub) {
            await saasSubscriptionService.cancelSubscription('system', targetSub.id, {
              cancelAtPeriodEnd: false,
              reason: 'Webhook notification: cancelled by provider'
            });
          }
          break;
        }

        default:
          // Unhandled or informational event
          break;
      }

      // 5. Mark Event Processed
      await saasBillingEventRepository.update(eventRecord.id, {
        processingStatus: 'processed',
        processedAt: new Date().toISOString()
      });

      await auditService.log({
        organisationId: eventRecord.organisationId || 'platform',
        actorId: 'system',
        action: 'PLATFORM_PROCESS_SAAS_BILLING_EVENT',
        entityType: 'saasBillingEvent',
        entityId: eventRecord.id,
        scopeType: 'platform',
        reason: `Processed provider billing event '${verifiedEvent.eventType}' (${verifiedEvent.providerEventId})`
      });

      return {
        success: true,
        eventId: eventRecord.id,
        eventType: verifiedEvent.eventType
      };
    } catch (err) {
      const errorMsg = (err as Error).message || 'Failed to process billing event';
      await saasBillingEventRepository.update(eventRecord.id, {
        processingStatus: 'failed',
        errorMessage: errorMsg
      });

      return {
        success: false,
        eventId: eventRecord.id,
        error: errorMsg
      };
    }
  }
};
