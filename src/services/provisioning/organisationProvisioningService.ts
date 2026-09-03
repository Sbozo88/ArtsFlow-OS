import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { organisationRepository } from '../../repositories/organisationRepository';
import { organisationSettingsRepository } from '../../repositories/organisationSettingsRepository';
import { organisationCalendarPeriodRepository } from '../../repositories/organisationCalendarPeriodRepository';
import { organisationInvitationRepository } from '../../repositories/organisationInvitationRepository';
import { organisationMembershipRepository } from '../../repositories/organisationMembershipRepository';
import { provisioningJobRepository } from '../../repositories/provisioningJobRepository';
import { saasSubscriptionService } from '../billing/saasSubscriptionService';
import { organisationOnboardingService } from '../onboarding/organisationOnboardingService';
import { onboardingTemplateService } from '../onboarding/onboardingTemplateService';
import { DEFAULT_SETTINGS } from '../organisationSettingsService';
import { auditService } from '../auditService';
import type {
  ProvisionOrganisationInput,
  ProvisioningJob,
  Organisation,
  OrganisationInvitation,
  OrganisationMembership,
  OrganisationCalendarPeriod,
  Subscription
} from '../../types';

export interface ProvisioningResult {
  jobId: string;
  organisation: Organisation;
  subscription?: Subscription;
  invitation?: OrganisationInvitation;
  membership?: OrganisationMembership;
  isExisting: boolean;
}

export class OrganisationProvisioningService {
  /**
   * Generates a safe URL slug from the organisation name.
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'school';
  }

  /**
   * Checks for duplicate or similar existing customers before provisioning.
   */
  async checkDuplicates(name: string, email?: string): Promise<{ isDuplicateName: boolean; isDuplicateEmail: boolean }> {
    const normalisedName = name.trim().toLowerCase();
    const normalisedEmail = email?.trim().toLowerCase();

    try {
      const orgsSnap = await getDocs(collection(db, 'organisations'));
      let isDuplicateName = false;
      let isDuplicateEmail = false;

      orgsSnap.forEach((d) => {
        const data = d.data() as Organisation;
        if (data.name?.trim().toLowerCase() === normalisedName) {
          isDuplicateName = true;
        }
        if (normalisedEmail && data.primaryAdminEmail?.trim().toLowerCase() === normalisedEmail) {
          isDuplicateEmail = true;
        }
      });

      return { isDuplicateName, isDuplicateEmail };
    } catch {
      return { isDuplicateName: false, isDuplicateEmail: false };
    }
  }

  /**
   * Server-orchestrated provisioning of a new tenant customer.
   */
  async provisionOrganisation(
    actorId: string,
    input: ProvisionOrganisationInput
  ): Promise<ProvisioningResult> {
    if (!input.organisationName?.trim()) {
      throw new Error('Organisation name is required.');
    }
    if (!input.primaryAdminEmail?.trim()) {
      throw new Error('Primary admin email is required.');
    }

    const now = new Date().toISOString();
    const requestId = input.provisioningRequestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Idempotency Check
    const existingJob = await provisioningJobRepository.getByRequestId(requestId);
    if (existingJob && existingJob.jobStatus === 'completed' && existingJob.createdOrganisationId) {
      const existingOrg = await organisationRepository.getById(existingJob.createdOrganisationId);
      if (existingOrg) {
        return {
          jobId: existingJob.id,
          organisation: existingOrg,
          isExisting: true
        };
      }
    }

    const jobId = existingJob?.id || `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const stagesCompleted: string[] = existingJob?.stagesCompleted || [];

    const job: ProvisioningJob = {
      id: jobId,
      organisationId: existingJob?.organisationId || 'platform',
      requestId,
      organisationName: input.organisationName.trim(),
      jobStatus: 'running',
      input,
      stagesCompleted,
      createdAt: existingJob?.createdAt || now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
      status: 'active'
    };
    await provisioningJobRepository.save(job);

    await auditService.log({
      organisationId: 'platform',
      actorId,
      action: 'PLATFORM_START_ORGANISATION_PROVISIONING',
      entityType: 'provisioningJob',
      entityId: jobId,
      after: { requestId, organisationName: input.organisationName }
    });

    let orgId = existingJob?.createdOrganisationId;
    let createdOrg: Organisation | null;
    let createdSub: Subscription | undefined;
    let createdInvite: OrganisationInvitation | undefined;
    let createdMem: OrganisationMembership | undefined;

    try {
      // -------------------------------------------------------------
      // Stage 1: Create Organisation Record (tenantStatus: 'provisioning')
      // -------------------------------------------------------------
      if (!stagesCompleted.includes('organisation_created') || !orgId) {
        orgId = orgId || `org_${Math.random().toString(36).substring(2, 8)}_${Date.now().toString(36)}`;
        const slug = this.generateSlug(input.organisationName);

        createdOrg = {
          id: orgId,
          organisationId: orgId,
          name: input.organisationName.trim(),
          slug,
          organisationType: input.organisationType,
          tenantStatus: 'provisioning',
          assignedPlanId: input.planId,
          email: input.primaryAdminEmail.trim().toLowerCase(),
          primaryAdminEmail: input.primaryAdminEmail.trim().toLowerCase(),
          primaryAdminName: input.primaryAdminName?.trim(),
          phone: input.contactPhone?.trim(),
          address: input.address?.trim(),
          status: 'active',
          createdAt: now,
          updatedAt: now,
          createdBy: actorId,
          updatedBy: actorId
        };

        const orgRef = doc(db, 'organisations', orgId);
        await setDoc(orgRef, createdOrg);

        stagesCompleted.push('organisation_created');
        await provisioningJobRepository.update(jobId, {
          organisationId: orgId,
          createdOrganisationId: orgId,
          stagesCompleted
        });
      } else {
        createdOrg = await organisationRepository.getById(orgId);
      }

      if (!createdOrg || !orgId) {
        throw new Error('Failed to resolve organisation record during provisioning.');
      }

      // -------------------------------------------------------------
      // Stage 2: Attach Subscription or Trial
      // -------------------------------------------------------------
      if (!stagesCompleted.includes('subscription_created')) {
        const mode = input.provisioningMode || 'trial';

        if (mode === 'trial') {
          createdSub = await saasSubscriptionService.createTrial(actorId, orgId, {
            planId: input.planId,
            trialDays: input.trialDays || 14,
            notes: 'Automated trial from provisioning wizard'
          });
        } else if (mode === 'manual_active') {
          createdSub = await saasSubscriptionService.createManualSubscription(actorId, orgId, {
            planId: input.planId,
            billingInterval: 'monthly',
            priceAmount: 49900,
            currency: input.currency || 'ZAR',
            reason: 'Manual enterprise/school active contract'
          });
          // Immediately activate subscription
          await saasSubscriptionService.activateSubscription(actorId, createdSub.id);
        } else if (mode === 'complimentary') {
          createdSub = await saasSubscriptionService.createComplimentarySubscription(actorId, orgId, {
            planId: input.planId,
            reason: input.complimentaryReason || 'Pilot partnership grant'
          });
        }

        stagesCompleted.push('subscription_created');
        await provisioningJobRepository.update(jobId, {
          createdSubscriptionId: createdSub?.id,
          stagesCompleted
        });
      }

      // -------------------------------------------------------------
      // Stage 3: Initial Admin Invitation / Membership
      // -------------------------------------------------------------
      if (!stagesCompleted.includes('admin_invited')) {
        const cleanEmail = input.primaryAdminEmail.trim().toLowerCase();

        // Check if user already has an account in users collection
        let existingUserId: string | null = null;
        try {
          const usersSnap = await getDocs(collection(db, 'users'));
          usersSnap.forEach((uDoc) => {
            const uData = uDoc.data() as { email?: string; id?: string };
            if (uData.email?.toLowerCase().trim() === cleanEmail) {
              existingUserId = uDoc.id;
            }
          });
        } catch {
          // If query fails, treat as new invited user
        }

        if (existingUserId) {
          // Add membership for existing user
          const memId = `mem_${existingUserId}_${orgId}`;
          createdMem = {
            id: memId,
            organisationId: orgId,
            userId: existingUserId,
            email: cleanEmail,
            displayName: input.primaryAdminName?.trim() || undefined,
            role: 'organisation_admin',
            membershipStatus: 'invited',
            isDefaultOrganisation: true,
            joinedAt: now,
            status: 'active',
            createdAt: now,
            updatedAt: now,
            createdBy: actorId,
            updatedBy: actorId
          };
          await organisationMembershipRepository.save(createdMem);
        } else {
          // Create secure one-time invitation
          const token = `inv_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`;
          const inviteId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

          createdInvite = {
            id: inviteId,
            organisationId: orgId,
            email: cleanEmail,
            role: 'organisation_admin',
            invitationStatus: 'pending',
            invitedBy: actorId,
            invitedAt: now,
            expiresAt,
            token,
            status: 'active',
            createdAt: now,
            updatedAt: now,
            createdBy: actorId,
            updatedBy: actorId
          };
          await organisationInvitationRepository.save(createdInvite);
        }

        stagesCompleted.push('admin_invited');
        await provisioningJobRepository.update(jobId, {
          createdInvitationId: createdInvite?.id || createdMem?.id,
          stagesCompleted
        });
      }

      // -------------------------------------------------------------
      // Stage 4: Bootstrap Default Organisation Settings
      // -------------------------------------------------------------
      if (!stagesCompleted.includes('settings_bootstrapped')) {
        const baseSettings = DEFAULT_SETTINGS(orgId, input.organisationName.trim());

        // Apply country/currency/timezone
        if (input.country) baseSettings.profile.country = input.country;
        if (input.timezone) baseSettings.profile.timezone = input.timezone;
        if (input.locale) baseSettings.profile.locale = input.locale;
        if (input.currency) {
          baseSettings.profile.defaultCurrency = input.currency;
          baseSettings.finance.defaultCurrency = input.currency;
        }

        // Apply template overrides if selected
        if (input.organisationTemplate) {
          const tmpl = onboardingTemplateService.getTemplateByCode(input.organisationTemplate);
          if (tmpl) {
            baseSettings.programmes.allowedProgrammeTypes = tmpl.programmeTypes;
            baseSettings.programmes.defaultGroupCapacity = tmpl.defaultGroupCapacity;
            baseSettings.attendance.lowAttendanceThresholdPercent = tmpl.defaultAttendanceThreshold;
            baseSettings.attendance.consecutiveAbsenceThreshold = tmpl.consecutiveAbsenceThreshold;
          }
        }

        await organisationSettingsRepository.save(baseSettings);

        stagesCompleted.push('settings_bootstrapped');
        await provisioningJobRepository.update(jobId, { stagesCompleted });
      }

      // -------------------------------------------------------------
      // Stage 5: Default Calendar Period (e.g. Term 1 of current year)
      // -------------------------------------------------------------
      if (!stagesCompleted.includes('calendar_created')) {
        const currentYear = new Date().getFullYear();
        const defaultPeriod: OrganisationCalendarPeriod = {
          id: `period_${orgId}_term1_${currentYear}`,
          organisationId: orgId,
          name: 'Term 1',
          periodType: 'term',
          startDate: `${currentYear}-01-15`,
          endDate: `${currentYear}-04-05`,
          calendarYear: currentYear,
          periodStatus: 'active',
          notes: 'Standard opening academic period',
          status: 'active',
          createdAt: now,
          updatedAt: now,
          createdBy: actorId,
          updatedBy: actorId
        };
        await organisationCalendarPeriodRepository.save(defaultPeriod);

        stagesCompleted.push('calendar_created');
        await provisioningJobRepository.update(jobId, { stagesCompleted });
      }

      // -------------------------------------------------------------
      // Stage 6: Initialize Onboarding Progress State
      // -------------------------------------------------------------
      if (!stagesCompleted.includes('onboarding_initialized')) {
        await organisationOnboardingService.startOnboarding(actorId, orgId);

        stagesCompleted.push('onboarding_initialized');
        await provisioningJobRepository.update(jobId, { stagesCompleted });
      }

      // -------------------------------------------------------------
      // Finalize Provisioning Job
      // -------------------------------------------------------------
      await provisioningJobRepository.update(jobId, {
        jobStatus: 'completed',
        completedAt: new Date().toISOString(),
        stagesCompleted
      });

      await auditService.log({
        organisationId: orgId,
        actorId,
        action: 'PLATFORM_COMPLETE_ORGANISATION_PROVISIONING',
        entityType: 'organisation',
        entityId: orgId,
        after: {
          jobId,
          provisioningMode: input.provisioningMode,
          planId: input.planId
        }
      });

      return {
        jobId,
        organisation: createdOrg,
        subscription: createdSub,
        invitation: createdInvite,
        membership: createdMem,
        isExisting: false
      };
    } catch (err) {
      const errorMsg = (err as Error).message || 'Unknown error occurred during provisioning';
      const errorRef = `err_prov_${Date.now()}`;

      await provisioningJobRepository.update(jobId, {
        jobStatus: 'failed',
        error: errorMsg,
        errorReference: errorRef
      });

      await auditService.log({
        organisationId: orgId || 'platform',
        actorId,
        action: 'PLATFORM_FAIL_ORGANISATION_PROVISIONING',
        entityType: 'provisioningJob',
        entityId: jobId,
        after: {
          error: errorMsg,
          errorReference: errorRef,
          stagesCompleted
        }
      });

      throw new Error(`Provisioning failed [Ref: ${errorRef}]: ${errorMsg}`, { cause: err });
    }
  }

  /**
   * Resumes and recovers a failed or incomplete provisioning job without duplicating records.
   */
  async retryProvisioning(actorId: string, jobId: string): Promise<ProvisioningResult> {
    const job = await provisioningJobRepository.getById(jobId);
    if (!job) {
      throw new Error(`Provisioning job ${jobId} not found.`);
    }

    await auditService.log({
      organisationId: job.organisationId || 'platform',
      actorId,
      action: 'PLATFORM_RETRY_ORGANISATION_PROVISIONING',
      entityType: 'provisioningJob',
      entityId: jobId,
      after: { requestId: job.requestId }
    });

    return this.provisionOrganisation(actorId, job.input);
  }
}

export const organisationProvisioningService = new OrganisationProvisioningService();
