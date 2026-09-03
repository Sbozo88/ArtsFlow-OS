import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { organisationRepository } from '../../repositories/organisationRepository';
import { organisationSettingsRepository } from '../../repositories/organisationSettingsRepository';
import { organisationOnboardingRepository } from '../../repositories/organisationOnboardingRepository';
import { subscriptionResolverService } from '../billing/subscriptionResolverService';
import { entitlementResolverService } from '../entitlementResolverService';
import { auditService } from '../auditService';
import type { TenantStatus, OnboardingStep } from '../../types';

export interface ReadinessCondition {
  key: string;
  label: string;
  description: string;
  met: boolean;
  required: boolean;
  details?: string;
}

export interface ReadinessReport {
  isReady: boolean;
  percentage: number;
  conditions: ReadinessCondition[];
}

export class OrganisationReadinessService {
  /**
   * Evaluates actual operational records to determine if an organisation is ready for Go-Live.
   */
  async evaluateReadiness(organisationId: string): Promise<ReadinessReport> {
    const conditions: ReadinessCondition[] = [];

    // 1. Organisation Profile Check
    const org = await organisationRepository.getById(organisationId);
    const hasValidProfile = Boolean(org && org.name?.trim().length > 0 && org.organisationType);
    conditions.push({
      key: 'profile_configured',
      label: 'Organisation Profile',
      description: 'Organisation name, type, and contact details are saved.',
      met: hasValidProfile,
      required: true,
      details: hasValidProfile ? org?.name : 'Organisation profile is missing required information.'
    });

    // 2. Active Organisation Admin Check
    let hasAdmin: boolean;
    try {
      const memQ = query(
        collection(db, 'organisationMemberships'),
        where('organisationId', '==', organisationId),
        where('role', '==', 'organisation_admin'),
        where('status', '!=', 'deleted')
      );
      const memSnap = await getDocs(memQ);
      hasAdmin = !memSnap.empty;
    } catch {
      hasAdmin = Boolean(org?.primaryAdminEmail);
    }
    conditions.push({
      key: 'admin_membership',
      label: 'Organisation Administrator',
      description: 'At least one organisation admin membership or invitation exists.',
      met: hasAdmin,
      required: true,
      details: hasAdmin ? 'Administrator assigned' : 'No organisation administrator found.'
    });

    // 3. Operational Subscription / Trial Check
    const sub = await subscriptionResolverService.getCurrentSubscription(organisationId);
    const subOperational = sub ? subscriptionResolverService.isSubscriptionOperational(sub) : true; // legacy fallback is operational
    conditions.push({
      key: 'subscription_operational',
      label: 'Commercial Subscription / Trial',
      description: 'Organisation has an active trial or commercial subscription.',
      met: subOperational,
      required: true,
      details: sub ? `Status: ${sub.subscriptionStatus} (${sub.billingMode})` : 'Legacy Full Access Active'
    });

    // 4. Programmes Created Check
    let programmeCount: number;
    try {
      const progQ = query(
        collection(db, 'programmes'),
        where('organisationId', '==', organisationId),
        where('status', '!=', 'deleted')
      );
      const progSnap = await getDocs(progQ);
      programmeCount = progSnap.size;
    } catch {
      programmeCount = 0;
    }
    const hasProgramme = programmeCount > 0;
    conditions.push({
      key: 'programmes_created',
      label: 'Teaching Programmes',
      description: 'At least one active arts teaching programme is created.',
      met: hasProgramme,
      required: true,
      details: hasProgramme ? `${programmeCount} programme(s) created` : 'No programmes created yet.'
    });

    // 5. Groups Created Check
    let groupCount: number;
    try {
      const [progGroupsSnap, groupsSnap] = await Promise.all([
        getDocs(query(collection(db, 'programmeGroups'), where('organisationId', '==', organisationId), where('status', '!=', 'deleted'))).catch(() => null),
        getDocs(query(collection(db, 'groups'), where('organisationId', '==', organisationId), where('status', '!=', 'deleted'))).catch(() => null)
      ]);
      groupCount = (progGroupsSnap?.size || 0) + (groupsSnap?.size || 0);
    } catch {
      groupCount = 0;
    }
    const hasGroup = groupCount > 0;
    conditions.push({
      key: 'groups_created',
      label: 'Classes & Groups',
      description: 'At least one class, ensemble, or teaching group is configured.',
      met: hasGroup,
      required: true,
      details: hasGroup ? `${groupCount} group(s) configured` : 'No groups configured yet.'
    });

    // 6. Core Organisation Settings
    const settings = await organisationSettingsRepository.getByOrgId(organisationId);
    const hasSettings = Boolean(settings && settings.status === 'active');
    conditions.push({
      key: 'core_settings',
      label: 'Organisation Settings',
      description: 'System, attendance, and branding defaults are initialized.',
      met: hasSettings,
      required: true,
      details: hasSettings ? 'Settings initialized' : 'Organisation settings missing.'
    });

    // 7. Finance Configuration (Conditional on entitlement)
    const hasFinanceEntitlement = await entitlementResolverService.isFeatureEnabled(organisationId, 'finance.core');
    if (hasFinanceEntitlement) {
      const financeConfigured = Boolean(settings?.finance?.defaultCurrency && settings?.finance?.invoicePrefix);
      conditions.push({
        key: 'finance_configured',
        label: 'Finance Defaults',
        description: 'Currency and invoice numbering prefixes are configured.',
        met: financeConfigured,
        required: false,
        details: financeConfigured ? `Currency: ${settings?.finance?.defaultCurrency}` : 'Not fully configured'
      });
    }

    const requiredConditions = conditions.filter((c) => c.required);
    const metRequired = requiredConditions.filter((c) => c.met).length;
    const isReady = metRequired === requiredConditions.length;
    const percentage = Math.round((conditions.filter((c) => c.met).length / conditions.length) * 100);

    return {
      isReady,
      percentage,
      conditions
    };
  }

  /**
   * Completes onboarding and transitions tenant to operational status.
   */
  async completeOrganisationOnboarding(
    actorId: string,
    organisationId: string
  ): Promise<{ success: boolean; tenantStatus: TenantStatus }> {
    const readiness = await this.evaluateReadiness(organisationId);
    if (!readiness.isReady) {
      const missing = readiness.conditions
        .filter((c) => c.required && !c.met)
        .map((c) => c.label)
        .join(', ');
      throw new Error(`Cannot complete onboarding. The following required items are missing: ${missing}`);
    }

    // Determine target operational status
    const sub = await subscriptionResolverService.getCurrentSubscription(organisationId);
    const targetStatus: TenantStatus = sub?.subscriptionStatus === 'trialing' ? 'trial' : 'active';

    // Transition tenant status
    await organisationRepository.update(organisationId, actorId, {
      tenantStatus: targetStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: actorId
    });

    // Update onboarding document
    const onboarding = await organisationOnboardingRepository.getByOrganisationId(organisationId);
    const now = new Date().toISOString();

    if (onboarding) {
      const completedSteps = Array.from(new Set([...onboarding.completedSteps, 'review', 'go_live'])) as OnboardingStep[];
      await organisationOnboardingRepository.update(onboarding.id, {
        onboardingStatus: 'completed',
        currentStep: 'go_live',
        completedSteps,
        completedAt: now,
        lastProgressAt: now,
        updatedAt: now,
        updatedBy: actorId
      });
    }

    // Audit action
    await auditService.log({
      organisationId,
      actorId,
      action: 'ORGANISATION_COMPLETE_ONBOARDING',
      entityType: 'organisation',
      entityId: organisationId,
      after: {
        targetStatus,
        completedAt: now,
        readinessPercentage: readiness.percentage
      }
    });

    return {
      success: true,
      tenantStatus: targetStatus
    };
  }
}

export const organisationReadinessService = new OrganisationReadinessService();
