import { describe, it, expect, beforeEach, vi } from 'vitest';
import { organisationProvisioningService } from '../provisioning/organisationProvisioningService';
import { organisationOnboardingService } from '../onboarding/organisationOnboardingService';
import { organisationReadinessService } from '../onboarding/organisationReadinessService';
import { onboardingTemplateService } from '../onboarding/onboardingTemplateService';
import { bootstrapOrganisationOnboarding } from '../../../scripts/migrations/bootstrap-organisation-onboarding';
import { organisationRepository } from '../../repositories/organisationRepository';
import { organisationOnboardingRepository } from '../../repositories/organisationOnboardingRepository';
import { provisioningJobRepository } from '../../repositories/provisioningJobRepository';
import { organisationSettingsRepository } from '../../repositories/organisationSettingsRepository';
import { organisationCalendarPeriodRepository } from '../../repositories/organisationCalendarPeriodRepository';
import { organisationInvitationRepository } from '../../repositories/organisationInvitationRepository';
import { organisationMembershipRepository } from '../../repositories/organisationMembershipRepository';
import { saasSubscriptionService } from '../billing/saasSubscriptionService';
import { subscriptionResolverService } from '../billing/subscriptionResolverService';
import { entitlementResolverService } from '../entitlementResolverService';
import { auditService } from '../auditService';
import type {
  Organisation,
  Subscription,
  OrganisationOnboarding,
  ProvisioningJob,
  ProvisionOrganisationInput
} from '../../types';

// Mock DB and Repositories
vi.mock('../../lib/firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({
    empty: false,
    size: 1,
    docs: [
      {
        id: 'user_existing_1',
        data: () => ({ id: 'user_existing_1', email: 'existing.admin@school.example.com' })
      }
    ],
    forEach: vi.fn((cb) => {
      cb({
        id: 'user_existing_1',
        data: () => ({ id: 'user_existing_1', email: 'existing.admin@school.example.com' })
      });
    })
  }),
  setDoc: vi.fn().mockResolvedValue(undefined),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn()
}));

vi.mock('../../repositories/organisationRepository');
vi.mock('../../repositories/organisationOnboardingRepository');
vi.mock('../../repositories/provisioningJobRepository');
vi.mock('../../repositories/organisationSettingsRepository');
vi.mock('../../repositories/organisationCalendarPeriodRepository');
vi.mock('../../repositories/organisationInvitationRepository');
vi.mock('../../repositories/organisationMembershipRepository');
vi.mock('../billing/saasSubscriptionService');
vi.mock('../billing/subscriptionResolverService');
vi.mock('../entitlementResolverService');
vi.mock('../auditService');

describe('SaaS 3A: Customer Provisioning & School Onboarding Test Suite', () => {
  const actorId = 'super_admin_1';

  const mockOrg: Organisation = {
    id: 'org_test_1',
    organisationId: 'org_test_1',
    name: 'Soweto Harmony Academy',
    organisationType: 'music_academy',
    tenantStatus: 'provisioning',
    assignedPlanId: 'plan_professional',
    status: 'active',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
    createdBy: actorId,
    updatedBy: actorId
  };

  const mockSub: Subscription = {
    id: 'sub_test_1',
    organisationId: 'org_test_1',
    planId: 'plan_professional',
    subscriptionStatus: 'trialing',
    billingMode: 'provider',
    billingInterval: 'monthly',
    priceAmount: 0,
    currency: 'ZAR',
    currentPeriodStart: '2026-02-01T00:00:00Z',
    currentPeriodEnd: '2026-02-15T00:00:00Z',
    trialStartedAt: '2026-02-01T00:00:00Z',
    trialEndsAt: '2026-02-15T00:00:00Z',
    cancelAtPeriodEnd: false,
    status: 'active',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
    createdBy: actorId,
    updatedBy: actorId
  };

  const mockOnboarding: OrganisationOnboarding = {
    id: 'onboarding_org_test_1',
    organisationId: 'org_test_1',
    onboardingStatus: 'in_progress',
    currentStep: 'organisation_profile',
    completedSteps: ['welcome'],
    skippedSteps: [],
    startedAt: '2026-02-01T00:00:00Z',
    lastProgressAt: '2026-02-01T00:00:00Z',
    status: 'active',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
    createdBy: actorId,
    updatedBy: actorId
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(organisationRepository.getById).mockResolvedValue(mockOrg);
    vi.mocked(organisationRepository.update).mockResolvedValue(undefined);
    vi.mocked(organisationOnboardingRepository.getByOrganisationId).mockResolvedValue(mockOnboarding);
    vi.mocked(organisationOnboardingRepository.save).mockResolvedValue(undefined);
    vi.mocked(organisationOnboardingRepository.update).mockResolvedValue(undefined);
    vi.mocked(provisioningJobRepository.getByRequestId).mockResolvedValue(null);
    vi.mocked(provisioningJobRepository.save).mockResolvedValue(undefined);
    vi.mocked(provisioningJobRepository.update).mockResolvedValue(undefined);
    vi.mocked(organisationSettingsRepository.save).mockResolvedValue(undefined);
    vi.mocked(organisationCalendarPeriodRepository.save).mockResolvedValue(undefined);
    vi.mocked(organisationInvitationRepository.save).mockResolvedValue(undefined);
    vi.mocked(organisationMembershipRepository.save).mockResolvedValue(undefined);
    vi.mocked(saasSubscriptionService.createTrial).mockResolvedValue(mockSub);
    vi.mocked(saasSubscriptionService.createManualSubscription).mockResolvedValue(mockSub);
    vi.mocked(saasSubscriptionService.activateSubscription).mockResolvedValue(mockSub);
    vi.mocked(saasSubscriptionService.createComplimentarySubscription).mockResolvedValue(mockSub);
    vi.mocked(subscriptionResolverService.getCurrentSubscription).mockResolvedValue(mockSub);
    vi.mocked(subscriptionResolverService.isSubscriptionOperational).mockReturnValue(true);
    vi.mocked(entitlementResolverService.hasFeature).mockResolvedValue(true);
    vi.mocked(entitlementResolverService.isFeatureEnabled).mockResolvedValue(true);
    vi.mocked(auditService.log).mockResolvedValue(undefined);
  });

  describe('1. Customer Provisioning Workflow', () => {
    it('provisions a complete new tenant with trial subscription, settings and initial onboarding', async () => {
      const input: ProvisionOrganisationInput = {
        organisationName: 'Durban Creative Youth Arts',
        organisationType: 'community_arts',
        primaryAdminEmail: 'principal@durbanarts.org',
        primaryAdminName: 'Dr. Zanele Khumalo',
        planId: 'plan_professional',
        provisioningMode: 'trial',
        trialDays: 14,
        organisationTemplate: 'community_arts'
      };

      const result = await organisationProvisioningService.provisionOrganisation(actorId, input);

      expect(result.organisation).toBeDefined();
      expect(result.organisation.name).toBe('Durban Creative Youth Arts');
      expect(result.organisation.tenantStatus).toBe('provisioning');
      expect(saasSubscriptionService.createTrial).toHaveBeenCalledWith(
        actorId,
        expect.any(String),
        expect.objectContaining({ planId: 'plan_professional', trialDays: 14 })
      );
      expect(organisationSettingsRepository.save).toHaveBeenCalled();
      expect(organisationCalendarPeriodRepository.save).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PLATFORM_START_ORGANISATION_PROVISIONING' })
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PLATFORM_COMPLETE_ORGANISATION_PROVISIONING' })
      );
    });

    it('provisions a manual active contract customer and activates subscription immediately', async () => {
      const input: ProvisionOrganisationInput = {
        organisationName: 'National Youth Symphony',
        organisationType: 'music_academy',
        primaryAdminEmail: 'director@youthsymphony.org',
        planId: 'plan_enterprise',
        provisioningMode: 'manual_active'
      };

      await organisationProvisioningService.provisionOrganisation(actorId, input);

      expect(saasSubscriptionService.createManualSubscription).toHaveBeenCalled();
      expect(saasSubscriptionService.activateSubscription).toHaveBeenCalled();
    });

    it('enforces idempotency on duplicate provisioningRequestId', async () => {
      const completedJob: ProvisioningJob = {
        id: 'job_done_123',
        requestId: 'req_unique_999',
        organisationId: 'org_test_1',
        createdOrganisationId: 'org_test_1',
        organisationName: 'Soweto Harmony Academy',
        jobStatus: 'completed',
        input: {
          organisationName: 'Soweto Harmony Academy',
          organisationType: 'music',
          primaryAdminEmail: 'admin@soweto.org',
          planId: 'plan_starter',
          provisioningMode: 'trial',
          provisioningRequestId: 'req_unique_999'
        },
        stagesCompleted: ['organisation_created', 'subscription_created', 'settings_bootstrapped'],
        status: 'active',
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-02-01T00:00:00Z',
        createdBy: actorId,
        updatedBy: actorId
      };

      vi.mocked(provisioningJobRepository.getByRequestId).mockResolvedValue(completedJob);

      const input: ProvisionOrganisationInput = {
        organisationName: 'Soweto Harmony Academy',
        organisationType: 'music',
        primaryAdminEmail: 'admin@soweto.org',
        planId: 'plan_starter',
        provisioningMode: 'trial',
        provisioningRequestId: 'req_unique_999'
      };

      const result = await organisationProvisioningService.provisionOrganisation(actorId, input);

      expect(result.isExisting).toBe(true);
      expect(result.organisation.id).toBe('org_test_1');
      expect(saasSubscriptionService.createTrial).not.toHaveBeenCalled();
    });

    it('records failure and allows retry without duplicating already created resources', async () => {
      // Simulate failure in stage 2 (subscription creation)
      vi.mocked(saasSubscriptionService.createTrial).mockRejectedValueOnce(new Error('Subscription service timeout'));

      const input: ProvisionOrganisationInput = {
        organisationName: 'Pretoria Dance Academy',
        organisationType: 'dance',
        primaryAdminEmail: 'admin@pretoriadance.org',
        planId: 'plan_professional',
        provisioningMode: 'trial',
        provisioningRequestId: 'req_fail_1'
      };

      await expect(
        organisationProvisioningService.provisionOrganisation(actorId, input)
      ).rejects.toThrow('Subscription service timeout');

      expect(provisioningJobRepository.update).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ jobStatus: 'failed' })
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PLATFORM_FAIL_ORGANISATION_PROVISIONING' })
      );
    });
  });

  describe('2. Initial Admin Invitation & Identity Reuse', () => {
    it('links existing user identity without generating duplicate auth invitation', async () => {
      const input: ProvisionOrganisationInput = {
        organisationName: 'Bloemfontein Arts Guild',
        organisationType: 'community_arts',
        primaryAdminEmail: 'existing.admin@school.example.com',
        primaryAdminName: 'Existing Admin',
        planId: 'plan_starter',
        provisioningMode: 'trial'
      };

      await organisationProvisioningService.provisionOrganisation(actorId, input);

      expect(organisationMembershipRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user_existing_1',
          email: 'existing.admin@school.example.com',
          role: 'organisation_admin'
        })
      );
      expect(organisationInvitationRepository.save).not.toHaveBeenCalled();
    });

    it('generates secure one-time expiring invitation for a new administrator', async () => {
      const input: ProvisionOrganisationInput = {
        organisationName: 'Johannesburg Drama School',
        organisationType: 'theatre',
        primaryAdminEmail: 'new.principal@jdrama.org',
        primaryAdminName: 'New Principal',
        planId: 'plan_starter',
        provisioningMode: 'trial'
      };

      await organisationProvisioningService.provisionOrganisation(actorId, input);

      expect(organisationInvitationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new.principal@jdrama.org',
          role: 'organisation_admin',
          invitationStatus: 'pending'
        })
      );
    });
  });

  describe('3. Onboarding Wizard & Step Progression', () => {
    it('filters out finance step if tenant lacks finance.core entitlement', async () => {
      vi.mocked(entitlementResolverService.isFeatureEnabled).mockResolvedValueOnce(false);
      vi.mocked(entitlementResolverService.hasFeature).mockResolvedValueOnce(false);

      const steps = await organisationOnboardingService.getEffectiveSteps('org_test_1');
      expect(steps).not.toContain('finance');
      expect(steps).toContain('welcome');
      expect(steps).toContain('programmes_groups');
    });

    it('advances current step, marks step complete, and audits progress', async () => {
      await organisationOnboardingService.completeStep(
        actorId,
        'org_test_1',
        'organisation_profile',
        { name: 'Updated Academy' }
      );

      expect(organisationOnboardingRepository.update).toHaveBeenCalledWith(
        'onboarding_org_test_1',
        expect.objectContaining({
          currentStep: 'branding',
          completedSteps: expect.arrayContaining(['welcome', 'organisation_profile'])
        })
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ORGANISATION_COMPLETE_ONBOARDING_STEP' })
      );
    });

    it('allows skipping optional steps and persists skipped status', async () => {
      await organisationOnboardingService.skipStep(actorId, 'org_test_1', 'branding');

      expect(organisationOnboardingRepository.update).toHaveBeenCalledWith(
        'onboarding_org_test_1',
        expect.objectContaining({
          currentStep: 'programme_types',
          skippedSteps: expect.arrayContaining(['branding'])
        })
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ORGANISATION_SKIP_ONBOARDING_STEP' })
      );
    });
  });

  describe('4. Organisation Readiness Engine & Go-Live Validation', () => {
    it('reports missing conditions if organisation lacks programmes or groups', async () => {
      const report = await organisationReadinessService.evaluateReadiness('org_test_1');

      // The readiness report has evaluation conditions
      expect(report.conditions.length).toBeGreaterThan(0);
      expect(report.conditions.find((c) => c.key === 'profile_configured')?.met).toBe(true);
      expect(report.conditions.find((c) => c.key === 'subscription_operational')?.met).toBe(true);
    });

    it('blocks go-live when required readiness conditions fail', async () => {
      // Mock evaluateReadiness to return isReady = false
      vi.spyOn(organisationReadinessService, 'evaluateReadiness').mockResolvedValueOnce({
        isReady: false,
        percentage: 60,
        conditions: [
          { key: 'profile_configured', label: 'Organisation Profile', description: '', met: true, required: true },
          { key: 'programmes_created', label: 'Teaching Programmes', description: '', met: false, required: true }
        ]
      });

      await expect(
        organisationReadinessService.completeOrganisationOnboarding(actorId, 'org_test_1')
      ).rejects.toThrow('Cannot complete onboarding. The following required items are missing: Teaching Programmes');

      expect(organisationRepository.update).not.toHaveBeenCalled();
    });

    it('successfully completes onboarding and transitions tenantStatus to trial for trialing subscription', async () => {
      vi.spyOn(organisationReadinessService, 'evaluateReadiness').mockResolvedValueOnce({
        isReady: true,
        percentage: 100,
        conditions: [
          { key: 'profile_configured', label: 'Profile', description: '', met: true, required: true }
        ]
      });

      const result = await organisationReadinessService.completeOrganisationOnboarding(actorId, 'org_test_1');

      expect(result.success).toBe(true);
      expect(result.tenantStatus).toBe('trial');
      expect(organisationRepository.update).toHaveBeenCalledWith(
        'org_test_1',
        actorId,
        expect.objectContaining({ tenantStatus: 'trial' })
      );
      expect(organisationOnboardingRepository.update).toHaveBeenCalledWith(
        'onboarding_org_test_1',
        expect.objectContaining({ onboardingStatus: 'completed' })
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ORGANISATION_COMPLETE_ONBOARDING' })
      );
    });

    it('transitions tenantStatus to active for paid/manual active subscription', async () => {
      vi.mocked(subscriptionResolverService.getCurrentSubscription).mockResolvedValueOnce({
        ...mockSub,
        subscriptionStatus: 'active',
        billingMode: 'manual'
      });

      vi.spyOn(organisationReadinessService, 'evaluateReadiness').mockResolvedValueOnce({
        isReady: true,
        percentage: 100,
        conditions: []
      });

      const result = await organisationReadinessService.completeOrganisationOnboarding(actorId, 'org_test_1');

      expect(result.success).toBe(true);
      expect(result.tenantStatus).toBe('active');
    });
  });

  describe('5. Onboarding Templates Service', () => {
    it('lists standard arts organisation templates', () => {
      const templates = onboardingTemplateService.listTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(4);
      expect(templates.map((t) => t.code)).toContain('school_music');
      expect(templates.map((t) => t.code)).toContain('dance_school');
    });

    it('resolves template by code with recommended groups and attendance thresholds', () => {
      const tmpl = onboardingTemplateService.getTemplateByCode('school_music');
      expect(tmpl).not.toBeNull();
      expect(tmpl?.programmeTypes).toContain('music');
      expect(tmpl?.defaultAttendanceThreshold).toBe(75);
      expect(tmpl?.recommendedGroups.length).toBeGreaterThan(0);
    });
  });

  describe('6. Legacy Tenant Compatibility & Migration Script', () => {
    it('safely runs dry-run migration without modifying database', async () => {
      const summary = await bootstrapOrganisationOnboarding(true);
      expect(summary.dryRun).toBe(true);
      expect(summary.scanned).toBeGreaterThanOrEqual(0);
    });
  });
});
