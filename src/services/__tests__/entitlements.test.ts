import { describe, it, expect, vi, beforeEach } from 'vitest';
import { entitlementResolverService } from '../entitlementResolverService';
import { entitlementOverrideService } from '../entitlementOverrideService';
import { planAssignmentService } from '../planAssignmentService';
import { platformFeatureService } from '../platformFeatureService';
import { permissionService } from '../permissionService';
import { STANDARD_PLATFORM_FEATURES, validateFeatureDependencies } from '../../config/platformFeaturesRegistry';
import { STANDARD_PLANS, buildPlanEntitlementRecords } from '../../config/subscriptionPlansRegistry';
import { organisationRepository } from '../../repositories/organisationRepository';
import { subscriptionPlanRepository } from '../../repositories/subscriptionPlanRepository';
import { organisationEntitlementOverrideRepository } from '../../repositories/organisationEntitlementOverrideRepository';
import { platformFeatureRepository } from '../../repositories/platformFeatureRepository';
import { auditService } from '../auditService';
import type { Organisation, OrganisationEntitlementOverride, PlatformFeature } from '../../types';

describe('SaaS 2A — Plans, Features & Entitlements Test Suite', () => {
  const ORG_LEGACY_ID = 'org_legacy_v1_0';
  const ORG_STARTER_ID = 'org_starter_tenant';
  const ORG_PRO_ID = 'org_pro_tenant';

  const mockLegacyOrg: Organisation = {
    id: ORG_LEGACY_ID,
    organisationId: ORG_LEGACY_ID,
    name: 'Legacy Arts Academy',
    organisationType: 'music_and_dance',
    tenantStatus: 'active',
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system'
    // Note: assignedPlanId is purposely undefined to verify v1.0 fallback
  };

  const mockStarterOrg: Organisation = {
    id: ORG_STARTER_ID,
    organisationId: ORG_STARTER_ID,
    name: 'Starter Community School',
    organisationType: 'music',
    tenantStatus: 'active',
    assignedPlanId: 'plan_starter',
    status: 'active',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system'
  };

  const mockProOrg: Organisation = {
    id: ORG_PRO_ID,
    organisationId: ORG_PRO_ID,
    name: 'Professional Conservatory',
    organisationType: 'performing_arts',
    tenantStatus: 'active',
    assignedPlanId: 'plan_professional',
    status: 'active',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
    createdBy: 'system',
    updatedBy: 'system'
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    entitlementResolverService.clearCache();
  });

  describe('1. Standard Plan & Feature Registries', () => {
    it('defines standard commercial plans with correct tiers and codes', () => {
      const planCodes = STANDARD_PLANS.map((p) => p.plan.code);
      expect(planCodes).toContain('legacy_full');
      expect(planCodes).toContain('starter');
      expect(planCodes).toContain('professional');
      expect(planCodes).toContain('premium');
      expect(planCodes).toContain('enterprise');
    });

    it('generates consistent deterministic plan entitlement records', () => {
      const starterDef = STANDARD_PLANS.find((p) => p.plan.code === 'starter')!;
      const records = buildPlanEntitlementRecords('plan_starter', starterDef.entitlements, 'system');
      expect(records.length).toBe(STANDARD_PLATFORM_FEATURES.length);

      const learnerRecord = records.find((r) => r.featureKey === 'core.learners');
      expect(learnerRecord?.enabled).toBe(true);

      // Music and Dance are included in Starter (ArtsFlow identity)
      const musicRecord = records.find((r) => r.featureKey === 'music.core');
      expect(musicRecord?.enabled).toBe(true);

      const danceRecord = records.find((r) => r.featureKey === 'dance.core');
      expect(danceRecord?.enabled).toBe(true);

      // Events is a Professional boundary
      const eventsRecord = records.find((r) => r.featureKey === 'events.core');
      expect(eventsRecord?.enabled).toBe(false);
    });

    it('validates feature dependencies correctly', () => {
      // Valid: core enabled with child
      const valid = validateFeatureDependencies({
        'music.core': true,
        'music.instruments': true
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);

      // Invalid: subfeature enabled without parent module
      const invalid = validateFeatureDependencies({
        'music.core': false,
        'music.instruments': true
      });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.length).toBeGreaterThan(0);
      expect(invalid.errors[0]).toContain("requires 'music.core'");
    });
  });

  describe('2. Legacy v1.0 Organisation Backward Compatibility', () => {
    it('automatically resolves unassigned organisation to plan_legacy_full with 100% operational features', async () => {
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(mockLegacyOrg);
      vi.spyOn(subscriptionPlanRepository, 'getById').mockResolvedValue(null); // Will use standard registry fallback
      vi.spyOn(organisationEntitlementOverrideRepository, 'getByOrganisation').mockResolvedValue([]);

      const hasMusic = await entitlementResolverService.hasFeature(ORG_LEGACY_ID, 'music.core');
      const hasDance = await entitlementResolverService.hasFeature(ORG_LEGACY_ID, 'dance.core');
      const hasFinance = await entitlementResolverService.hasFeature(ORG_LEGACY_ID, 'finance.core');
      const hasAutomation = await entitlementResolverService.hasFeature(ORG_LEGACY_ID, 'automation.core');
      const hasGuardianPortal = await entitlementResolverService.hasFeature(ORG_LEGACY_ID, 'guardian_portal');

      expect(hasMusic).toBe(true);
      expect(hasDance).toBe(true);
      expect(hasFinance).toBe(true);
      expect(hasAutomation).toBe(true);
      expect(hasGuardianPortal).toBe(true);

      // Verify limits are unlimited (null)
      const learnerLimit = await entitlementResolverService.getLimit(ORG_LEGACY_ID, 'limits.learners');
      expect(learnerLimit).toBeNull();
    });
  });

  describe('3. Standard Plan Feature Resolution', () => {
    it('enables core, music, dance, finance and restricts events/automation for Starter tier', async () => {
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(mockStarterOrg);
      vi.spyOn(subscriptionPlanRepository, 'getById').mockResolvedValue(null);
      vi.spyOn(organisationEntitlementOverrideRepository, 'getByOrganisation').mockResolvedValue([]);

      const hasLearners = await entitlementResolverService.hasFeature(ORG_STARTER_ID, 'core.learners');
      const hasMusic = await entitlementResolverService.hasFeature(ORG_STARTER_ID, 'music.core');
      const hasDance = await entitlementResolverService.hasFeature(ORG_STARTER_ID, 'dance.core');
      const hasFinance = await entitlementResolverService.hasFeature(ORG_STARTER_ID, 'finance.core');
      const hasEvents = await entitlementResolverService.hasFeature(ORG_STARTER_ID, 'events.core');
      const hasAutomation = await entitlementResolverService.hasFeature(ORG_STARTER_ID, 'automation.core');

      expect(hasLearners).toBe(true);
      expect(hasMusic).toBe(true);
      expect(hasDance).toBe(true);
      expect(hasFinance).toBe(true);
      expect(hasEvents).toBe(false);
      expect(hasAutomation).toBe(false);

      // Starter learner limit
      const learnerLimit = await entitlementResolverService.getLimit(ORG_STARTER_ID, 'limits.learners');
      expect(learnerLimit).toBe(100);
    });

    it('enables music, dance, events, finance, automation, and staff ops for Professional tier', async () => {
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(mockProOrg);
      vi.spyOn(subscriptionPlanRepository, 'getById').mockResolvedValue(null);
      vi.spyOn(organisationEntitlementOverrideRepository, 'getByOrganisation').mockResolvedValue([]);

      const hasMusic = await entitlementResolverService.hasFeature(ORG_PRO_ID, 'music.core');
      const hasDance = await entitlementResolverService.hasFeature(ORG_PRO_ID, 'dance.core');
      const hasFinance = await entitlementResolverService.hasFeature(ORG_PRO_ID, 'finance.core');
      const hasEvents = await entitlementResolverService.hasFeature(ORG_PRO_ID, 'events.core');
      const hasAutomation = await entitlementResolverService.hasFeature(ORG_PRO_ID, 'automation.core');
      const hasStaffOps = await entitlementResolverService.hasFeature(ORG_PRO_ID, 'staff_operations.core');

      expect(hasMusic).toBe(true);
      expect(hasDance).toBe(true);
      expect(hasFinance).toBe(true);
      expect(hasEvents).toBe(true);
      expect(hasAutomation).toBe(true);
      expect(hasStaffOps).toBe(true);

      const proLearnerLimit = await entitlementResolverService.getLimit(ORG_PRO_ID, 'limits.learners');
      expect(proLearnerLimit).toBe(500);
    });
  });

  describe('4. Organisation Entitlement Overrides', () => {
    it('overrides plan to force-enable a feature with source tag', async () => {
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(mockStarterOrg);
      vi.spyOn(subscriptionPlanRepository, 'getById').mockResolvedValue(null);

      const activeOverride: OrganisationEntitlementOverride = {
        id: 'ovr_123',
        organisationId: ORG_STARTER_ID,
        featureKey: 'events.core',
        overrideType: 'enable',
        reason: 'Special events pilot trial for Q1',
        startsAt: '2026-01-01T00:00:00Z',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'super_admin_01',
        updatedBy: 'super_admin_01'
      };

      vi.spyOn(organisationEntitlementOverrideRepository, 'getActiveByOrganisation').mockResolvedValue([activeOverride]);

      const hasEvents = await entitlementResolverService.hasFeature(ORG_STARTER_ID, 'events.core');
      expect(hasEvents).toBe(true);

      const ents = await entitlementResolverService.getOrganisationEntitlements(ORG_STARTER_ID);
      expect(ents['events.core'].enabled).toBe(true);
      expect(ents['events.core'].source).toBe('override');
      expect(ents['events.core'].overrideReason).toBe('Special events pilot trial for Q1');
    });

    it('overrides plan to force-disable a feature', async () => {
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(mockProOrg);
      vi.spyOn(subscriptionPlanRepository, 'getById').mockResolvedValue(null);

      const disableOverride: OrganisationEntitlementOverride = {
        id: 'ovr_456',
        organisationId: ORG_PRO_ID,
        featureKey: 'finance.core',
        overrideType: 'disable',
        reason: 'Customer requested disabling finance module during audit',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'super_admin_01',
        updatedBy: 'super_admin_01'
      };

      vi.spyOn(organisationEntitlementOverrideRepository, 'getActiveByOrganisation').mockResolvedValue([disableOverride]);

      const hasFinance = await entitlementResolverService.hasFeature(ORG_PRO_ID, 'finance.core');
      expect(hasFinance).toBe(false);

      const ents = await entitlementResolverService.getOrganisationEntitlements(ORG_PRO_ID);
      expect(ents['finance.core'].enabled).toBe(false);
      expect(ents['finance.core'].source).toBe('override');
    });

    it('ignores expired overrides and falls back to plan value', async () => {
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(mockStarterOrg);
      vi.spyOn(subscriptionPlanRepository, 'getById').mockResolvedValue(null);

      // Verify active overrides filter returns empty when override expired
      vi.spyOn(organisationEntitlementOverrideRepository, 'getActiveByOrganisation').mockResolvedValue([]);

      const hasEvents = await entitlementResolverService.hasFeature(ORG_STARTER_ID, 'events.core');
      // Should fall back to plan entitlement (starter => false)
      expect(hasEvents).toBe(false);
    });

    it('requires a mandatory justification reason to create an override', async () => {
      await expect(
        entitlementOverrideService.createOverride('admin_01', ORG_STARTER_ID, {
          featureKey: 'music.core',
          overrideType: 'enable',
          reason: '   ' // empty string
        })
      ).rejects.toThrow(/justification reason/i);
    });
  });

  describe('5. Platform Kill Switch / Safety Inactive Rules', () => {
    it('disables feature across all plans when featureStatus is inactive', async () => {
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(mockProOrg);
      vi.spyOn(subscriptionPlanRepository, 'getById').mockResolvedValue(null);
      vi.spyOn(organisationEntitlementOverrideRepository, 'getByOrganisation').mockResolvedValue([]);

      // Mock platformFeatures repository returning music.core with status = inactive
      vi.spyOn(platformFeatureRepository, 'getAll').mockResolvedValue([
        {
          id: 'music_core',
          key: 'music.core',
          name: 'Music Core',
          description: 'Music module disabled by kill switch',
          category: 'music',
          featureType: 'boolean',
          featureStatus: 'inactive', // KILL SWITCH ACTIVE
          defaultEnabled: true,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          createdBy: 'system',
          updatedBy: 'system',
          status: 'active'
        }
      ]);

      const hasMusic = await entitlementResolverService.hasFeature(ORG_PRO_ID, 'music.core');
      expect(hasMusic).toBe(false);

      const ents = await entitlementResolverService.getOrganisationEntitlements(ORG_PRO_ID);
      expect(ents['music.core'].enabled).toBe(false);
      expect(ents['music.core'].source).toBe('system');
    });
  });

  describe('6. Plan Assignment & Immutability', () => {
    it('assigns plan and invalidates resolver cache', async () => {
      vi.spyOn(subscriptionPlanRepository, 'getById').mockResolvedValue({
        id: 'plan_premium',
        name: 'Premium Performing Arts',
        code: 'premium',
        description: 'Comprehensive Performing Arts',
        planStatus: 'active',
        displayOrder: 3,
        isPublic: true,
        recommended: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'system',
        updatedBy: 'system',
        status: 'active'
      });
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(mockStarterOrg);
      vi.spyOn(organisationRepository, 'update').mockResolvedValue();
      const auditSpy = vi.spyOn(auditService, 'log').mockResolvedValue();

      await planAssignmentService.assignPlan('super_admin_01', ORG_STARTER_ID, 'plan_premium');

      expect(organisationRepository.update).toHaveBeenCalledWith(
        ORG_STARTER_ID,
        'super_admin_01',
        expect.objectContaining({ assignedPlanId: 'plan_premium' })
      );
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          organisationId: ORG_STARTER_ID,
          actorId: 'super_admin_01',
          action: 'PLATFORM_ASSIGN_PLAN'
        })
      );
    });

    it('rejects duplicate feature keys on creation', async () => {
      const existingFeature: PlatformFeature = {
        id: 'music_core',
        key: 'music.core',
        name: 'Music Core',
        description: 'Existing feature',
        category: 'music',
        featureType: 'boolean',
        featureStatus: 'active',
        defaultEnabled: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        createdBy: 'system',
        updatedBy: 'system',
        status: 'active'
      };
      vi.spyOn(platformFeatureRepository, 'getByKey').mockResolvedValue(existingFeature);

      await expect(
        platformFeatureService.createFeature('admin_01', {
          key: 'music.core',
          name: 'Duplicate Music',
          description: 'Duplicate description',
          category: 'music',
          featureType: 'boolean',
          featureStatus: 'active',
          defaultEnabled: true
        })
      ).rejects.toThrow("already exists");
    });
  });

  describe('7. Platform Authorization & Permissions', () => {
    it('verifies SaaS 2A permissions are declared in PermissionService', () => {
      expect(permissionService.hasPlatformPermission('super_admin', 'platform.plans.read')).toBe(true);
      expect(permissionService.hasPlatformPermission('super_admin', 'platform.plans.manage')).toBe(true);
      expect(permissionService.hasPlatformPermission('super_admin', 'platform.features.read')).toBe(true);
      expect(permissionService.hasPlatformPermission('super_admin', 'platform.features.manage')).toBe(true);
      expect(permissionService.hasPlatformPermission('super_admin', 'platform.entitlements.manage')).toBe(true);

      // Regular organisation admin has NO platform permissions
      expect(permissionService.hasPlatformPermission(undefined, 'platform.plans.manage')).toBe(false);
    });
  });
});
