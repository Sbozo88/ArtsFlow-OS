import type { PlanPrice } from '../types';

export interface PlanPriceConfig {
  planId: string;
  planCode: string;
  currency: string;
  monthlyAmount: number; // Integer minor units (cents)
  annualAmount: number;  // Integer minor units (cents)
}

/**
 * DEFAULT / TEST / PLACEHOLDER PRICING
 * Note: These values are for development and testing purposes only.
 * They do not constitute public or finalized commercial pricing.
 */
export const STANDARD_TEST_PRICES: PlanPriceConfig[] = [
  {
    planId: 'plan_starter',
    planCode: 'starter',
    currency: 'ZAR',
    monthlyAmount: 49900,  // R499.00 / month
    annualAmount: 499000   // R4,990.00 / year (2 months free)
  },
  {
    planId: 'plan_professional',
    planCode: 'professional',
    currency: 'ZAR',
    monthlyAmount: 99900,  // R999.00 / month
    annualAmount: 999000   // R9,990.00 / year (~17% discount)
  },
  {
    planId: 'plan_premium',
    planCode: 'premium',
    currency: 'ZAR',
    monthlyAmount: 249900, // R2,499.00 / month
    annualAmount: 2499000  // R24,990.00 / year
  },
  {
    planId: 'plan_enterprise',
    planCode: 'enterprise',
    currency: 'ZAR',
    monthlyAmount: 499900, // R4,999.00 / month
    annualAmount: 4999000  // R49,990.00 / year
  }
];

export function buildStandardPlanPrices(actorId = 'system'): PlanPrice[] {
  const now = new Date().toISOString();
  const prices: PlanPrice[] = [];

  for (const p of STANDARD_TEST_PRICES) {
    // Monthly
    prices.push({
      id: `price_${p.planCode}_monthly_${p.currency.toLowerCase()}`,
      planId: p.planId,
      currency: p.currency,
      billingInterval: 'monthly',
      amount: p.monthlyAmount,
      priceStatus: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
      status: 'active'
    });

    // Annual
    prices.push({
      id: `price_${p.planCode}_annual_${p.currency.toLowerCase()}`,
      planId: p.planId,
      currency: p.currency,
      billingInterval: 'annual',
      amount: p.annualAmount,
      priceStatus: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
      status: 'active'
    });
  }

  return prices;
}
