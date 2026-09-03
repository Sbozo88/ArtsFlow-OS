import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { organisationRepository } from '../../repositories/organisationRepository';
import { subscriptionResolverService } from '../billing/subscriptionResolverService';
import { subscriptionRepository } from '../../repositories/subscriptionRepository';
import { usageMeteringService } from '../usageMeteringService';
import { organisationReadinessService } from '../onboarding/organisationReadinessService';
import { customerFeedbackRepository } from '../../repositories/customerFeedbackRepository';
import { foundingPartnerService, FoundingPartnerService } from './foundingPartnerService';
import type {
  Organisation,
  Subscription,
  ActivationScoreResult,
  UnifiedCustomerLifecycleState,
  NeedsAttentionItem,
  ConversionReadinessSummary,
  PilotKpis,
  CustomerFeedbackRecord
} from '../../types';

export class CustomerActivationService {
  /**
   * Deterministically calculates an operational activation score (0 - 100) for an organisation.
   */
  async calculateActivationScore(organisationId: string): Promise<ActivationScoreResult> {
    const [usage, readiness] = await Promise.all([
      usageMeteringService.getUsageMeters(organisationId).catch(() => null),
      organisationReadinessService.evaluateReadiness(organisationId).catch(() => null)
    ]);

    // Check sessions & attendance
    let sessionsCount = 0;
    let attendanceCount = 0;
    let specialistCount = 0;
    let guardianCount = 0;

    try {
      const [sessSnap, attSnap, musicSnap, danceSnap, guardSnap] = await Promise.all([
        getDocs(query(collection(db, 'sessions'), where('organisationId', '==', organisationId))),
        getDocs(query(collection(db, 'attendance'), where('organisationId', '==', organisationId))),
        getDocs(query(collection(db, 'instruments'), where('organisationId', '==', organisationId))),
        getDocs(query(collection(db, 'danceLevels'), where('organisationId', '==', organisationId))),
        getDocs(query(collection(db, 'guardians'), where('organisationId', '==', organisationId)))
      ]);

      sessionsCount = sessSnap.size;
      attendanceCount = attSnap.size;
      specialistCount = musicSnap.size + danceSnap.size;
      guardianCount = guardSnap.size;
    } catch {
      // Graceful fallback in mocked environments
    }

    const learnersCount = usage?.meters['limits.learners']?.current || 0;
    const staffCount = usage?.meters['limits.staff_users']?.current || 0;

    // Breakdown scoring (Total = 100)
    const orgSetup = readiness && readiness.percentage >= 60 ? 15 : readiness ? Math.round((readiness.percentage / 100) * 15) : 0;
    const adminActivated = readiness?.conditions.find((c) => c.key === 'admin_membership')?.met ? 10 : 0;
    const learnersAdded = learnersCount > 0 ? 15 : 0;
    const staffAdded = staffCount > 0 ? 10 : 0;
    const programmeCreated = readiness?.conditions.find((c) => c.key === 'programmes_created')?.met ? 10 : 0;
    const groupCreated = readiness?.conditions.find((c) => c.key === 'classes_groups_created')?.met ? 10 : 0;
    const sessionCreated = sessionsCount > 0 ? 10 : 0;
    const attendanceRecorded = attendanceCount > 0 ? 10 : 0;
    const specialistModuleUsed = specialistCount > 0 ? 5 : 0;
    const guardianActivity = guardianCount > 0 ? 5 : 0;

    const totalScore =
      orgSetup +
      adminActivated +
      learnersAdded +
      staffAdded +
      programmeCreated +
      groupCreated +
      sessionCreated +
      attendanceRecorded +
      specialistModuleUsed +
      guardianActivity;

    let level: 'low' | 'developing' | 'strong' | 'fully_activated';
    let label: string;

    if (totalScore >= 90) {
      level = 'fully_activated';
      label = 'Fully Activated';
    } else if (totalScore >= 70) {
      level = 'strong';
      label = 'Strong';
    } else if (totalScore >= 40) {
      level = 'developing';
      label = 'Developing';
    } else {
      level = 'low';
      label = 'Low Activation';
    }

    return {
      totalScore,
      level,
      label,
      breakdown: {
        orgSetup,
        adminActivated,
        learnersAdded,
        staffAdded,
        programmeCreated,
        groupCreated,
        sessionCreated,
        attendanceRecorded,
        specialistModuleUsed,
        guardianActivity
      }
    };
  }

  /**
   * Resolves a single unified derived lifecycle state for a customer.
   */
  resolveLifecycleState(
    org: Organisation,
    sub: Subscription | null,
    onboardingPercentage: number = 100
  ): UnifiedCustomerLifecycleState {
    if (org.tenantStatus === 'archived' || org.tenantStatus === 'cancelled') {
      return 'INACTIVE';
    }

    if (
      org.tenantStatus === 'suspended' ||
      org.tenantStatus === 'restricted' ||
      sub?.subscriptionStatus === 'past_due'
    ) {
      return 'AT_RISK';
    }

    if (org.tenantStatus === 'provisioning') {
      return 'PROVISIONING';
    }

    if (onboardingPercentage < 100 && (org.tenantStatus === 'trial' || org.tenantStatus === 'active')) {
      return 'ONBOARDING';
    }

    if (sub?.subscriptionStatus === 'trialing') {
      if (sub.trialEndsAt) {
        const daysLeft = Math.ceil(
          (new Date(sub.trialEndsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
        );
        if (daysLeft <= 3) {
          return 'CONVERSION_DUE';
        }
      }
      return 'ACTIVE_TRIAL';
    }

    if (sub?.subscriptionStatus === 'active') {
      return 'CUSTOMER';
    }

    if (org.tenantStatus === 'trial') {
      return 'TRIAL';
    }

    return 'PROSPECT';
  }

  /**
   * Evaluates operational conditions across all organisations to flag those needing intervention.
   */
  async getNeedsAttentionList(): Promise<NeedsAttentionItem[]> {
    const [allOrgs, _allFeedback] = await Promise.all([
      organisationRepository.getAll(),
      customerFeedbackRepository.getAll().catch(() => [])
    ]);

    const items: NeedsAttentionItem[] = [];
    const now = Date.now();

    for (const org of allOrgs) {
      if (org.tenantStatus === 'archived' || org.tenantStatus === 'cancelled') continue;

      const sub = await subscriptionResolverService.getCurrentSubscription(org.id);
      const daysSinceCreated = Math.floor(
        (now - new Date(org.createdAt).getTime()) / (24 * 60 * 60 * 1000)
      );

      // Rule 1: Tenant restricted unexpectedly
      if (org.tenantStatus === 'restricted' || org.tenantStatus === 'suspended') {
        items.push({
          organisationId: org.id,
          organisationName: org.name,
          category: 'restricted',
          severity: 'critical',
          reason: org.restrictionReason || org.suspensionReason || 'Account is restricted or suspended.',
          suggestedAction: 'Review platform diagnostics and consider granting temporary trial extension or past-due grace.'
        });
        continue;
      }

      // Rule 2: Provisioning failed or stuck
      if (org.tenantStatus === 'provisioning' && daysSinceCreated >= 1) {
        items.push({
          organisationId: org.id,
          organisationName: org.name,
          category: 'provisioning_failed',
          severity: 'critical',
          reason: 'Organisation provisioning has been stuck for more than 24 hours.',
          suggestedAction: 'Inspect provisioning job queue and trigger job retry.'
        });
        continue;
      }

      // Rules for Trialing Organisations
      if (sub?.subscriptionStatus === 'trialing' && sub.trialEndsAt) {
        const msLeft = new Date(sub.trialEndsAt).getTime() - now;
        const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));

        // Rule 3: Trial expiring within 3 days without selected plan
        if (daysLeft <= 3 && daysLeft >= 0) {
          items.push({
            organisationId: org.id,
            organisationName: org.name,
            category: 'trial_expiring',
            severity: 'warning',
            daysRemaining: daysLeft,
            reason: `Trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Conversion action needed.`,
            suggestedAction: 'Review activation score and present recommended Founding Partner commercial plan.'
          });
        }
      }

      // Check for low operational activity on trials
      if (sub?.subscriptionStatus === 'trialing') {
        const usage = await usageMeteringService.getUsageMeters(org.id).catch(() => null);
        const learners = usage?.meters['limits.learners']?.current || 0;

        // Rule 4: Trial active + zero learners after 3 days
        if (daysSinceCreated >= 3 && learners === 0) {
          items.push({
            organisationId: org.id,
            organisationName: org.name,
            category: 'zero_learners',
            severity: 'warning',
            daysSinceProvisioned: daysSinceCreated,
            reason: `Organisation provisioned ${daysSinceCreated} days ago but has registered zero learners.`,
            suggestedAction: 'Reach out to primary admin to assist with initial CSV or learner enrolment.'
          });
        }
      }
    }

    return items;
  }

  /**
   * Generates a conversion readiness summary and deterministic suggested plan.
   */
  async getConversionReadiness(organisationId: string): Promise<ConversionReadinessSummary> {
    const [org, sub, activation, readiness, usage] = await Promise.all([
      organisationRepository.getById(organisationId),
      subscriptionResolverService.getCurrentSubscription(organisationId),
      this.calculateActivationScore(organisationId),
      organisationReadinessService.evaluateReadiness(organisationId).catch(() => null),
      usageMeteringService.getUsageMeters(organisationId).catch(() => null)
    ]);

    if (!org) {
      throw new Error(`Organisation '${organisationId}' not found.`);
    }

    const now = Date.now();
    let trialDay = 1;
    let trialDaysRemaining = 14;

    if (sub?.trialStartedAt && sub?.trialEndsAt) {
      const startMs = new Date(sub.trialStartedAt).getTime();
      const endMs = new Date(sub.trialEndsAt).getTime();
      trialDay = Math.max(1, Math.floor((now - startMs) / (24 * 60 * 60 * 1000)) + 1);
      trialDaysRemaining = Math.max(0, Math.ceil((endMs - now) / (24 * 60 * 60 * 1000)));
    }

    // Check for active use of Professional features
    const professionalFeaturesUsed: string[] = [];
    try {
      const [eventsSnap, consentSnap, autoSnap] = await Promise.all([
        getDocs(query(collection(db, 'events'), where('organisationId', '==', organisationId))),
        getDocs(query(collection(db, 'consentRequests'), where('organisationId', '==', organisationId))),
        getDocs(query(collection(db, 'automationRules'), where('organisationId', '==', organisationId)))
      ]);

      if (eventsSnap.size > 0) professionalFeaturesUsed.push('Event Management');
      if (consentSnap.size > 0) professionalFeaturesUsed.push('Digital Consent');
      if (autoSnap.size > 0) professionalFeaturesUsed.push('Workflow Automation');
    } catch {
      // Safe fallback
    }

    const learnersCount = usage?.meters['limits.learners']?.current || 0;
    const staffCount = usage?.meters['limits.staff_users']?.current || 0;

    // Deterministic Suggested Plan Rule
    let suggestedPlanId: 'plan_starter' | 'plan_professional';
    let suggestedPlanName: string;
    let rationale: string;

    if (professionalFeaturesUsed.length > 0) {
      suggestedPlanId = 'plan_professional';
      suggestedPlanName = 'ArtsFlow Professional';
      rationale = `Actively utilizes operational features: ${professionalFeaturesUsed.join(', ')}.`;
    } else if (learnersCount > 100 || staffCount > 10) {
      suggestedPlanId = 'plan_professional';
      suggestedPlanName = 'ArtsFlow Professional';
      rationale = `Enrolment of ${learnersCount} learners exceeds Starter 100-learner limit.`;
    } else {
      suggestedPlanId = 'plan_starter';
      suggestedPlanName = 'ArtsFlow Starter';
      rationale = `Current programme operations (${learnersCount} learners) comfortably fit the Starter tier.`;
    }

    const isFounding = Boolean(org.isFoundingPartner);
    const standardMonthlyPrice =
      suggestedPlanId === 'plan_starter'
        ? FoundingPartnerService.STANDARD_PRICE_STARTER / 100
        : FoundingPartnerService.STANDARD_PRICE_PROFESSIONAL / 100;

    const foundingMonthlyPrice = isFounding
      ? (suggestedPlanId === 'plan_starter' ? 399 : 799)
      : undefined;

    return {
      organisationId,
      trialDay,
      trialDaysRemaining,
      activationScore: activation.totalScore,
      activationLevel: activation.level,
      onboardingPercentage: readiness?.percentage || 0,
      isOnboardingComplete: Boolean(readiness?.isReady),
      professionalFeaturesUsed,
      suggestedPlanId,
      suggestedPlanName,
      rationale,
      isFoundingPartner: isFounding,
      standardMonthlyPrice,
      foundingMonthlyPrice
    };
  }

  /**
   * Generates global Pilot KPIs and Funnel metrics for Super Admin.
   */
  async getPilotKpis(): Promise<PilotKpis> {
    const [orgs, subs, feedback, foundingStats] = await Promise.all([
      organisationRepository.getAll(),
      subscriptionRepository.getAll().catch(() => []),
      customerFeedbackRepository.getAll().catch(() => []),
      foundingPartnerService.getFoundingPartnerStats()
    ]);

    let trialsActive = 0;
    let trialsExpiringSoon = 0;
    let customersConverted = 0;
    let starterCustomers = 0;
    let professionalCustomers = 0;

    const now = Date.now();

    for (const sub of subs) {
      if (sub.subscriptionStatus === 'trialing') {
        trialsActive++;
        if (sub.trialEndsAt) {
          const daysLeft = Math.ceil(
            (new Date(sub.trialEndsAt).getTime() - now) / (24 * 60 * 60 * 1000)
          );
          if (daysLeft <= 3 && daysLeft >= 0) {
            trialsExpiringSoon++;
          }
        }
      } else if (sub.subscriptionStatus === 'active') {
        customersConverted++;
        if (sub.planId === 'plan_starter') starterCustomers++;
        else if (sub.planId === 'plan_professional') professionalCustomers++;
      }
    }

    // Average feedback rating
    const rated = feedback.filter((f: CustomerFeedbackRecord) => f.rating > 0);
    const averageFeedbackRating =
      rated.length > 0
        ? Number(
            (
              rated.reduce((sum: number, f: CustomerFeedbackRecord) => sum + f.rating, 0) /
              rated.length
            ).toFixed(1)
          )
        : 5.0;

    // Sample activation scores for pilot organisations
    const sampleScores: number[] = [];
    for (const org of orgs.slice(0, 10)) {
      try {
        const score = await this.calculateActivationScore(org.id);
        sampleScores.push(score.totalScore);
      } catch {
        // Safe skip
      }
    }

    const averageActivationScore =
      sampleScores.length > 0
        ? Math.round(sampleScores.reduce((sum, s) => sum + s, 0) / sampleScores.length)
        : 75;

    const attentionItems = await this.getNeedsAttentionList().catch(() => []);

    // Funnel counts
    const provisionedCount = orgs.length;
    const adminActivatedCount = orgs.filter((o: Organisation) => o.primaryAdminEmail).length;
    const onboardingCompletedCount = orgs.filter(
      (o: Organisation) => o.tenantStatus === 'active' || o.tenantStatus === 'trial'
    ).length;
    const activeTrialCount = trialsActive;
    const convertedCount = customersConverted;

    return {
      foundingSlotsAllocated: foundingStats.allocatedSlots,
      maxFoundingSlots: foundingStats.maxSlots,
      trialsActive,
      trialsExpiringSoon,
      customersConverted,
      starterCustomers,
      professionalCustomers,
      averageActivationScore,
      averageFeedbackRating,
      organisationsNeedingAttentionCount: attentionItems.length,
      funnel: {
        provisionedCount,
        adminActivatedCount,
        onboardingCompletedCount,
        activeTrialCount,
        convertedCount
      }
    };
  }
}

export const customerActivationService = new CustomerActivationService();
