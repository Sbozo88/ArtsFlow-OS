import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { subscriptionPlanService } from '../subscriptionPlanService';
import type {
  Organisation,
  Subscription,
  OrganisationUsage,
  CommercialAnalyticsSummary,
  CommercialPlanMetric,
  PlatformUsageAggregate,
  TenantAtRisk
} from '../../types';

export class CommercialAnalyticsService {
  /**
   * Aggregates global commercial analytics across subscriptions, plans, and platform usage.
   * Runs privacy-preserving metrics without exposing confidential learner or invoice records.
   */
  async getCommercialAnalytics(): Promise<CommercialAnalyticsSummary> {
    const [orgsSnap, subsSnap, usageSnap, plans] = await Promise.all([
      getDocs(collection(db, 'organisations')),
      getDocs(collection(db, 'subscriptions')),
      getDocs(collection(db, 'organisationUsage')),
      subscriptionPlanService.listPlans()
    ]);

    const orgs: Organisation[] = [];
    orgsSnap.forEach((d) => orgs.push(d.data() as Organisation));

    const subs: Subscription[] = [];
    subsSnap.forEach((d) => subs.push(d.data() as Subscription));

    const usages: OrganisationUsage[] = [];
    usageSnap.forEach((d) => usages.push(d.data() as OrganisationUsage));

    const orgMap = new Map<string, Organisation>();
    for (const org of orgs) {
      orgMap.set(org.id, org);
    }

    const planMap = new Map(plans.map((p) => [p.id, p]));

    // 1. Subscription & Revenue Metrics
    let totalMrrCents = 0;
    let activePaidCount = 0;
    let trialCount = 0;
    let pastDueCount = 0;
    let canceledCount = 0;

    const revenueByPlan: Record<string, CommercialPlanMetric> = {};

    for (const p of plans) {
      revenueByPlan[p.id] = {
        planId: p.id,
        planName: p.name,
        activeCount: 0,
        trialCount: 0,
        mrr: 0,
        currency: 'ZAR'
      };
    }

    for (const sub of subs) {
      const planId = sub.planId || 'plan_starter';
      const plan = planMap.get(planId);
      const planName = plan?.name || planId;

      if (!revenueByPlan[planId]) {
        revenueByPlan[planId] = {
          planId,
          planName,
          activeCount: 0,
          trialCount: 0,
          mrr: 0,
          currency: sub.currency || 'ZAR'
        };
      }

      if (sub.subscriptionStatus === 'active') {
        activePaidCount++;
        revenueByPlan[planId].activeCount++;

        // Monthly normalized revenue in cents
        let subMrr = sub.priceAmount || 0;
        if (sub.billingInterval === 'annual') {
          subMrr = Math.round(subMrr / 12);
        }
        totalMrrCents += subMrr;
        revenueByPlan[planId].mrr += subMrr;
      } else if (sub.subscriptionStatus === 'trialing') {
        trialCount++;
        revenueByPlan[planId].trialCount++;
      } else if (sub.subscriptionStatus === 'past_due') {
        pastDueCount++;
        let subMrr = sub.priceAmount || 0;
        if (sub.billingInterval === 'annual') {
          subMrr = Math.round(subMrr / 12);
        }
        totalMrrCents += subMrr; // Count in MRR until cancelled
        revenueByPlan[planId].activeCount++;
        revenueByPlan[planId].mrr += subMrr;
      } else if (sub.subscriptionStatus === 'cancelled' || sub.subscriptionStatus === 'expired') {
        canceledCount++;
      }
    }

    const totalTrackedAccounts = activePaidCount + trialCount + canceledCount;
    const trialToPaidConversionRate =
      totalTrackedAccounts > 0
        ? Math.round((activePaidCount / totalTrackedAccounts) * 100)
        : 0;

    const churnDenominator = activePaidCount + canceledCount;
    const churnRate =
      churnDenominator > 0
        ? Math.round((canceledCount / churnDenominator) * 100)
        : 0;

    const averageRevenuePerAccount =
      activePaidCount > 0 ? Math.round(totalMrrCents / activePaidCount) : 0;

    // 2. Usage Aggregates
    let totalLearners = 0;
    let totalStaffUsers = 0;
    let totalStorageMb = 0;
    let totalMonthlyCommunications = 0;
    let totalAutomationRuns = 0;
    const tenantsNearCapacityCount = 0;

    for (const u of usages) {
      totalLearners += u.learnersCount || 0;
      totalStaffUsers += u.staffUsersCount || 0;
      totalStorageMb += u.storageMb || 0;
      totalMonthlyCommunications += u.monthlyCommunicationsCount || 0;
      totalAutomationRuns += u.automationRunsCount || 0;
    }

    const platformUsageAggregate: PlatformUsageAggregate = {
      totalLearners,
      totalStaffUsers,
      totalStorageMb,
      totalMonthlyCommunications,
      totalAutomationRuns,
      tenantsNearCapacityCount
    };

    // 3. Tenants at Risk
    const tenantsAtRisk: TenantAtRisk[] = [];
    const now = Date.now();

    for (const org of orgs) {
      const orgSub = subs.find((s) => s.organisationId === org.id);

      if (org.tenantStatus === 'suspended') {
        tenantsAtRisk.push({
          organisationId: org.id,
          organisationName: org.name,
          riskType: 'suspended',
          severity: 'critical',
          detail: org.suspensionReason || 'Account suspended by platform administration.'
        });
      } else if (orgSub?.subscriptionStatus === 'past_due') {
        tenantsAtRisk.push({
          organisationId: org.id,
          organisationName: org.name,
          riskType: 'past_due',
          severity: 'critical',
          detail: 'Renewal invoice payment failed; past due grace period currently in effect.'
        });
      } else if (
        orgSub?.subscriptionStatus === 'trialing' &&
        orgSub.trialEndsAt
      ) {
        const msLeft = new Date(orgSub.trialEndsAt).getTime() - now;
        const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
        if (daysLeft <= 3 && daysLeft >= 0) {
          tenantsAtRisk.push({
            organisationId: org.id,
            organisationName: org.name,
            riskType: 'trial_expiring_soon',
            severity: 'warning',
            detail: `Trial expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} without a saved payment method.`
          });
        }
      }
    }

    return {
      mrr: totalMrrCents,
      arr: totalMrrCents * 12,
      currency: 'ZAR',
      activePaidSubscriptions: activePaidCount,
      trialSubscriptions: trialCount,
      pastDueSubscriptions: pastDueCount,
      canceledSubscriptions: canceledCount,
      trialToPaidConversionRate,
      churnRate,
      averageRevenuePerAccount,
      revenueByPlan,
      platformUsageAggregate,
      tenantsAtRisk,
      generatedAt: new Date().toISOString()
    };
  }
}

export const commercialAnalyticsService = new CommercialAnalyticsService();
