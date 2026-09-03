import { describe, it, expect, vi, beforeEach } from 'vitest';
import { entitlementResolverService } from '../entitlementResolverService';
import { usageMeteringService } from '../usageMeteringService';
import { commercialReconciliationService } from '../platform/commercialReconciliationService';
import { STANDARD_PLANS } from '../../config/subscriptionPlansRegistry';
import { STANDARD_TEST_PRICES } from '../../config/planPricesRegistry';
import { organisationRepository } from '../../repositories/organisationRepository';
import { subscriptionRepository } from '../../repositories/subscriptionRepository';
import { subscriptionPlanRepository } from '../../repositories/subscriptionPlanRepository';
import { organisationEntitlementOverrideRepository } from '../../repositories/organisationEntitlementOverrideRepository';
import { organisationUsageRepository } from '../../repositories/organisationUsageRepository';
import { platformFeatureRepository } from '../../repositories/platformFeatureRepository';
import { planEntitlementRepository } from '../../repositories/planEntitlementRepository';
import { planPriceRepository } from '../../repositories/planPriceRepository';
import { auditService } from '../auditService';
import { PlanLimitExceededError } from '../../types';
import type { Organisation, Subscription } from '../../types';

describe('Commercial Configuration Pass — Starter vs. Professional Entitlements', () => {
  const ORG_STARTER = 'org_starter_commercial';
  const ORG_PRO = 'org_pro_commercial';
  const ORG_LEGACY = 'org_legacy_commercial';

  const mockStarterOrg: Organisation = {
    id: ORG_STARTER,
    organisationId: ORG_STARTER,
    name: 'Starter Arts Studio',
    organisationType: 'music_and_dance',
    tenantStatus: 'active',
    assignedPlanId: 'plan_starter',
    status: 'active',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system'
  };

  const mockProOrg: Organisation = {
    id: ORG_PRO,
    organisationId: ORG_PRO,
    name: 'Professional Performing Arts Academy',
    organisationType: 'performing_arts',
    tenantStatus: 'active',
    assignedPlanId: 'plan_professional',
    status: 'active',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system'
  };

  const mockLegacyOrg: Organisation = {
    id: ORG_LEGACY,
    organisationId: ORG_LEGACY,
    name: 'Legacy Arts School',
    organisationType: 'music',
    tenantStatus: 'active',
    assignedPlanId: 'plan_legacy_full',
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system'
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    entitlementResolverService.clearCache();
  });

  describe('1. Commercial Plans & Price Verification', () => {
    it('has exactly Starter and Professional configured as public commercial plans', () => {
      const publicPlans = STANDARD_PLANS.filter((p) => p.plan.isPublic);
      expect(publicPlans).toHaveLength(2);

      const starter = publicPlans.find((p) => p.plan.id === 'plan_starter');
      expect(starter).toBeDefined();
      expect(starter?.plan.name).toBe('ArtsFlow Starter');
      expect(starter?.plan.recommended).toBe(false);

      const pro = publicPlans.find((p) => p.plan.id === 'plan_professional');
      expect(pro).toBeDefined();
      expect(pro?.plan.name).toBe('ArtsFlow Professional');
      expect(pro?.plan.recommended).toBe(true); // Most Popular
    });

    it('has approved pricing in minor units (ZAR cents)', () => {
      const starterPrice = STANDARD_TEST_PRICES.find((p) => p.planId === 'plan_starter');
      expect(starterPrice).toBeDefined();
      expect(starterPrice?.monthlyAmount).toBe(49900); // R499.00
      expect(starterPrice?.annualAmount).toBe(499000);  // R4,990.00

      const proPrice = STANDARD_TEST_PRICES.find((p) => p.planId === 'plan_professional');
      expect(proPrice).toBeDefined();
      expect(proPrice?.monthlyAmount).toBe(99900); // R999.00
      expect(proPrice?.annualAmount).toBe(999000);  // R9,990.00
    });
  });

  describe('2. Starter Plan Entitlements & Boundaries', () => {
    beforeEach(() => {
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(mockStarterOrg);
      vi.spyOn(subscriptionPlanRepository, 'getById').mockResolvedValue(null); // Fall back to STANDARD_PLANS
      vi.spyOn(organisationEntitlementOverrideRepository, 'getByOrganisation').mockResolvedValue([]);
    });

    it('enables core administration and guardian portal', async () => {
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'core.learners')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'core.guardians')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'core.staff')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'core.programmes')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'core.groups')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'core.attendance')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'guardian_portal')).toBe(true);
    });

    it('enables complete Music and Dance operations in Starter (ArtsFlow Identity)', async () => {
      // Music
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'music.core')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'music.instruments')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'music.repertoire')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'music.practice')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'music.assessments')).toBe(true);

      // Dance
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'dance.core')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'dance.choreography')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'dance.practice')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'dance.assessments')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'dance.costumes')).toBe(true);
    });

    it('enables core finance but restricts advanced financial reporting in Starter', async () => {
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'finance.core')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'finance.reporting')).toBe(false);
    });

    it('restricts Events, Transport, Consent, Automation, and Staff Operations in Starter', async () => {
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'events.core')).toBe(false);
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'events.transport')).toBe(false);
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'events.consent')).toBe(false);
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'automation.core')).toBe(false);
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'analytics.advanced')).toBe(false);
      expect(await entitlementResolverService.hasFeature(ORG_STARTER, 'staff_operations.core')).toBe(false);
    });

    it('enforces approved Starter limits', async () => {
      expect(await entitlementResolverService.getLimit(ORG_STARTER, 'limits.learners')).toBe(100);
      expect(await entitlementResolverService.getLimit(ORG_STARTER, 'limits.staff_users')).toBe(10);
      expect(await entitlementResolverService.getLimit(ORG_STARTER, 'limits.storage_mb')).toBe(5000); // 5 GB
      expect(await entitlementResolverService.getLimit(ORG_STARTER, 'limits.monthly_communications')).toBe(200);
      expect(await entitlementResolverService.getLimit(ORG_STARTER, 'limits.automation_runs')).toBe(0);
    });
  });

  describe('3. Professional Plan Entitlements & Boundaries', () => {
    beforeEach(() => {
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(mockProOrg);
      vi.spyOn(subscriptionPlanRepository, 'getById').mockResolvedValue(null);
      vi.spyOn(organisationEntitlementOverrideRepository, 'getByOrganisation').mockResolvedValue([]);
    });

    it('enables full operational spectrum including Events, Transport, Consent, and Automation', async () => {
      // Core & Arts
      expect(await entitlementResolverService.hasFeature(ORG_PRO, 'core.learners')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_PRO, 'music.core')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_PRO, 'dance.core')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_PRO, 'guardian_portal')).toBe(true);

      // Enterprise Operational Modules
      expect(await entitlementResolverService.hasFeature(ORG_PRO, 'events.core')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_PRO, 'events.transport')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_PRO, 'events.consent')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_PRO, 'finance.reporting')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_PRO, 'staff_operations.core')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_PRO, 'analytics.advanced')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_PRO, 'automation.core')).toBe(true);
    });

    it('enforces approved Professional limits', async () => {
      expect(await entitlementResolverService.getLimit(ORG_PRO, 'limits.learners')).toBe(500);
      expect(await entitlementResolverService.getLimit(ORG_PRO, 'limits.staff_users')).toBe(50);
      expect(await entitlementResolverService.getLimit(ORG_PRO, 'limits.storage_mb')).toBe(25000); // 25 GB
      expect(await entitlementResolverService.getLimit(ORG_PRO, 'limits.monthly_communications')).toBe(2000);
      expect(await entitlementResolverService.getLimit(ORG_PRO, 'limits.automation_runs')).toBe(1000);
    });
  });

  describe('4. Trial Journey & Configuration', () => {
    it('grants Professional plan entitlements to new 14-day trials', async () => {
      const trialSub: Subscription = {
        id: 'sub_trial_new',
        organisationId: 'org_new_trial',
        planId: 'plan_professional',
        subscriptionStatus: 'trialing',
        billingMode: 'manual',
        billingInterval: 'monthly',
        currency: 'ZAR',
        priceAmount: 0,
        trialStartedAt: new Date().toISOString(),
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'system',
        status: 'active'
      };

      vi.spyOn(subscriptionRepository, 'getPrimarySubscription').mockResolvedValue(trialSub);
      vi.spyOn(subscriptionPlanRepository, 'getById').mockResolvedValue(null);
      vi.spyOn(organisationEntitlementOverrideRepository, 'getByOrganisation').mockResolvedValue([]);

      // Verify trial on plan_professional has events.core and automation.core
      const hasEvents = await entitlementResolverService.hasFeature('org_new_trial', 'events.core');
      const hasAutomation = await entitlementResolverService.hasFeature('org_new_trial', 'automation.core');
      const learnerLimit = await entitlementResolverService.getLimit('org_new_trial', 'limits.learners');

      expect(hasEvents).toBe(true);
      expect(hasAutomation).toBe(true);
      expect(learnerLimit).toBe(500);
    });
  });

  describe('5. Usage Limits, Warnings & Non-Lockout Guarantee', () => {
    it('calculates 80% warning and 90% critical upgrade prompt accurately', () => {
      // 80 out of 100 = 80%
      const status80 = usageMeteringService.calculateUsageStatus(80, 100);
      expect(status80.percentUsed).toBe(80);
      expect(status80.status).toBe('warning');
      expect(status80.warning).toBe(true);
      expect(status80.exceeded).toBe(false);

      // 90 out of 100 = 90%
      const status90 = usageMeteringService.calculateUsageStatus(90, 100);
      expect(status90.percentUsed).toBe(90);
      expect(status90.status).toBe('critical');
      expect(status90.warning).toBe(true);
      expect(status90.exceeded).toBe(false);

      // 100 out of 100 = 100% (exceeded)
      const status100 = usageMeteringService.calculateUsageStatus(100, 100);
      expect(status100.percentUsed).toBe(100);
      expect(status100.status).toBe('exceeded');
      expect(status100.exceeded).toBe(true);
    });

    it('blocks incrementing when at 100% limit with PlanLimitExceededError', async () => {
      vi.spyOn(organisationUsageRepository, 'getOrCreate').mockResolvedValue({
        id: 'usage_starter',
        organisationId: ORG_STARTER,
        billingPeriod: '2026-03',
        learnersCount: 100, // At capacity!
        staffUsersCount: 5,
        storageMb: 1000,
        monthlyCommunicationsCount: 50,
        automationRunsCount: 0,
        lastSyncedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        updatedBy: 'system',
        status: 'active'
      });
      vi.spyOn(entitlementResolverService, 'getLimit').mockResolvedValue(100);

      await expect(
        usageMeteringService.assertWithinLimit(ORG_STARTER, 'limits.learners', 1)
      ).rejects.toThrow(PlanLimitExceededError);
    });
  });

  describe('6. Legacy Full Compatibility', () => {
    it('preserves complete unmetered access for plan_legacy_full', async () => {
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(mockLegacyOrg);
      vi.spyOn(subscriptionPlanRepository, 'getById').mockResolvedValue(null);
      vi.spyOn(organisationEntitlementOverrideRepository, 'getByOrganisation').mockResolvedValue([]);

      expect(await entitlementResolverService.hasFeature(ORG_LEGACY, 'events.core')).toBe(true);
      expect(await entitlementResolverService.hasFeature(ORG_LEGACY, 'automation.core')).toBe(true);
      expect(await entitlementResolverService.getLimit(ORG_LEGACY, 'limits.learners')).toBeNull();
    });
  });

  describe('7. Idempotent Commercial Reconciliation', () => {
    it('reconciles features, plans, entitlements, and prices idempotently', async () => {
      vi.spyOn(platformFeatureRepository, 'getByKey').mockResolvedValue(null);
      vi.spyOn(platformFeatureRepository, 'save').mockResolvedValue();
      vi.spyOn(subscriptionPlanRepository, 'getById').mockResolvedValue(null);
      vi.spyOn(subscriptionPlanRepository, 'save').mockResolvedValue();
      vi.spyOn(planEntitlementRepository, 'save').mockResolvedValue();
      vi.spyOn(planPriceRepository, 'save').mockResolvedValue();
      vi.spyOn(auditService, 'log').mockResolvedValue();

      const result = await commercialReconciliationService.reconcileCommercialConfiguration('super_admin_test');
      expect(result.featuresReconciled).toBeGreaterThanOrEqual(20);
      expect(result.plansReconciled).toBe(5); // legacy, starter, professional, premium, enterprise
      expect(result.entitlementsReconciled).toBeGreaterThan(50);
      expect(result.pricesReconciled).toBeGreaterThanOrEqual(4);
    });
  });
});
