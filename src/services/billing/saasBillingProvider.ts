import type {
  SaaSBillingEventType,
  PlanPrice
} from '../../types';

export interface BillingCustomerResult {
  providerCustomerId: string;
  email?: string;
  name?: string;
}

export interface CreateCheckoutSessionInput {
  organisationId: string;
  organisationName: string;
  planId: string;
  planName: string;
  price: PlanPrice;
  customerEmail: string;
  customerName?: string;
  successUrl: string;
  cancelUrl: string;
  existingProviderCustomerId?: string;
}

export interface CheckoutSessionResult {
  providerSessionId: string;
  checkoutUrl: string;
  expiresAt: string;
}

export interface SubscriptionResult {
  providerSubscriptionId: string;
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface VerifiedSaaSBillingEvent {
  providerType: string;
  providerEventId: string;
  eventType: SaaSBillingEventType;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  subscriptionId?: string;
  organisationId?: string;
  safePayloadSummary: Record<string, unknown>;
  receivedAt: string;
}

export type BillingProviderStatus = 'CONNECTED' | 'SANDBOX' | 'NOT CONFIGURED';

export interface SaaSBillingProvider {
  readonly providerType: string;
  getStatus(): BillingProviderStatus;
  createCustomer(
    organisationId: string,
    email: string,
    name: string
  ): Promise<BillingCustomerResult>;
  createCheckoutSession(
    input: CreateCheckoutSessionInput
  ): Promise<CheckoutSessionResult>;
  cancelSubscription(
    providerSubscriptionId: string,
    cancelAtPeriodEnd: boolean
  ): Promise<SubscriptionResult>;
  resumeSubscription?(
    providerSubscriptionId: string
  ): Promise<SubscriptionResult>;
  verifyWebhook(
    rawPayload: string,
    signature: string,
    headers?: Record<string, string>
  ): Promise<VerifiedSaaSBillingEvent>;
}

/**
 * Standard Sandbox / Mock SaaS Billing Provider
 * Used in test and sandbox environments to simulate provider handshakes safely.
 */
export class SandboxSaaSBillingProvider implements SaaSBillingProvider {
  readonly providerType = 'sandbox';

  getStatus(): BillingProviderStatus {
    const isConfigured = Boolean(
      typeof process !== 'undefined' &&
      process.env &&
      (process.env.SAAS_BILLING_SECRET_KEY || process.env.VITE_SAAS_BILLING_SANDBOX)
    );
    return isConfigured ? 'SANDBOX' : 'NOT CONFIGURED';
  }

  async createCustomer(
    organisationId: string,
    email: string,
    name: string
  ): Promise<BillingCustomerResult> {
    return {
      providerCustomerId: `sbx_cus_${organisationId}_${Date.now()}`,
      email,
      name
    };
  }

  async createCheckoutSession(
    input: CreateCheckoutSessionInput
  ): Promise<CheckoutSessionResult> {
    const sessionId = `sbx_sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    return {
      providerSessionId: sessionId,
      checkoutUrl: `${input.successUrl}?session_id=${sessionId}`,
      expiresAt
    };
  }

  async cancelSubscription(
    providerSubscriptionId: string,
    cancelAtPeriodEnd: boolean
  ): Promise<SubscriptionResult> {
    return {
      providerSubscriptionId,
      status: cancelAtPeriodEnd ? 'active' : 'cancelled',
      cancelAtPeriodEnd
    };
  }

  async resumeSubscription(
    providerSubscriptionId: string
  ): Promise<SubscriptionResult> {
    return {
      providerSubscriptionId,
      status: 'active',
      cancelAtPeriodEnd: false
    };
  }

  async verifyWebhook(
    rawPayload: string,
    signature: string
  ): Promise<VerifiedSaaSBillingEvent> {
    if (!signature || signature.trim() === '') {
      throw new Error('Missing or empty webhook signature');
    }
    if (signature === 'invalid_signature') {
      throw new Error('Invalid webhook signature verification failed');
    }

    let parsed: {
      id?: string;
      type?: SaaSBillingEventType;
      data?: {
        customerId?: string;
        subscriptionId?: string;
        internalSubscriptionId?: string;
        organisationId?: string;
        amount?: number;
        currency?: string;
      };
    };
    try {
      parsed = JSON.parse(rawPayload);
    } catch {
      throw new Error('Malformed JSON payload in webhook');
    }

    return {
      providerType: this.providerType,
      providerEventId: parsed.id || `evt_${Date.now()}`,
      eventType: parsed.type || 'subscription_activated',
      providerCustomerId: parsed.data?.customerId,
      providerSubscriptionId: parsed.data?.subscriptionId,
      subscriptionId: parsed.data?.internalSubscriptionId,
      organisationId: parsed.data?.organisationId,
      safePayloadSummary: {
        eventType: parsed.type,
        amount: parsed.data?.amount,
        currency: parsed.data?.currency
      },
      receivedAt: new Date().toISOString()
    };
  }
}

export const defaultBillingProvider: SaaSBillingProvider = new SandboxSaaSBillingProvider();
