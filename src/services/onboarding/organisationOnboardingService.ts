import { organisationOnboardingRepository } from '../../repositories/organisationOnboardingRepository';
import { entitlementResolverService } from '../entitlementResolverService';
import { auditService } from '../auditService';
import type { OrganisationOnboarding, OnboardingStep } from '../../types';

export const ALL_ONBOARDING_STEPS: OnboardingStep[] = [
  'welcome',
  'organisation_profile',
  'branding',
  'programme_types',
  'calendar',
  'attendance',
  'finance',
  'staff',
  'programmes_groups',
  'learner_import',
  'guardian_setup',
  'review',
  'go_live'
];

export class OrganisationOnboardingService {
  /**
   * Retrieves current onboarding progress or creates an initial record if none exists.
   */
  async getOnboarding(organisationId: string): Promise<OrganisationOnboarding | null> {
    return organisationOnboardingRepository.getByOrganisationId(organisationId);
  }

  /**
   * Initializes onboarding for a newly provisioned tenant.
   */
  async startOnboarding(actorId: string, organisationId: string): Promise<OrganisationOnboarding> {
    const existing = await this.getOnboarding(organisationId);
    if (existing) return existing;

    const now = new Date().toISOString();
    const newOnboarding: OrganisationOnboarding = {
      id: `onboarding_${organisationId}`,
      organisationId,
      onboardingStatus: 'not_started',
      currentStep: 'welcome',
      completedSteps: [],
      skippedSteps: [],
      startedAt: now,
      lastProgressAt: now,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
      status: 'active'
    };

    await organisationOnboardingRepository.save(newOnboarding);

    await auditService.log({
      organisationId,
      actorId,
      action: 'ORGANISATION_START_ONBOARDING',
      entityType: 'organisationOnboarding',
      entityId: newOnboarding.id,
      after: { currentStep: 'welcome' }
    });

    return newOnboarding;
  }

  /**
   * Resolves the sequence of active steps for the tenant, filtering out unentitled modules.
   */
  async getEffectiveSteps(organisationId: string): Promise<OnboardingStep[]> {
    const hasFinance = await entitlementResolverService.isFeatureEnabled(organisationId, 'finance.core');
    if (!hasFinance) {
      return ALL_ONBOARDING_STEPS.filter((s) => s !== 'finance');
    }
    return ALL_ONBOARDING_STEPS;
  }

  /**
   * Saves progress for a specific step without marking it completed.
   */
  async saveStepProgress(
    actorId: string,
    organisationId: string,
    step: OnboardingStep,
    stepData?: Record<string, unknown>
  ): Promise<OrganisationOnboarding> {
    let onboarding = await this.getOnboarding(organisationId);
    if (!onboarding) {
      onboarding = await this.startOnboarding(actorId, organisationId);
    }

    const now = new Date().toISOString();
    const updatedData = {
      ...(onboarding.stepData || {}),
      ...(stepData ? { [step]: stepData } : {})
    };

    await organisationOnboardingRepository.update(onboarding.id, {
      currentStep: step,
      onboardingStatus: onboarding.onboardingStatus === 'not_started' ? 'in_progress' : onboarding.onboardingStatus,
      stepData: updatedData,
      lastProgressAt: now,
      updatedAt: now,
      updatedBy: actorId
    });

    return (await this.getOnboarding(organisationId))!;
  }

  /**
   * Completes a step and advances to the next step.
   */
  async completeStep(
    actorId: string,
    organisationId: string,
    step: OnboardingStep,
    stepData?: Record<string, unknown>
  ): Promise<OrganisationOnboarding> {
    let onboarding = await this.getOnboarding(organisationId);
    if (!onboarding) {
      onboarding = await this.startOnboarding(actorId, organisationId);
    }

    const now = new Date().toISOString();
    const completedSteps = Array.from(new Set([...onboarding.completedSteps, step])) as OnboardingStep[];
    const skippedSteps = onboarding.skippedSteps.filter((s) => s !== step) as OnboardingStep[];

    const effectiveSteps = await this.getEffectiveSteps(organisationId);
    const currentIndex = effectiveSteps.indexOf(step);
    const nextStep = currentIndex >= 0 && currentIndex < effectiveSteps.length - 1
      ? effectiveSteps[currentIndex + 1]
      : step;

    const isReadyForReview = nextStep === 'review' || nextStep === 'go_live';
    const nextStatus = isReadyForReview ? 'ready_for_review' : 'in_progress';

    const updatedData = {
      ...(onboarding.stepData || {}),
      ...(stepData ? { [step]: stepData } : {})
    };

    await organisationOnboardingRepository.update(onboarding.id, {
      currentStep: nextStep,
      onboardingStatus: onboarding.onboardingStatus === 'completed' ? 'completed' : nextStatus,
      completedSteps,
      skippedSteps,
      stepData: updatedData,
      lastProgressAt: now,
      updatedAt: now,
      updatedBy: actorId
    });

    await auditService.log({
      organisationId,
      actorId,
      action: 'ORGANISATION_COMPLETE_ONBOARDING_STEP',
      entityType: 'organisationOnboarding',
      entityId: onboarding.id,
      after: { completedStep: step, nextStep }
    });

    return (await this.getOnboarding(organisationId))!;
  }

  /**
   * Skips an optional step and advances to the next step.
   */
  async skipStep(
    actorId: string,
    organisationId: string,
    step: OnboardingStep
  ): Promise<OrganisationOnboarding> {
    let onboarding = await this.getOnboarding(organisationId);
    if (!onboarding) {
      onboarding = await this.startOnboarding(actorId, organisationId);
    }

    const now = new Date().toISOString();
    const skippedSteps = Array.from(new Set([...onboarding.skippedSteps, step])) as OnboardingStep[];
    const completedSteps = onboarding.completedSteps.filter((s) => s !== step) as OnboardingStep[];

    const effectiveSteps = await this.getEffectiveSteps(organisationId);
    const currentIndex = effectiveSteps.indexOf(step);
    const nextStep = currentIndex >= 0 && currentIndex < effectiveSteps.length - 1
      ? effectiveSteps[currentIndex + 1]
      : step;

    await organisationOnboardingRepository.update(onboarding.id, {
      currentStep: nextStep,
      skippedSteps,
      completedSteps,
      lastProgressAt: now,
      updatedAt: now,
      updatedBy: actorId
    });

    await auditService.log({
      organisationId,
      actorId,
      action: 'ORGANISATION_SKIP_ONBOARDING_STEP',
      entityType: 'organisationOnboarding',
      entityId: onboarding.id,
      after: { skippedStep: step, nextStep }
    });

    return (await this.getOnboarding(organisationId))!;
  }
}

export const organisationOnboardingService = new OrganisationOnboardingService();
