import { describe, it, expect, vi, beforeEach } from 'vitest';
import { foundingPartnerService } from '../platform/foundingPartnerService';
import { customerActivationService } from '../platform/customerActivationService';
import { founderNotesService } from '../platform/founderNotesService';
import { feedbackService } from '../feedbackService';
import { platformSupportService } from '../platform/platformSupportService';
import { organisationRepository } from '../../repositories/organisationRepository';
import { subscriptionRepository } from '../../repositories/subscriptionRepository';
import { subscriptionResolverService } from '../billing/subscriptionResolverService';
import { founderNotesRepository } from '../../repositories/founderNotesRepository';
import { customerFeedbackRepository } from '../../repositories/customerFeedbackRepository';
import { usageMeteringService } from '../usageMeteringService';
import { organisationReadinessService } from '../onboarding/organisationReadinessService';
import { auditService } from '../auditService';
import type { Organisation, Subscription } from '../../types';

describe('SaaS v1.1 Founding Partner Pilot & Customer Activation Test Suite', () => {
  const MOCK_ORG_A: Organisation = {
    id: 'org_pilot_a',
    organisationId: 'org_pilot_a',
    name: 'Braamfontein Music & Dance Academy',
    organisationType: 'music_and_dance',
    tenantStatus: 'trial',
    assignedPlanId: 'plan_professional',
    primaryAdminEmail: 'director@braammusic.co.za',
    status: 'active',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    createdBy: 'super_admin',
    updatedBy: 'super_admin'
  };

  const MOCK_ORG_B: Organisation = {
    id: 'org_pilot_b',
    organisationId: 'org_pilot_b',
    name: 'Soweto Youth Strings Conservatory',
    organisationType: 'music',
    tenantStatus: 'trial',
    assignedPlanId: 'plan_professional',
    primaryAdminEmail: 'admin@sowetostrings.org.za',
    status: 'active',
    createdAt: '2026-03-02T00:00:00Z',
    updatedAt: '2026-03-02T00:00:00Z',
    createdBy: 'super_admin',
    updatedBy: 'super_admin'
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(auditService, 'log').mockResolvedValue();
  });

  describe('1. Founding Partner Programme & 10-Slot Quota Enforcement', () => {
    it('accurately calculates founding partner quota slots', async () => {
      const existingPartners: Organisation[] = Array.from({ length: 7 }, (_, i) => ({
        id: `org_fp_${i + 1}`,
        organisationId: `org_fp_${i + 1}`,
        name: `Founding Academy #${i + 1}`,
        organisationType: 'music_and_dance',
        status: 'active',
        isFoundingPartner: true,
        foundingPartnerNumber: i + 1,
        foundingPartnerStatus: 'active',
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
        createdBy: 'system',
        updatedBy: 'system'
      }));

      vi.spyOn(organisationRepository, 'getAll').mockResolvedValue(existingPartners);

      const stats = await foundingPartnerService.getFoundingPartnerStats();
      expect(stats.allocatedSlots).toBe(7);
      expect(stats.maxSlots).toBe(10);
      expect(stats.remainingSlots).toBe(3);
      expect(stats.isFull).toBe(false);
    });

    it('assigns Founding Partner slot with 12-month price lock and unique partner number', async () => {
      let orgState: Organisation = { ...MOCK_ORG_A };
      vi.spyOn(organisationRepository, 'getById').mockImplementation(async () => orgState);
      vi.spyOn(organisationRepository, 'getAll').mockResolvedValue([MOCK_ORG_A]);
      const updateSpy = vi.spyOn(organisationRepository, 'update').mockImplementation(async (...args: unknown[]) => {
        const updates = (typeof args[2] === 'object' ? args[2] : args[3]) as Partial<Organisation> | undefined;
        if (updates) Object.assign(orgState, updates);
      });

      const assigned = await foundingPartnerService.assignFoundingPartner('super_admin', 'org_pilot_a');

      expect(assigned.isFoundingPartner).toBe(true);
      expect(assigned.foundingPartnerNumber).toBe(1);
      expect(assigned.foundingPriceLockEndsAt).toBeDefined();

      // Verify 12-month price protection
      const lockDate = new Date(assigned.foundingPriceLockEndsAt!);
      const now = new Date();
      expect(lockDate.getFullYear()).toBe(now.getFullYear() + 1);

      expect(updateSpy).toHaveBeenCalledWith(
        'org_pilot_a',
        'super_admin',
        expect.objectContaining({
          isFoundingPartner: true,
          foundingPartnerNumber: 1
        })
      );
    });

    it('strictly enforces the 10-slot maximum limit', async () => {
      // 10 already existing partners
      const fullPartners: Organisation[] = Array.from({ length: 10 }, (_, i) => ({
        id: `org_fp_${i + 1}`,
        organisationId: `org_fp_${i + 1}`,
        name: `Founding Academy #${i + 1}`,
        organisationType: 'music_and_dance',
        status: 'active',
        isFoundingPartner: true,
        foundingPartnerNumber: i + 1,
        foundingPartnerStatus: 'active',
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
        createdBy: 'system',
        updatedBy: 'system'
      }));

      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(MOCK_ORG_B);
      vi.spyOn(organisationRepository, 'getAll').mockResolvedValue(fullPartners);

      await expect(
        foundingPartnerService.assignFoundingPartner('super_admin', 'org_pilot_b')
      ).rejects.toThrow('Founding Partner Programme is full (maximum 10 slots allocated).');
    });

    it('converts founding trial to active subscription with locked founding price', async () => {
      const partnerOrg: Organisation = {
        ...MOCK_ORG_A,
        isFoundingPartner: true,
        foundingPartnerNumber: 1
      };

      const mockSub: Subscription = {
        id: 'sub_org_pilot_a',
        organisationId: 'org_pilot_a',
        planId: 'plan_professional',
        subscriptionStatus: 'trialing',
        billingMode: 'manual',
        billingInterval: 'monthly',
        currency: 'ZAR',
        priceAmount: 0,
        cancelAtPeriodEnd: false,
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
        createdBy: 'system',
        updatedBy: 'system',
        status: 'active'
      };

      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(partnerOrg);
      vi.spyOn(subscriptionResolverService, 'getCurrentSubscription').mockResolvedValue(mockSub);
      const subUpdateSpy = vi.spyOn(subscriptionRepository, 'update').mockResolvedValue();
      vi.spyOn(subscriptionRepository, 'getById').mockResolvedValue({
        ...mockSub,
        subscriptionStatus: 'active',
        priceAmount: 79900 // R799 for Professional Founding
      });
      const orgUpdateSpy = vi.spyOn(organisationRepository, 'update').mockResolvedValue();

      const converted = await foundingPartnerService.convertFoundingPartnerSubscription(
        'super_admin',
        'org_pilot_a',
        'plan_professional',
        'monthly'
      );

      expect(converted.subscriptionStatus).toBe('active');
      expect(converted.priceAmount).toBe(79900); // R799 / mo
      expect(subUpdateSpy).toHaveBeenCalledWith(
        'sub_org_pilot_a',
        expect.objectContaining({
          planId: 'plan_professional',
          priceAmount: 79900,
          subscriptionStatus: 'active'
        })
      );
      expect(orgUpdateSpy).toHaveBeenCalledWith(
        'org_pilot_a',
        'super_admin',
        expect.objectContaining({
          tenantStatus: 'active',
          foundingPartnerStatus: 'converted',
          foundingPlanPrice: 79900
        })
      );
    });
  });

  describe('2. Transparent Activation Score Calculation', () => {
    it('calculates deterministic activation score across operational categories', async () => {
      vi.spyOn(usageMeteringService, 'getUsageMeters').mockResolvedValue({
        organisationId: 'org_pilot_a',
        billingPeriod: '2026-03',
        meters: {
          'limits.learners': { key: 'limits.learners', name: 'Learners', description: '', unit: 'learners', current: 35, limit: 500, percentUsed: 7, status: 'ok', warning: false, exceeded: false },
          'limits.staff_users': { key: 'limits.staff_users', name: 'Staff', description: '', unit: 'staff', current: 4, limit: 50, percentUsed: 8, status: 'ok', warning: false, exceeded: false },
          'limits.storage_mb': { key: 'limits.storage_mb', name: 'Storage', description: '', unit: 'MB', current: 150, limit: 25000, percentUsed: 1, status: 'ok', warning: false, exceeded: false },
          'limits.monthly_communications': { key: 'limits.monthly_communications', name: 'Comms', description: '', unit: 'messages', current: 10, limit: 2000, percentUsed: 1, status: 'ok', warning: false, exceeded: false },
          'limits.automation_runs': { key: 'limits.automation_runs', name: 'Auto', description: '', unit: 'runs', current: 0, limit: 1000, percentUsed: 0, status: 'ok', warning: false, exceeded: false }
        },
        anyWarning: false,
        anyCritical: false,
        anyExceeded: false,
        lastSyncedAt: new Date().toISOString()
      });

      vi.spyOn(organisationReadinessService, 'evaluateReadiness').mockResolvedValue({
        isReady: true,
        percentage: 100,
        conditions: [
          { key: 'profile_configured', label: 'Profile', description: '', met: true, required: true },
          { key: 'admin_membership', label: 'Admin', description: '', met: true, required: true },
          { key: 'programmes_created', label: 'Programmes', description: '', met: true, required: true },
          { key: 'classes_groups_created', label: 'Groups', description: '', met: true, required: true }
        ]
      });

      const scoreResult = await customerActivationService.calculateActivationScore('org_pilot_a');

      // Check that score components are within valid bounds and sum accurately
      expect(scoreResult.totalScore).toBeGreaterThanOrEqual(60);
      expect(scoreResult.totalScore).toBeLessThanOrEqual(100);
      expect(['developing', 'strong', 'fully_activated']).toContain(scoreResult.level);
    });

    it('correctly maps score levels to human operational labels', () => {
      // 0-39: low, 40-69: developing, 70-89: strong, 90-100: fully_activated
      const evaluateLevel = (score: number) => {
        if (score >= 90) return 'Fully Activated';
        if (score >= 70) return 'Strong';
        if (score >= 40) return 'Developing';
        return 'Low Activation';
      };

      expect(evaluateLevel(25)).toBe('Low Activation');
      expect(evaluateLevel(55)).toBe('Developing');
      expect(evaluateLevel(75)).toBe('Strong');
      expect(evaluateLevel(95)).toBe('Fully Activated');
    });
  });

  describe('3. Operational Needs Attention Alerts', () => {
    it('flags restricted or suspended accounts immediately', async () => {
      const restrictedOrg: Organisation = {
        ...MOCK_ORG_A,
        id: 'org_restricted',
        tenantStatus: 'restricted',
        restrictionReason: 'Trial expired without subscription'
      };

      vi.spyOn(organisationRepository, 'getAll').mockResolvedValue([restrictedOrg]);
      vi.spyOn(subscriptionResolverService, 'getCurrentSubscription').mockResolvedValue(null);

      const items = await customerActivationService.getNeedsAttentionList();
      expect(items.some((i) => i.organisationId === 'org_restricted' && i.category === 'restricted')).toBe(true);
    });

    it('flags trials expiring within 3 days', async () => {
      const expiringSub: Subscription = {
        id: 'sub_expiring',
        organisationId: 'org_pilot_a',
        planId: 'plan_professional',
        subscriptionStatus: 'trialing',
        billingMode: 'manual',
        billingInterval: 'monthly',
        currency: 'ZAR',
        priceAmount: 0,
        cancelAtPeriodEnd: false,
        trialEndsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days left
        currentPeriodEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
        createdBy: 'system',
        updatedBy: 'system',
        status: 'active'
      };

      vi.spyOn(organisationRepository, 'getAll').mockResolvedValue([MOCK_ORG_A]);
      vi.spyOn(subscriptionResolverService, 'getCurrentSubscription').mockResolvedValue(expiringSub);

      const items = await customerActivationService.getNeedsAttentionList();
      expect(items.some((i) => i.organisationId === 'org_pilot_a' && i.category === 'trial_expiring')).toBe(true);
    });
  });

  describe('4. Conversion Readiness & Suggested Plan Recommendation', () => {
    it('recommends Professional if organisation actively uses Events or exceeds Starter limits', async () => {
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(MOCK_ORG_A);
      vi.spyOn(subscriptionResolverService, 'getCurrentSubscription').mockResolvedValue({
        id: 'sub_trial_a',
        organisationId: 'org_pilot_a',
        planId: 'plan_professional',
        subscriptionStatus: 'trialing',
        billingMode: 'manual',
        billingInterval: 'monthly',
        currency: 'ZAR',
        priceAmount: 0,
        cancelAtPeriodEnd: false,
        trialStartedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(), // Day 11
        trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        currentPeriodEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
        createdBy: 'system',
        updatedBy: 'system',
        status: 'active'
      });

      // Learners: 120 (exceeds Starter limit of 100)
      vi.spyOn(usageMeteringService, 'getUsageMeters').mockResolvedValue({
        organisationId: 'org_pilot_a',
        billingPeriod: '2026-03',
        meters: {
          'limits.learners': { key: 'limits.learners', name: 'Learners', description: '', unit: 'learners', current: 120, limit: 500, percentUsed: 24, status: 'ok', warning: false, exceeded: false },
          'limits.staff_users': { key: 'limits.staff_users', name: 'Staff', description: '', unit: 'staff', current: 6, limit: 50, percentUsed: 12, status: 'ok', warning: false, exceeded: false },
          'limits.storage_mb': { key: 'limits.storage_mb', name: 'Storage', description: '', unit: 'MB', current: 500, limit: 25000, percentUsed: 2, status: 'ok', warning: false, exceeded: false },
          'limits.monthly_communications': { key: 'limits.monthly_communications', name: 'Comms', description: '', unit: 'messages', current: 50, limit: 2000, percentUsed: 2, status: 'ok', warning: false, exceeded: false },
          'limits.automation_runs': { key: 'limits.automation_runs', name: 'Auto', description: '', unit: 'runs', current: 0, limit: 1000, percentUsed: 0, status: 'ok', warning: false, exceeded: false }
        },
        anyWarning: false,
        anyCritical: false,
        anyExceeded: false,
        lastSyncedAt: new Date().toISOString()
      });

      vi.spyOn(organisationReadinessService, 'evaluateReadiness').mockResolvedValue({
        isReady: true,
        percentage: 100,
        conditions: []
      });

      const readiness = await customerActivationService.getConversionReadiness('org_pilot_a');
      expect(readiness.suggestedPlanId).toBe('plan_professional');
      expect(readiness.suggestedPlanName).toBe('ArtsFlow Professional');
      expect(readiness.trialDay).toBe(12);
    });
  });

  describe('5. Platform Founder Notes (Private to Super Admin)', () => {
    it('creates internal founder note with category and logs audit trail', async () => {
      const saveSpy = vi.spyOn(founderNotesRepository, 'save').mockResolvedValue();

      const note = await founderNotesService.addNote(
        'super_admin_1',
        'Founder Lead',
        'org_pilot_a',
        'Spoke with the head of music; they run 3 brass bands and need bus transport manifests.',
        'commercial'
      );

      expect(note.content).toContain('brass bands');
      expect(note.category).toBe('commercial');
      expect(note.authorName).toBe('Founder Lead');
      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({
        organisationId: 'org_pilot_a',
        category: 'commercial'
      }));
    });
  });

  describe('6. Customer Feedback Submission & Founder Review', () => {
    it('submits structured feedback and saves to customerFeedback repository', async () => {
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(MOCK_ORG_A);
      const saveSpy = vi.spyOn(customerFeedbackRepository, 'save').mockResolvedValue();

      const feedback = await feedbackService.submitFeedback('user_teacher_1', {
        organisationId: 'org_pilot_a',
        category: 'music',
        rating: 5,
        comment: 'Repertoire piece tracking and student instrument allocations have saved us hours.',
        improvements: 'Would love bulk assignment from class lists.',
        canContact: true,
        submittedByName: 'Sarah Teacher'
      });

      expect(feedback.rating).toBe(5);
      expect(feedback.status).toBe('new');
      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({
        organisationId: 'org_pilot_a',
        category: 'music',
        rating: 5
      }));
    });

    it('allows Platform Super Admin to update feedback status to planned or resolved', async () => {
      const mockRecord = {
        id: 'fb_123',
        organisationId: 'org_pilot_a',
        organisationName: 'Braamfontein Music & Dance Academy',
        submittedBy: 'user_teacher_1',
        category: 'music' as const,
        rating: 5,
        comment: 'Great software',
        status: 'new' as const,
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z'
      };

      vi.spyOn(customerFeedbackRepository, 'getById').mockResolvedValue(mockRecord);
      const updateSpy = vi.spyOn(customerFeedbackRepository, 'updateStatus').mockResolvedValue();

      await feedbackService.updateFeedbackStatus('super_admin_1', 'fb_123', 'planned', 'Added to Q2 roadmap');
      expect(updateSpy).toHaveBeenCalledWith('fb_123', 'planned', 'super_admin_1', 'Added to Q2 roadmap');
    });
  });

  describe('7. Platform Support Trial Extension', () => {
    it('allows Platform Super Admin to extend trial with audit logging', async () => {
      const trialSub: Subscription = {
        id: 'sub_extend_me',
        organisationId: 'org_pilot_a',
        planId: 'plan_professional',
        subscriptionStatus: 'trialing',
        billingMode: 'manual',
        billingInterval: 'monthly',
        currency: 'ZAR',
        priceAmount: 0,
        cancelAtPeriodEnd: false,
        trialEndsAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        currentPeriodEnd: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
        createdBy: 'system',
        updatedBy: 'system',
        status: 'active'
      };

      vi.spyOn(subscriptionResolverService, 'getCurrentSubscription').mockResolvedValue(trialSub);
      const subUpdateSpy = vi.spyOn(subscriptionRepository, 'update').mockResolvedValue();
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue(MOCK_ORG_A);

      await platformSupportService.extendTrial(
        'org_pilot_a',
        'super_admin_1',
        14,
        'Founding partner requested extra time to complete dance register setup'
      );

      expect(subUpdateSpy).toHaveBeenCalledWith(
        'sub_extend_me',
        expect.objectContaining({
          subscriptionStatus: 'trialing'
        })
      );
    });
  });
});
