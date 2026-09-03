import { organisationRepository } from '../../repositories/organisationRepository';
import { subscriptionResolverService } from '../billing/subscriptionResolverService';
import { subscriptionRepository } from '../../repositories/subscriptionRepository';
import { customerLifecycleService } from '../customerLifecycleService';
import { usageMeteringService } from '../usageMeteringService';
import { organisationMembershipRepository } from '../../repositories/organisationMembershipRepository';
import { organisationReadinessService } from '../onboarding/organisationReadinessService';
import { auditService } from '../auditService';
import type {
  PlatformDiagnosticReport,
  Subscription,
  OrganisationUsageSummary
} from '../../types';

export class PlatformSupportService {
  /**
   * Generates a comprehensive health and operational diagnostics report for an organisation.
   */
  async generateDiagnosticReport(organisationId: string): Promise<PlatformDiagnosticReport> {
    const [org, sub, lifecycle, usage, memberships, readiness] = await Promise.all([
      organisationRepository.getById(organisationId),
      subscriptionResolverService.getCurrentSubscription(organisationId),
      customerLifecycleService.getLifecycleState(organisationId),
      usageMeteringService.getUsageMeters(organisationId).catch(() => null),
      organisationMembershipRepository.getByOrganisation(organisationId).catch(() => []),
      organisationReadinessService.evaluateReadiness(organisationId).catch(() => null)
    ]);

    if (!org) {
      throw new Error(`Organisation not found: ${organisationId}`);
    }

    const activeMembers = memberships.filter((m) => m.membershipStatus === 'active');
    const adminMembers = activeMembers.filter((m) => m.role === 'organisation_admin' || m.role === 'super_admin');
    const hasOwnerOrAdmin = adminMembers.length > 0;

    const warnings: string[] = [];
    let healthScore = 100;

    // Evaluate health rules
    if (!hasOwnerOrAdmin) {
      warnings.push('CRITICAL: Organisation has no active administrator assigned.');
      healthScore -= 35;
    }

    if (lifecycle.isSuspended) {
      warnings.push(`Account suspended: ${lifecycle.suspensionReason || 'No reason provided'}`);
      healthScore -= 50;
    } else if (lifecycle.isRestricted) {
      warnings.push(`Account restricted: ${lifecycle.restrictionReason || 'Trial expired or past due'}`);
      healthScore -= 30;
    } else if (lifecycle.isPastDue) {
      warnings.push(`Renewal past due: ${lifecycle.pastDueGraceDaysRemaining ?? 0} days remaining in grace period.`);
      healthScore -= 20;
    } else if (lifecycle.isTrialExpiringSoon) {
      warnings.push(`Trial expiring in ${lifecycle.trialDaysRemaining ?? 0} days without saved payment method.`);
      healthScore -= 10;
    }

    if (usage?.anyExceeded) {
      warnings.push('Plan capacity limit exceeded on one or more usage meters.');
      healthScore -= 20;
    } else if (usage?.anyWarning) {
      warnings.push('One or more usage meters are nearing capacity (>= 80%).');
      healthScore -= 5;
    }

    if (readiness && !readiness.isReady) {
      const pendingCount = readiness.conditions.filter((c) => !c.met).length;
      warnings.push(`Onboarding incomplete: ${pendingCount} readiness requirements pending.`);
      healthScore -= 10;
    }

    healthScore = Math.max(0, Math.min(100, healthScore));

    let readinessStatus: 'ready' | 'pending' | 'action_required' = 'ready';
    if (!readiness?.isReady) {
      readinessStatus = readiness?.conditions.some((c) => !c.met && c.required)
        ? 'action_required'
        : 'pending';
    }

    return {
      organisationId,
      organisationName: org.name,
      tenantStatus: org.tenantStatus || 'active',
      subscription: sub,
      lifecycleState: lifecycle,
      usageSummary: usage,
      memberCount: activeMembers.length,
      adminCount: adminMembers.length,
      hasOwnerOrAdmin,
      readinessStatus,
      warnings,
      healthScore,
      checkedAt: new Date().toISOString()
    };
  }

  /**
   * Forces an authoritative re-sync of usage counters from raw operational records.
   */
  async forceSyncUsage(organisationId: string, actorId: string): Promise<OrganisationUsageSummary> {
    const updated = await usageMeteringService.syncAllUsage(organisationId, actorId);

    await auditService.log({
      organisationId,
      actorId,
      action: 'UPDATE',
      entityType: 'organisationUsage',
      entityId: `usage_${organisationId}`,
      scopeType: 'platform',
      reason: 'Authoritative force synchronization of tenant usage meters',
      after: {
        learnersCount: updated.meters['limits.learners']?.current,
        staffUsersCount: updated.meters['limits.staff_users']?.current,
        storageMb: updated.meters['limits.storage_mb']?.current
      }
    });

    return updated;
  }

  /**
   * Extends the trial period for an organisation and lifts trial expiry restrictions.
   */
  async extendTrial(
    organisationId: string,
    actorId: string,
    additionalDays: number,
    reason: string
  ): Promise<Subscription> {
    if (additionalDays <= 0) {
      throw new Error('additionalDays must be greater than 0');
    }

    const sub = await subscriptionResolverService.getCurrentSubscription(organisationId);
    if (!sub) {
      throw new Error(`No active subscription or trial found for organisation ${organisationId}`);
    }

    const currentExpiry = sub.trialEndsAt ? new Date(sub.trialEndsAt).getTime() : Date.now();
    const baseTime = Math.max(Date.now(), currentExpiry);
    const newExpiry = new Date(baseTime + additionalDays * 24 * 60 * 60 * 1000).toISOString();

    await subscriptionRepository.update(sub.id, {
      trialEndsAt: newExpiry,
      currentPeriodEnd: newExpiry,
      subscriptionStatus: 'trialing'
    });

    // Ensure organisation tenantStatus is trial if restricted
    const org = await organisationRepository.getById(organisationId);
    if (org && org.tenantStatus === 'restricted') {
      await organisationRepository.update(org.id, actorId, {
        tenantStatus: 'trial',
        restrictionReason: undefined,
        restrictionReasonType: undefined
      });
    }

    await auditService.log({
      organisationId,
      actorId,
      action: 'UPDATE',
      entityType: 'subscription',
      entityId: sub.id,
      scopeType: 'platform',
      reason: `Extended trial by ${additionalDays} days: ${reason}`,
      after: {
        newExpiry,
        additionalDays
      }
    });

    const updated = await subscriptionResolverService.getCurrentSubscription(organisationId);
    return updated!;
  }

  /**
   * Grants a temporary past-due grace extension to restore operational access while billing is resolved.
   */
  async grantPastDueGrace(
    organisationId: string,
    actorId: string,
    additionalDays: number,
    reason: string
  ): Promise<Subscription> {
    if (additionalDays <= 0) {
      throw new Error('additionalDays must be greater than 0');
    }

    const sub = await subscriptionResolverService.getCurrentSubscription(organisationId);
    if (!sub) {
      throw new Error(`No active subscription found for organisation ${organisationId}`);
    }

    const currentExpiry = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).getTime() : Date.now();
    const baseTime = Math.max(Date.now(), currentExpiry);
    const newPeriodEnd = new Date(baseTime + additionalDays * 24 * 60 * 60 * 1000).toISOString();

    await subscriptionRepository.update(sub.id, {
      currentPeriodEnd: newPeriodEnd
    });

    // If organisation was restricted, lift restriction
    const org = await organisationRepository.getById(organisationId);
    if (org && org.tenantStatus === 'restricted') {
      await organisationRepository.update(org.id, actorId, {
        tenantStatus: 'active',
        restrictionReason: undefined,
        restrictionReasonType: undefined
      });
    }

    await auditService.log({
      organisationId,
      actorId,
      action: 'UPDATE',
      entityType: 'subscription',
      entityId: sub.id,
      scopeType: 'platform',
      reason: `Granted ${additionalDays} days past-due grace extension: ${reason}`,
      after: {
        newPeriodEnd,
        additionalDays
      }
    });

    const updated = await subscriptionResolverService.getCurrentSubscription(organisationId);
    return updated!;
  }
}

export const platformSupportService = new PlatformSupportService();
