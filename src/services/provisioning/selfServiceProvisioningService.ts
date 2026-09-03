import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { DEFAULT_SETTINGS } from '../organisationSettingsService';
import { organisationOnboardingService } from '../onboarding/organisationOnboardingService';
import { auditService } from '../auditService';
import type {
  Organisation,
  OrganisationMembership,
  Subscription,
  OrganisationSettings
} from '../../types';

export interface SelfServiceProvisionInput {
  organisationName: string;
  organisationType: string;
  primaryAdminName?: string;
  contactPhone?: string;
  country?: string;
  currency?: string;
  timezone?: string;
}

export type SelfServiceProvisionStage =
  | 'validating'
  | 'creating_organisation'
  | 'starting_trial'
  | 'preparing_settings'
  | 'creating_admin_access'
  | 'preparing_onboarding'
  | 'completed';

export interface SelfServiceProvisionResult {
  organisation: Organisation;
  membership: OrganisationMembership;
  subscription: Subscription;
  isExisting: boolean;
}

export class SelfServiceProvisioningService {
  /**
   * Generates a safe URL slug from the organisation name.
   */
  generateSlug(name: string): string {
    return (
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'arts-academy'
    );
  }

  /**
   * Securely provisions a new tenant organisation and 14-day Professional trial
   * directly for the newly authenticated self-service customer.
   */
  async selfServiceProvisionOrganisation(
    actor: { uid: string; email: string; displayName?: string },
    input: SelfServiceProvisionInput,
    onProgress?: (stage: SelfServiceProvisionStage, message: string) => void
  ): Promise<SelfServiceProvisionResult> {
    if (!actor?.uid) {
      throw new Error('Authentication required for organisation setup.');
    }
    if (!input.organisationName?.trim()) {
      throw new Error('Please provide an organisation name.');
    }

    const orgId = `org_${actor.uid}`;
    const cleanName = input.organisationName.trim();
    const cleanEmail = actor.email.trim().toLowerCase();
    const now = new Date().toISOString();
    const slug = this.generateSlug(cleanName);

    onProgress?.('validating', 'Validating your workspace details…');

    // 1. Idempotency Check: if organisation already exists for this user, restore and return
    const existingOrgDoc = await getDoc(doc(db, 'organisations', orgId));
    if (existingOrgDoc.exists()) {
      const orgData = existingOrgDoc.data() as Organisation;
      const memDoc = await getDoc(doc(db, 'organisationMemberships', `mem_${actor.uid}_${orgId}`));
      const subDoc = await getDoc(doc(db, 'subscriptions', `sub_trial_${orgId}`));

      onProgress?.('completed', 'Workspace already prepared.');
      return {
        organisation: orgData,
        membership: (memDoc.exists() ? memDoc.data() : null) as unknown as OrganisationMembership,
        subscription: (subDoc.exists() ? subDoc.data() : null) as unknown as Subscription,
        isExisting: true
      };
    }

    // 2. Stage: Creating organisation
    onProgress?.('creating_organisation', 'Creating your arts organisation…');
    const newOrg: Organisation = {
      id: orgId,
      organisationId: orgId,
      name: cleanName,
      slug,
      organisationType: input.organisationType || 'school',
      email: cleanEmail,
      phone: input.contactPhone?.trim(),
      address: input.country || 'South Africa',
      tenantStatus: 'trial',
      assignedPlanId: 'plan_professional',
      billingMode: 'manual',
      onboardingStatus: 'in_progress',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: actor.uid,
      updatedBy: actor.uid
    };
    await setDoc(doc(db, 'organisations', orgId), newOrg);

    // 3. Stage: Creating global user record
    onProgress?.('creating_admin_access', 'Establishing your administrator profile…');
    const userProfile = {
      email: cleanEmail,
      displayName: actor.displayName || input.primaryAdminName?.trim() || 'Academy Admin',
      organisationId: orgId,
      role: 'organisation_admin',
      status: 'active'
    };
    await setDoc(doc(db, 'users', actor.uid), userProfile);

    // 4. Stage: Initial Membership
    const memId = `mem_${actor.uid}_${orgId}`;
    const newMembership: OrganisationMembership = {
      id: memId,
      organisationId: orgId,
      userId: actor.uid,
      email: cleanEmail,
      displayName: actor.displayName || input.primaryAdminName?.trim() || 'Academy Admin',
      role: 'organisation_admin',
      membershipStatus: 'active',
      isDefaultOrganisation: true,
      joinedAt: now,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: actor.uid,
      updatedBy: actor.uid
    };
    await setDoc(doc(db, 'organisationMemberships', memId), newMembership);

    // 5. Stage: Starting 14-Day Professional Trial
    onProgress?.('starting_trial', 'Starting your 14-day Professional trial…');
    const trialDays = 14;
    const trialEndDate = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString();
    const subId = `sub_trial_${orgId}`;
    const newSubscription: Subscription = {
      id: subId,
      organisationId: orgId,
      planId: 'plan_professional',
      subscriptionStatus: 'trialing',
      billingMode: 'manual',
      billingInterval: 'monthly',
      currency: input.currency || 'ZAR',
      priceAmount: 0,
      cancelAtPeriodEnd: false,
      trialStartedAt: now,
      trialEndsAt: trialEndDate,
      currentPeriodStart: now,
      currentPeriodEnd: trialEndDate,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: actor.uid,
      updatedBy: actor.uid
    };
    await setDoc(doc(db, 'subscriptions', subId), newSubscription);

    // 6. Stage: Default Settings
    onProgress?.('preparing_settings', 'Configuring intelligent school defaults…');
    const baseSettings: OrganisationSettings = DEFAULT_SETTINGS(orgId, cleanName);
    if (input.country) baseSettings.profile.country = input.country;
    if (input.timezone) baseSettings.profile.timezone = input.timezone;
    if (input.currency) {
      baseSettings.profile.defaultCurrency = input.currency;
      baseSettings.finance.defaultCurrency = input.currency;
    }
    await setDoc(doc(db, 'organisationSettings', orgId), baseSettings);

    // 7. Stage: Initialize Onboarding
    onProgress?.('preparing_onboarding', 'Preparing your setup wizard…');
    await organisationOnboardingService.startOnboarding(actor.uid, orgId);

    // 8. Audit Log
    await auditService.log({
      organisationId: orgId,
      actorId: actor.uid,
      action: 'SELF_SERVICE_ORGANISATION_PROVISIONED',
      entityType: 'organisation',
      entityId: orgId,
      after: {
        name: cleanName,
        planId: 'plan_professional',
        trialDays
      }
    });

    onProgress?.('completed', 'Workspace ready! Launching setup wizard…');

    return {
      organisation: newOrg,
      membership: newMembership,
      subscription: newSubscription,
      isExisting: false
    };
  }
}

export const selfServiceProvisioningService = new SelfServiceProvisioningService();
