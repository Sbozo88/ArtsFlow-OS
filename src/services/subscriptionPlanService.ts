import { subscriptionPlanRepository } from '../repositories/subscriptionPlanRepository';
import {
  planEntitlementRepository,
  getPlanEntitlementDocId
} from '../repositories/planEntitlementRepository';
import { auditService } from './auditService';
import { validateFeatureDependencies } from '../config/platformFeaturesRegistry';
import type { SubscriptionPlan, PlanEntitlement, PlanStatus } from '../types';

export const subscriptionPlanService = {
  async listPlans(): Promise<SubscriptionPlan[]> {
    return subscriptionPlanRepository.getAll();
  },

  async getPlan(id: string): Promise<SubscriptionPlan | null> {
    return subscriptionPlanRepository.getById(id);
  },

  async getPlanByCode(code: string): Promise<SubscriptionPlan | null> {
    return subscriptionPlanRepository.getByCode(code);
  },

  async getPlanEntitlements(planId: string): Promise<PlanEntitlement[]> {
    return planEntitlementRepository.getByPlanId(planId);
  },

  async createPlan(
    actorId: string,
    data: {
      name: string;
      code: string;
      description?: string;
      planStatus?: PlanStatus;
      displayOrder?: number;
      isPublic?: boolean;
      recommended?: boolean;
      entitlements?: Record<string, boolean | { enabled: boolean; limitValue?: number | null; configuration?: Record<string, unknown> }>;
    }
  ): Promise<SubscriptionPlan> {
    const existing = await subscriptionPlanRepository.getByCode(data.code);
    if (existing) {
      throw new Error(`Plan with code '${data.code}' already exists.`);
    }

    // Validate feature dependencies if entitlements provided
    if (data.entitlements) {
      const enabledKeys = Object.entries(data.entitlements)
        .filter(([, val]) => (typeof val === 'boolean' ? val : val.enabled))
        .map(([key]) => key);

      const depCheck = validateFeatureDependencies(enabledKeys);
      if (!depCheck.valid) {
        const issues = depCheck.missingDependencies
          .map((d) => `'${d.feature}' requires '${d.required}'`)
          .join(', ');
        throw new Error(`Invalid plan entitlements: ${issues}`);
      }
    }

    const now = new Date().toISOString();
    const planId = `plan_${data.code.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;

    const plan: SubscriptionPlan = {
      id: planId,
      name: data.name,
      code: data.code.toLowerCase().trim(),
      description: data.description,
      planStatus: data.planStatus || 'active',
      displayOrder: data.displayOrder ?? 10,
      isPublic: data.isPublic ?? true,
      recommended: data.recommended ?? false,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
      status: 'active'
    };

    await subscriptionPlanRepository.save(plan);

    // Persist entitlements if provided
    if (data.entitlements) {
      for (const [featureKey, config] of Object.entries(data.entitlements)) {
        const isBool = typeof config === 'boolean';
        const enabled = isBool ? config : config.enabled;
        const limitValue = !isBool && config.limitValue !== undefined ? config.limitValue : null;
        const configuration = !isBool && config.configuration ? config.configuration : undefined;

        const ent: PlanEntitlement = {
          id: getPlanEntitlementDocId(plan.id, featureKey),
          planId: plan.id,
          featureKey,
          enabled,
          limitValue,
          configuration,
          createdAt: now,
          updatedAt: now,
          createdBy: actorId,
          updatedBy: actorId,
          status: 'active'
        };
        await planEntitlementRepository.save(ent);
      }
    }

    await auditService.log({
      organisationId: 'platform',
      actorId,
      action: 'PLATFORM_CREATE_PLAN',
      entityType: 'subscriptionPlan',
      entityId: plan.id,
      scopeType: 'platform',
      after: plan
    });

    return plan;
  },

  async updatePlan(
    actorId: string,
    id: string,
    updates: {
      name?: string;
      description?: string;
      planStatus?: PlanStatus;
      displayOrder?: number;
      isPublic?: boolean;
      recommended?: boolean;
    }
  ): Promise<SubscriptionPlan> {
    const current = await subscriptionPlanRepository.getById(id);
    if (!current) {
      throw new Error(`Plan '${id}' not found.`);
    }

    const updated: SubscriptionPlan = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: actorId
    };

    await subscriptionPlanRepository.save(updated);

    await auditService.log({
      organisationId: 'platform',
      actorId,
      action: 'PLATFORM_UPDATE_PLAN',
      entityType: 'subscriptionPlan',
      entityId: id,
      scopeType: 'platform',
      before: current,
      after: updated
    });

    return updated;
  },

  async archivePlan(actorId: string, id: string): Promise<SubscriptionPlan> {
    const current = await subscriptionPlanRepository.getById(id);
    if (!current) {
      throw new Error(`Plan '${id}' not found.`);
    }

    const updated: SubscriptionPlan = {
      ...current,
      planStatus: 'archived',
      updatedAt: new Date().toISOString(),
      updatedBy: actorId
    };

    await subscriptionPlanRepository.save(updated);

    await auditService.log({
      organisationId: 'platform',
      actorId,
      action: 'PLATFORM_ARCHIVE_PLAN',
      entityType: 'subscriptionPlan',
      entityId: id,
      scopeType: 'platform',
      before: current,
      after: updated
    });

    return updated;
  },

  async setPlanEntitlement(
    actorId: string,
    planId: string,
    featureKey: string,
    config: {
      enabled: boolean;
      limitValue?: number | null;
      configuration?: Record<string, unknown>;
    }
  ): Promise<PlanEntitlement> {
    const plan = await subscriptionPlanRepository.getById(planId);
    if (!plan) throw new Error(`Plan '${planId}' not found.`);

    // Check dependencies if enabling
    if (config.enabled) {
      const existingEnts = await planEntitlementRepository.getByPlanId(planId);
      const enabledKeys = existingEnts.filter((e) => e.enabled).map((e) => e.featureKey);
      enabledKeys.push(featureKey);

      const depCheck = validateFeatureDependencies(enabledKeys);
      if (!depCheck.valid) {
        const issues = depCheck.missingDependencies
          .map((d) => `'${d.feature}' requires '${d.required}'`)
          .join(', ');
        throw new Error(`Cannot enable feature: ${issues}`);
      }
    }

    const now = new Date().toISOString();
    const docId = getPlanEntitlementDocId(planId, featureKey);
    const existing = await planEntitlementRepository.getByPlanAndFeature(planId, featureKey);

    const entitlement: PlanEntitlement = {
      id: docId,
      planId,
      featureKey,
      enabled: config.enabled,
      limitValue: config.limitValue !== undefined ? config.limitValue : null,
      configuration: config.configuration,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      createdBy: existing?.createdBy || actorId,
      updatedBy: actorId,
      status: 'active'
    };

    await planEntitlementRepository.save(entitlement);

    await auditService.log({
      organisationId: 'platform',
      actorId,
      action: 'PLATFORM_UPDATE_PLAN_ENTITLEMENT',
      entityType: 'planEntitlement',
      entityId: docId,
      scopeType: 'platform',
      before: existing,
      after: entitlement
    });

    return entitlement;
  }
};
