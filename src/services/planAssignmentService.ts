import { organisationRepository } from '../repositories/organisationRepository';
import { subscriptionPlanRepository } from '../repositories/subscriptionPlanRepository';
import { auditService } from './auditService';
import { entitlementResolverService } from './entitlementResolverService';
import type { Organisation, SubscriptionPlan } from '../types';

export interface PlanAssignmentResult {
  organisation: Organisation;
  assignedPlan: SubscriptionPlan;
}

export const planAssignmentService = {
  /**
   * Assigns a subscription plan to an organisation.
   * Validates that the plan exists and is active (not archived).
   * Emits PLATFORM_ASSIGN_PLAN audit log and triggers cache invalidation.
   */
  async assignPlan(
    actorId: string,
    organisationId: string,
    planId: string
  ): Promise<PlanAssignmentResult> {
    const plan = await subscriptionPlanRepository.getById(planId);
    if (!plan) {
      throw new Error(`Plan '${planId}' does not exist.`);
    }

    if (plan.planStatus === 'archived') {
      throw new Error(`Cannot assign archived plan '${plan.name}' (${plan.code}) to organisations.`);
    }

    const currentOrg = await organisationRepository.getById(organisationId);
    if (!currentOrg) {
      throw new Error(`Organisation '${organisationId}' not found.`);
    }

    const previousPlanId = currentOrg.assignedPlanId;

    const now = new Date().toISOString();
    const updatedFields = {
      assignedPlanId: plan.id,
      updatedAt: now,
      updatedBy: actorId
    };

    await organisationRepository.update(organisationId, actorId, updatedFields);

    const updatedOrg: Organisation = {
      ...currentOrg,
      ...updatedFields
    };

    await auditService.log({
      organisationId,
      actorId,
      action: 'PLATFORM_ASSIGN_PLAN',
      entityType: 'organisation',
      entityId: organisationId,
      scopeType: 'platform',
      reason: `Assigned plan '${plan.name}' (${plan.code})`,
      before: { assignedPlanId: previousPlanId },
      after: { assignedPlanId: plan.id }
    });

    // Invalidate cache
    entitlementResolverService.invalidateCache(organisationId);

    return {
      organisation: updatedOrg,
      assignedPlan: plan
    };
  }
};
