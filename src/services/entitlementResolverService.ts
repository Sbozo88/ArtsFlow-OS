import { planEntitlementRepository } from '../repositories/planEntitlementRepository';
import { organisationEntitlementOverrideRepository } from '../repositories/organisationEntitlementOverrideRepository';
import { platformFeatureRepository } from '../repositories/platformFeatureRepository';
import { subscriptionResolverService } from './billing/subscriptionResolverService';
import { STANDARD_PLATFORM_FEATURES } from '../config/platformFeaturesRegistry';
import { STANDARD_PLANS, buildPlanEntitlementRecords } from '../config/subscriptionPlansRegistry';
import type {
  EffectiveEntitlement,
  PlatformFeature,
  PlanEntitlement,
  OrganisationEntitlementOverride
} from '../types';

interface CacheEntry {
  timestamp: number;
  entitlements: Record<string, EffectiveEntitlement>;
}

export class EntitlementResolverService {
  private cache: Map<string, CacheEntry> = new Map();
  private static readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Invalidate cache for an organisation or all organisations
   */
  invalidateCache(organisationId?: string): void {
    if (organisationId) {
      this.cache.delete(organisationId);
    } else {
      this.cache.clear();
    }
  }

  clearCache(organisationId?: string): void {
    this.invalidateCache(organisationId);
  }

  /**
   * Resolves the full map of effective feature entitlements for an organisation.
   */
  async getOrganisationEntitlements(
    organisationId: string
  ): Promise<Record<string, EffectiveEntitlement>> {
    if (!organisationId) return {};

    const now = Date.now();
    const cached = this.cache.get(organisationId);
    if (cached && now - cached.timestamp < EntitlementResolverService.CACHE_TTL_MS) {
      return cached.entitlements;
    }

    // 1. Resolve Effective Plan ID
    // Strict commercial precedence:
    // 1. Active / trialing valid subscription plan
    // 2. Transitional assigned plan
    // 3. Legacy full-access plan fallback (plan_legacy_full)
    const planId = await subscriptionResolverService.getEffectivePlanId(organisationId);

    // Fetch Plan Entitlements
    let planEnts: PlanEntitlement[] = [];
    try {
      planEnts = await planEntitlementRepository.getByPlanId(planId);
    } catch {
      // safe fallback to standard registry
    }

    if (!planEnts || planEnts.length === 0) {
      // If DB has not been seeded yet or for legacy full, resolve from STANDARD_PLANS registry
      const standardPlan = STANDARD_PLANS.find((p) => p.plan.id === planId || p.plan.code === planId);
      if (standardPlan) {
        planEnts = buildPlanEntitlementRecords(standardPlan.plan.id, standardPlan.entitlements, 'system');
      } else {
        // Fallback to all standard platform features defaultEnabled
        planEnts = STANDARD_PLATFORM_FEATURES.map((f) => ({
          id: `seed_fallback_${f.key}`,
          planId,
          featureKey: f.key,
          enabled: f.defaultEnabled,
          limitValue: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
          updatedBy: 'system',
          status: 'active'
        }));
      }
    }

    // 3. Resolve Platform Features (for safety overrides, e.g. inactive features)
    let platformFeatures: PlatformFeature[] = [];
    try {
      platformFeatures = await platformFeatureRepository.getAll();
    } catch {
      // ignore
    }
    const featureMap = new Map<string, PlatformFeature>();
    for (const f of platformFeatures) {
      featureMap.set(f.key, f);
    }

    // 4. Resolve Active Organisation Overrides
    let activeOverrides: OrganisationEntitlementOverride[] = [];
    try {
      activeOverrides = await organisationEntitlementOverrideRepository.getActiveByOrganisation(organisationId);
    } catch (err) {
      console.warn(`[EntitlementResolver] Error reading overrides for '${organisationId}':`, err);
    }
    const overrideMap = new Map<string, OrganisationEntitlementOverride>();
    for (const ovr of activeOverrides) {
      overrideMap.set(ovr.featureKey, ovr);
    }

    // 5. Merge and Build Effective Entitlements
    const effective: Record<string, EffectiveEntitlement> = {};

    // First populate from plan entitlements
    for (const ent of planEnts) {
      effective[ent.featureKey] = {
        organisationId,
        featureKey: ent.featureKey,
        enabled: ent.enabled,
        limitValue: ent.limitValue !== undefined ? ent.limitValue : null,
        configuration: ent.configuration,
        source: 'plan',
        sourceId: planId
      };
    }

    // Ensure all standard registry features are present (with defaults if not in plan)
    for (const f of STANDARD_PLATFORM_FEATURES) {
      if (!effective[f.key]) {
        effective[f.key] = {
          organisationId,
          featureKey: f.key,
          enabled: planId === 'plan_legacy_full' ? true : false,
          limitValue: null,
          source: 'default'
        };
      }
    }

    // Apply active overrides (Precedence over plan)
    for (const [key, ovr] of overrideMap.entries()) {
      const current = effective[key] || {
        organisationId,
        featureKey: key,
        enabled: false,
        limitValue: null,
        source: 'default'
      };

      let newEnabled = current.enabled;
      if (ovr.overrideType === 'enable') newEnabled = true;
      if (ovr.overrideType === 'disable') newEnabled = false;

      let newLimit = current.limitValue;
      if (ovr.overrideType === 'limit' && ovr.limitValue !== undefined) {
        newLimit = ovr.limitValue;
      }

      effective[key] = {
        ...current,
        enabled: newEnabled,
        limitValue: newLimit,
        configuration: ovr.configuration !== undefined ? ovr.configuration : current.configuration,
        source: 'override',
        sourceId: ovr.id,
        overrideReason: ovr.reason
      };
    }

    // Apply platform safety rules (Platform-inactive feature forces disabled)
    for (const key of Object.keys(effective)) {
      const pf = featureMap.get(key) || STANDARD_PLATFORM_FEATURES.find((f) => f.key === key);
      if (pf && pf.featureStatus === 'inactive') {
        effective[key] = {
          ...effective[key],
          enabled: false,
          source: 'system'
        };
      }
    }

    // Cache results
    this.cache.set(organisationId, {
      timestamp: now,
      entitlements: effective
    });

    return effective;
  }

  /**
   * Resolves a single feature entitlement for an organisation.
   */
  async getEntitlement(
    organisationId: string,
    featureKey: string
  ): Promise<EffectiveEntitlement> {
    const all = await this.getOrganisationEntitlements(organisationId);
    if (all[featureKey]) {
      return all[featureKey];
    }

    // Unknown feature fallback
    return {
      organisationId,
      featureKey,
      enabled: false,
      limitValue: null,
      source: 'default'
    };
  }

  /**
   * Boolean check whether an organisation is entitled to a feature.
   */
  async hasFeature(
    organisationId: string,
    featureKey: string
  ): Promise<boolean> {
    const ent = await this.getEntitlement(organisationId, featureKey);
    return ent.enabled === true;
  }

  async isFeatureEnabled(
    organisationId: string,
    featureKey: string
  ): Promise<boolean> {
    return this.hasFeature(organisationId, featureKey);
  }

  /**
   * Returns the numeric limit value for an organisation feature, or null for unlimited.
   */
  async getLimit(
    organisationId: string,
    featureKey: string
  ): Promise<number | null> {
    const ent = await this.getEntitlement(organisationId, featureKey);
    if (!ent.enabled) return 0;
    return ent.limitValue !== undefined ? ent.limitValue : null;
  }

  /**
   * Returns optional configuration object for an organisation feature.
   */
  async getConfiguration(
    organisationId: string,
    featureKey: string
  ): Promise<Record<string, unknown> | null> {
    const ent = await this.getEntitlement(organisationId, featureKey);
    return ent.configuration || null;
  }
}

export const entitlementResolverService = new EntitlementResolverService();
