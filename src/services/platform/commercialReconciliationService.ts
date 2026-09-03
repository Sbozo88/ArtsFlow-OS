import { platformFeatureRepository } from '../../repositories/platformFeatureRepository';
import { subscriptionPlanRepository } from '../../repositories/subscriptionPlanRepository';
import { planEntitlementRepository } from '../../repositories/planEntitlementRepository';
import { planPriceRepository } from '../../repositories/planPriceRepository';
import { STANDARD_PLATFORM_FEATURES } from '../../config/platformFeaturesRegistry';
import { STANDARD_PLANS, buildPlanEntitlementRecords } from '../../config/subscriptionPlansRegistry';
import { buildStandardPlanPrices } from '../../config/planPricesRegistry';
import { auditService } from '../auditService';
import type { PlatformFeature, SubscriptionPlan } from '../../types';

export interface CommercialReconciliationResult {
  featuresReconciled: number;
  plansReconciled: number;
  entitlementsReconciled: number;
  pricesReconciled: number;
  timestamp: string;
}

export class CommercialReconciliationService {
  /**
   * Idempotently reconciles platformFeatures, subscriptionPlans, planEntitlements, and planPrices.
   * - Safe to rerun at any time
   * - Preserves existing customer subscriptions, organisation overrides, and tenant records
   * - Preserves legacy plan (plan_legacy_full)
   */
  async reconcileCommercialConfiguration(actorId: string = 'system'): Promise<CommercialReconciliationResult> {
    const now = new Date().toISOString();
    let featuresCount = 0;
    let plansCount = 0;
    let entitlementsCount = 0;
    let pricesCount = 0;

    // 1. Reconcile Platform Features
    for (const feat of STANDARD_PLATFORM_FEATURES) {
      const existing = await platformFeatureRepository.getByKey(feat.key);
      const featureRecord: PlatformFeature = {
        id: feat.key,
        key: feat.key,
        name: feat.name,
        description: feat.description,
        category: feat.category,
        featureType: feat.featureType,
        featureStatus: feat.featureStatus,
        defaultEnabled: feat.defaultEnabled,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        createdBy: existing?.createdBy || actorId,
        updatedBy: actorId,
        status: 'active'
      };
      await platformFeatureRepository.save(featureRecord);
      featuresCount++;
    }

    // 2. Reconcile Subscription Plans
    for (const def of STANDARD_PLANS) {
      const existing = await subscriptionPlanRepository.getById(def.plan.id);
      const planRecord: SubscriptionPlan = {
        ...def.plan,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        createdBy: existing?.createdBy || actorId,
        updatedBy: actorId,
        status: 'active'
      };
      await subscriptionPlanRepository.save(planRecord);
      plansCount++;

      // 3. Reconcile Plan Entitlements
      const entitlementRecords = buildPlanEntitlementRecords(def.plan.id, def.entitlements, actorId);
      for (const ent of entitlementRecords) {
        await planEntitlementRepository.save(ent);
        entitlementsCount++;
      }
    }

    // 4. Reconcile Standard Plan Prices (Starter R499/mo, R4,990/yr; Professional R999/mo, R9,990/yr)
    const standardPrices = buildStandardPlanPrices(actorId);
    for (const price of standardPrices) {
      await planPriceRepository.save(price);
      pricesCount++;
    }

    await auditService.log({
      organisationId: 'platform',
      actorId,
      action: 'PLATFORM_RECONCILE_COMMERCIAL_CONFIG',
      entityType: 'subscriptionPlan',
      entityId: 'commercial_catalog',
      scopeType: 'platform',
      after: {
        featuresCount,
        plansCount,
        entitlementsCount,
        pricesCount
      }
    });

    return {
      featuresReconciled: featuresCount,
      plansReconciled: plansCount,
      entitlementsReconciled: entitlementsCount,
      pricesReconciled: pricesCount,
      timestamp: now
    };
  }
}

export const commercialReconciliationService = new CommercialReconciliationService();
