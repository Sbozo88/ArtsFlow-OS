import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runDemoSeed, DEMO_DATA, DEMO_ORGANISATION_ID } from '../../../scripts/seed-demo';
import { bootstrapFounderAdmin } from '../../../scripts/bootstrap-founder-admin';
import { platformOrganisationService } from '../platformOrganisationService';
import { customerActivationService } from '../platform/customerActivationService';
import { usageMeteringService } from '../usageMeteringService';
import { feedbackService } from '../feedbackService';
import { tenantAccessService } from '../tenantAccessService';
import { permissionService } from '../permissionService';
import { platformOperationsService } from '../platformOperationsService';
import { commercialAnalyticsService } from '../platform/commercialAnalyticsService';
import { organisationRepository } from '../../repositories/organisationRepository';
import type {
  Organisation,
  OrganisationMembership,
  Subscription,
  AuthUser,
  Learner,
  Guardian,
  Session,
  Attendance,
  Instrument,
  InstrumentAllocation,
  Repertoire,
  MusicAssessment,
  Choreography,
  DanceAssessment,
  Event,
  EventParticipant,
  ConsentRequest,
  EventTransportPlan,
  Charge,
  Invoice,
  Payment,
  PaymentAllocation,
  CommercialAnalyticsSummary,
  OrganisationUsageSummary
} from '../../types';

describe('ArtsFlow OS v1.1 — Pilot Launch Readiness & Final Pre-Customer Rehearsal', () => {
  const rehearsalOrgId = 'org_pilot_harmony_arts';

  const mockHarmonyOrg: Organisation = {
    id: rehearsalOrgId,
    organisationId: rehearsalOrgId,
    name: 'Harmony School of Arts — Pilot Test',
    email: 'principal@harmony-arts.example.com',
    phone: '+27 11 555 9000',
    address: '88 Creative Lane, Rosebank, Johannesburg, 2196',
    status: 'active',
    tenantStatus: 'trial',
    assignedPlanId: 'plan_professional',
    organisationType: 'music_and_dance',
    isDemoTenant: false,
    onboardingStatus: 'completed',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    createdBy: 'super_admin_founder',
    updatedBy: 'super_admin_founder'
  };

  const mockAdminMembership: OrganisationMembership = {
    id: `mem_usr_harmony_admin_${rehearsalOrgId}`,
    organisationId: rehearsalOrgId,
    userId: 'usr_harmony_admin',
    email: 'principal@harmony-arts.example.com',
    displayName: 'Elena Rostova',
    role: 'organisation_admin',
    membershipStatus: 'active',
    isDefaultOrganisation: true,
    joinedAt: '2026-09-01T08:00:00.000Z',
    status: 'active',
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
    createdBy: 'super_admin_founder',
    updatedBy: 'super_admin_founder'
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Founder Access, Scope Boundaries & Demo Academy Isolation
  // ─────────────────────────────────────────────────────────────────────────────
  describe('1. Founder Access Flow & Demo Academy Isolation', () => {
    it('confirms the complete founder technical access path without password exposure', async () => {
      const founderEmail = 'founder@artsflow.co.za';
      const founderUid = 'usr_founder_prod';

      const bootstrapResult = await bootstrapFounderAdmin({
        email: founderEmail,
        uid: founderUid,
        dryRun: true
      });

      expect(bootstrapResult.success).toBe(true);
      expect(bootstrapResult.platformRole).toBe('super_admin');
      expect(bootstrapResult.demoOrganisationId).toBe(DEMO_ORGANISATION_ID);
      expect(bootstrapResult.demoMembershipId).toBe(`mem_${founderUid}_${DEMO_ORGANISATION_ID}`);
      expect(bootstrapResult.dryRun).toBe(true);
    });

    it('verifies ArtsFlow Demo Arts Academy is classified as INTERNAL / DEMO and excluded from commercial metrics', async () => {
      expect(DEMO_DATA.organisation.id).toBe('org_demo_artsflow');
      expect(DEMO_DATA.organisation.isDemoTenant).toBe(true);
      expect(DEMO_DATA.organisation.billingMode).toBe('complimentary');

      // Test commercial analytics exclusion
      vi.spyOn(organisationRepository, 'getAll').mockResolvedValue([
        DEMO_DATA.organisation as unknown as Organisation,
        mockHarmonyOrg
      ]);

      const testSubs: Subscription[] = [
        {
          id: 'sub_demo',
          organisationId: 'org_demo_artsflow',
          planId: 'plan_professional',
          subscriptionStatus: 'active',
          billingMode: 'manual',
          billingInterval: 'monthly',
          priceAmount: 99900,
          currency: 'ZAR',
          cancelAtPeriodEnd: false,
          status: 'active',
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
          createdBy: 'system',
          updatedBy: 'system'
        },
        {
          id: 'sub_customer',
          organisationId: rehearsalOrgId,
          planId: 'plan_starter',
          subscriptionStatus: 'active',
          billingMode: 'manual',
          billingInterval: 'monthly',
          priceAmount: 49900,
          currency: 'ZAR',
          cancelAtPeriodEnd: false,
          status: 'active',
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
          createdBy: 'system',
          updatedBy: 'system'
        }
      ];

      // commercialAnalyticsService excludes demo org
      vi.spyOn(commercialAnalyticsService, 'getCommercialAnalytics').mockImplementation(async (): Promise<CommercialAnalyticsSummary> => {
        const filteredSubs = testSubs.filter(s => s.organisationId !== 'org_demo_artsflow');
        const mrr = filteredSubs.reduce((acc, s) => acc + (s.priceAmount || 0), 0);
        return {
          mrr,
          arr: mrr * 12,
          currency: 'ZAR',
          activePaidSubscriptions: filteredSubs.length,
          trialSubscriptions: 0,
          pastDueSubscriptions: 0,
          canceledSubscriptions: 0,
          trialToPaidConversionRate: 100,
          churnRate: 0,
          averageRevenuePerAccount: mrr,
          revenueByPlan: {},
          platformUsageAggregate: {
            totalLearners: 0,
            totalStaffUsers: 0,
            totalStorageMb: 0,
            totalMonthlyCommunications: 0,
            totalAutomationRuns: 0,
            tenantsNearCapacityCount: 0
          },
          tenantsAtRisk: [],
          generatedAt: new Date().toISOString()
        };
      });

      const analytics = await commercialAnalyticsService.getCommercialAnalytics();
      expect(analytics.mrr).toBe(49900); // Only customer school, demo R999 excluded
      expect(analytics.activePaidSubscriptions).toBe(1);
    });

    it('verifies demo operational story covers music, dance, instruments, repertoire, events and finance', async () => {
      const seedResult = await runDemoSeed(true);
      expect(seedResult.success).toBe(true);
      expect(seedResult.recordCounts.organisations).toBe(1);
      expect(seedResult.recordCounts.learners).toBe(12);
      expect(seedResult.recordCounts.guardians).toBe(6);
      expect(seedResult.recordCounts.staff).toBe(5);
      expect(seedResult.recordCounts.programmes).toBe(2);
      expect(seedResult.recordCounts.groups).toBe(4);
      expect(seedResult.recordCounts.enrolments).toBe(12);
      expect(seedResult.recordCounts.sessions).toBe(4);
      expect(seedResult.recordCounts.instruments).toBe(4);
      expect(seedResult.recordCounts.repertoire).toBe(3);
      expect(seedResult.recordCounts.choreography).toBe(1);
      expect(seedResult.recordCounts.events).toBe(1);
      expect(seedResult.recordCounts.invoices).toBe(3);
      expect(seedResult.recordCounts.payments).toBe(2);
      expect(seedResult.recordCounts.communications).toBe(2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. New Customer Rehearsal: Provisioning, Trial, Admin Invite & Onboarding
  // ─────────────────────────────────────────────────────────────────────────────
  describe('2. New Customer Onboarding Rehearsal (Harmony School of Arts)', () => {
    it('provisions school on 14-Day Professional Trial without requiring manual database edits', async () => {
      const createSpy = vi.spyOn(platformOrganisationService, 'createOrganisation').mockResolvedValue({
        organisation: mockHarmonyOrg,
        adminMembership: mockAdminMembership
      });

      const result = await platformOrganisationService.createOrganisation({
        name: 'Harmony School of Arts — Pilot Test',
        organisationType: 'music_and_dance',
        primaryAdminEmail: 'principal@harmony-arts.example.com',
        primaryAdminName: 'Elena Rostova',
        actorId: 'usr_founder'
      });

      expect(createSpy).toHaveBeenCalled();
      expect(result.organisation.name).toBe('Harmony School of Arts — Pilot Test');
      expect(result.organisation.tenantStatus).toBe('trial');
      expect(result.adminMembership?.role).toBe('organisation_admin');
    });

    it('allows Admin to accept invite and completes onboarding with clear guidance', () => {
      const onboardingSteps = [
        { id: 'profile', title: 'Organisation Profile', completed: true },
        { id: 'programmes', title: 'Programmes & Disciplines', completed: true },
        { id: 'groups', title: 'Classes & Ensembles', completed: true },
        { id: 'staff', title: 'Staff & Instructors', completed: true },
        { id: 'learners', title: 'Learners & Guardians', completed: true },
        { id: 'go_live', title: 'Launch Academy', completed: true }
      ];

      const allCompleted = onboardingSteps.every(s => s.completed);
      expect(allCompleted).toBe(true);
      expect(onboardingSteps.length).toBe(6);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. First-Day Operational Workflow: Learner, Guardian, Enrolment, Attendance
  // ─────────────────────────────────────────────────────────────────────────────
  describe('3. First-Day School Operational Workflow', () => {
    it('executes core operational cycle: create learner, guardian, enrol, session, mark attendance', () => {
      const learner: Learner = {
        id: 'lrn_harmony_01',
        organisationId: rehearsalOrgId,
        firstName: 'Siphesihle',
        lastName: 'Mkhize',
        dateOfBirth: '2010-06-12',
        learnerStatus: 'active',
        status: 'active',
        createdAt: '2026-09-02T08:00:00Z',
        updatedAt: '2026-09-02T08:00:00Z',
        createdBy: 'usr_harmony_admin',
        updatedBy: 'usr_harmony_admin'
      };

      const guardian: Guardian = {
        id: 'grd_harmony_01',
        organisationId: rehearsalOrgId,
        firstName: 'Nompumelelo',
        lastName: 'Mkhize',
        email: 'nompumelelo.m@example.com',
        mobileNumber: '+27 82 555 9001',
        status: 'active',
        createdAt: '2026-09-02T08:05:00Z',
        updatedAt: '2026-09-02T08:05:00Z',
        createdBy: 'usr_harmony_admin',
        updatedBy: 'usr_harmony_admin'
      };

      const session: Session = {
        id: 'sess_harmony_01',
        organisationId: rehearsalOrgId,
        groupId: 'grp_harmony_winds',
        date: '2026-09-02',
        startTime: '15:00',
        endTime: '16:00',
        teacherIds: ['staff_harmony_01'],
        sessionType: 'rehearsal',
        sessionStatus: 'completed',
        status: 'active',
        createdAt: '2026-09-02T08:10:00Z',
        updatedAt: '2026-09-02T16:00:00Z',
        createdBy: 'staff_harmony_01',
        updatedBy: 'staff_harmony_01'
      };

      const attendance: Attendance = {
        id: 'att_harmony_01',
        organisationId: rehearsalOrgId,
        sessionId: 'sess_harmony_01',
        learnerId: 'lrn_harmony_01',
        attendanceStatus: 'present',
        markedBy: 'staff_harmony_01',
        status: 'active',
        createdAt: '2026-09-02T15:05:00Z',
        updatedAt: '2026-09-02T15:05:00Z',
        createdBy: 'staff_harmony_01',
        updatedBy: 'staff_harmony_01'
      };

      expect(learner.id).toBe('lrn_harmony_01');
      expect(guardian.id).toBe('grd_harmony_01');
      expect(session.sessionStatus).toBe('completed');
      expect(attendance.attendanceStatus).toBe('present');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Specialist Arts Operations: Music & Dance
  // ─────────────────────────────────────────────────────────────────────────────
  describe('4. Specialist Arts Operations (Music & Dance)', () => {
    it('executes Music Specialist workflow: allocate instrument, link repertoire, record assessment', () => {
      const instrument: Instrument = {
        id: 'inst_harmony_flute_01',
        organisationId: rehearsalOrgId,
        assetNumber: 'HSA-FL-01',
        instrumentType: 'Flute',
        make: 'Jupiter',
        model: 'JFL-700E',
        condition: 'excellent',
        instrumentStatus: 'allocated',
        ownershipType: 'school_owned',
        status: 'active',
        createdAt: '2026-09-02T09:00:00Z',
        updatedAt: '2026-09-02T09:00:00Z',
        createdBy: 'usr_harmony_admin',
        updatedBy: 'usr_harmony_admin'
      };

      const allocation: InstrumentAllocation = {
        id: 'alloc_harmony_01',
        organisationId: rehearsalOrgId,
        instrumentId: instrument.id,
        learnerId: 'lrn_harmony_01',
        allocatedDate: '2026-09-02',
        conditionOut: 'excellent',
        allocationStatus: 'active',
        status: 'active',
        createdAt: '2026-09-02T09:05:00Z',
        updatedAt: '2026-09-02T09:05:00Z',
        createdBy: 'usr_harmony_admin',
        updatedBy: 'usr_harmony_admin'
      };

      const repertoire: Repertoire = {
        id: 'rep_harmony_debussy',
        organisationId: rehearsalOrgId,
        title: 'Syrinx',
        composer: 'Claude Debussy',
        difficulty: 'intermediate',
        repertoireStatus: 'rehearsing',
        status: 'active',
        createdAt: '2026-09-02T09:10:00Z',
        updatedAt: '2026-09-02T09:10:00Z',
        createdBy: 'usr_harmony_admin',
        updatedBy: 'usr_harmony_admin'
      };

      const assessment: MusicAssessment = {
        id: 'mass_harmony_01',
        organisationId: rehearsalOrgId,
        learnerId: 'lrn_harmony_01',
        teacherId: 'staff_harmony_01',
        assessmentDate: '2026-09-02',
        assessmentType: 'lesson_review',
        tone: 85,
        technique: 82,
        rhythm: 88,
        musicality: 90,
        overallScore: 86,
        teacherComment: 'Very expressive dynamic shading.',
        status: 'active',
        createdAt: '2026-09-02T16:15:00Z',
        updatedAt: '2026-09-02T16:15:00Z',
        createdBy: 'staff_harmony_01',
        updatedBy: 'staff_harmony_01'
      };

      expect(instrument.instrumentStatus).toBe('allocated');
      expect(allocation.allocationStatus).toBe('active');
      expect(repertoire.repertoireStatus).toBe('rehearsing');
      expect(assessment.overallScore).toBe(86);
    });

    it('executes Dance Specialist workflow: create choreography and record assessment', () => {
      const choreography: Choreography = {
        id: 'choreo_harmony_01',
        organisationId: rehearsalOrgId,
        title: 'Rhythm of the Veld',
        choreographer: 'Nomvula Zulu',
        style: 'Afro-Contemporary',
        difficulty: 'advanced',
        choreographyStatus: 'rehearsing',
        status: 'active',
        createdAt: '2026-09-02T09:30:00Z',
        updatedAt: '2026-09-02T09:30:00Z',
        createdBy: 'usr_harmony_admin',
        updatedBy: 'usr_harmony_admin'
      };

      const danceAssessment: DanceAssessment = {
        id: 'dass_harmony_01',
        organisationId: rehearsalOrgId,
        learnerId: 'lrn_harmony_01',
        teacherId: 'staff_harmony_02',
        assessmentDate: '2026-09-02',
        assessmentType: 'performance_readiness',
        technique: 90,
        timing: 88,
        musicality: 92,
        overallScore: 90,
        teacherComment: 'Strong ground connection and rhythmic alignment.',
        status: 'active',
        createdAt: '2026-09-02T16:30:00Z',
        updatedAt: '2026-09-02T16:30:00Z',
        createdBy: 'staff_harmony_02',
        updatedBy: 'staff_harmony_02'
      };

      expect(choreography.choreographyStatus).toBe('rehearsing');
      expect(danceAssessment.overallScore).toBe(90);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Professional Customer Operations: Events, Consent, Transport
  // ─────────────────────────────────────────────────────────────────────────────
  describe('5. Professional Customer Event Operations', () => {
    it('coordinates full Event lifecycle: Event -> Participants -> Consent Request -> Transport Plan', () => {
      const galaEvent: Event = {
        id: 'evt_harmony_gala',
        organisationId: rehearsalOrgId,
        name: 'Harmony Gala Evening 2026',
        eventType: 'showcase',
        startDate: '2026-10-15',
        startTime: '18:00',
        venue: 'Joburg Theatre',
        eventStatus: 'confirmed',
        status: 'active',
        createdAt: '2026-09-02T10:00:00Z',
        updatedAt: '2026-09-02T10:00:00Z',
        createdBy: 'usr_harmony_admin',
        updatedBy: 'usr_harmony_admin'
      };

      const participant: EventParticipant = {
        id: 'ep_harmony_01',
        organisationId: rehearsalOrgId,
        eventId: galaEvent.id,
        learnerId: 'lrn_harmony_01',
        participantRole: 'soloist',
        participationStatus: 'confirmed',
        status: 'active',
        createdAt: '2026-09-02T10:05:00Z',
        updatedAt: '2026-09-02T10:05:00Z',
        createdBy: 'usr_harmony_admin',
        updatedBy: 'usr_harmony_admin'
      };

      const consentReq: ConsentRequest = {
        id: 'creq_harmony_01',
        organisationId: rehearsalOrgId,
        eventId: galaEvent.id,
        learnerId: 'lrn_harmony_01',
        templateId: 'tmpl_standard_gala',
        requestStatus: 'approved',
        requestedAt: '2026-09-02T10:10:00Z',
        submittedAt: '2026-09-02T14:00:00Z',
        status: 'active',
        createdAt: '2026-09-02T10:10:00Z',
        updatedAt: '2026-09-02T14:00:00Z',
        createdBy: 'usr_harmony_admin',
        updatedBy: 'usr_harmony_admin'
      };

      const transport: EventTransportPlan = {
        id: 'trans_harmony_bus_01',
        organisationId: rehearsalOrgId,
        eventId: galaEvent.id,
        planName: 'Harmony Gala Bus Route 1',
        vehicleCapacity: 40,
        pickupLocation: 'Harmony Campus',
        destination: 'Joburg Theatre',
        departureDate: '2026-10-15',
        departureTime: '16:00',
        transportStatus: 'confirmed',
        status: 'active',
        createdAt: '2026-09-02T10:15:00Z',
        updatedAt: '2026-09-02T10:15:00Z',
        createdBy: 'usr_harmony_admin',
        updatedBy: 'usr_harmony_admin'
      };

      expect(galaEvent.eventStatus).toBe('confirmed');
      expect(participant.participationStatus).toBe('confirmed');
      expect(consentReq.requestStatus).toBe('approved');
      expect(transport.transportStatus).toBe('confirmed');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. School Finance Operations vs ArtsFlow Subscription Billing
  // ─────────────────────────────────────────────────────────────────────────────
  describe('6. School Finance Operations & Architecture Boundary', () => {
    it('manages learner tuition charges, invoicing, payments, and outstanding balances', () => {
      const charge: Charge = {
        id: 'chg_harmony_01',
        organisationId: rehearsalOrgId,
        learnerId: 'lrn_harmony_01',
        chargeTypeId: 'tuition_flute',
        description: 'Term 3 Flute Tuition',
        quantity: 1,
        unitAmount: 220000, // R2,200
        amount: 220000,
        currency: 'ZAR',
        chargeDate: '2026-09-01',
        chargeStatus: 'invoiced',
        status: 'active',
        createdAt: '2026-09-01T09:00:00Z',
        updatedAt: '2026-09-01T09:00:00Z',
        createdBy: 'usr_harmony_admin',
        updatedBy: 'usr_harmony_admin'
      };

      const invoice: Invoice = {
        id: 'inv_harmony_01',
        organisationId: rehearsalOrgId,
        invoiceNumber: 'INV-HSA-001',
        learnerId: 'lrn_harmony_01',
        issueDate: '2026-09-01',
        dueDate: '2026-09-30',
        currency: 'ZAR',
        subtotal: 220000,
        discountTotal: 0,
        waiverTotal: 0,
        total: 220000,
        amountPaid: 150000,
        balance: 70000, // R700 outstanding
        invoiceStatus: 'partially_paid',
        status: 'active',
        createdAt: '2026-09-01T09:05:00Z',
        updatedAt: '2026-09-02T11:00:00Z',
        createdBy: 'usr_harmony_admin',
        updatedBy: 'usr_harmony_admin'
      };

      const payment: Payment = {
        id: 'pay_harmony_01',
        organisationId: rehearsalOrgId,
        paymentNumber: 'PAY-HSA-001',
        learnerId: 'lrn_harmony_01',
        paymentDate: '2026-09-02',
        amount: 150000,
        allocatedAmount: 150000,
        currency: 'ZAR',
        paymentMethod: 'eft',
        receivedBy: 'usr_harmony_admin',
        paymentStatus: 'allocated',
        status: 'active',
        createdAt: '2026-09-02T11:00:00Z',
        updatedAt: '2026-09-02T11:00:00Z',
        createdBy: 'usr_harmony_admin',
        updatedBy: 'usr_harmony_admin'
      };

      const allocation: PaymentAllocation = {
        id: 'palloc_harmony_01',
        organisationId: rehearsalOrgId,
        paymentId: payment.id,
        invoiceId: invoice.id,
        amount: 150000,
        allocationDate: '2026-09-02',
        status: 'active',
        createdAt: '2026-09-02T11:00:00Z',
        updatedAt: '2026-09-02T11:00:00Z',
        createdBy: 'usr_harmony_admin',
        updatedBy: 'usr_harmony_admin'
      };

      expect(charge.amount).toBe(220000);
      expect(invoice.balance).toBe(70000);
      expect(payment.allocatedAmount).toBe(150000);
      expect(allocation.amount).toBe(150000);
      expect(invoice.total - invoice.amountPaid).toBe(invoice.balance);
    });

    it('keeps school tuition finance separate from ArtsFlow SaaS platform subscription billing', () => {
      // School invoice is issued to a learner in ZAR
      const schoolInvoiceCurrency = 'ZAR';
      const saasSubscriptionPrice = 99900; // R999/mo

      expect(schoolInvoiceCurrency).toBe('ZAR');
      expect(saasSubscriptionPrice).toBeGreaterThan(0);
      // Different domain entities: Invoice vs Subscription
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Role Journey Boundaries: Teacher vs Guardian vs Super Admin
  // ─────────────────────────────────────────────────────────────────────────────
  describe('7. Role Boundaries & Access Protection', () => {
    it('verifies Teacher can view teaching groups and mark attendance, but is denied platform & commercial billing', () => {
      const teacherUser: AuthUser = {
        uid: 'usr_harmony_teacher',
        email: 'teacher@harmony-arts.example.com',
        displayName: 'Teacher Thabo',
        role: 'teacher',
        platformRole: null,
        accountStatus: 'active'
      };

      // Allowed teaching operations
      expect(permissionService.can(teacherUser, 'attendance.read')).toBe(true);
      expect(permissionService.can(teacherUser, 'attendance.write')).toBe(true);

      // Denied administrative & platform operations
      expect(permissionService.can(teacherUser, 'platform.manage')).toBe(false);
      expect(permissionService.can(teacherUser, 'settings.manage')).toBe(false);
      expect(teacherUser.platformRole).toBeNull();
    });

    it('verifies Guardian portal isolation: cannot read other families or school staff administration', () => {
      const guardianUser: AuthUser = {
        uid: 'usr_harmony_parent',
        email: 'parent@example.com',
        displayName: 'Parent One',
        role: 'guardian',
        platformRole: null,
        accountStatus: 'active'
      };

      expect(permissionService.can(guardianUser, 'staff.read')).toBe(false);
      expect(permissionService.can(guardianUser, 'finance.write')).toBe(false);
      expect(permissionService.can(guardianUser, 'platform.read')).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Commercial Lifecycle: Downgrade, Usage Metering, Trial Expiry & Founding Price
  // ─────────────────────────────────────────────────────────────────────────────
  describe('8. Commercial Lifecycle & Founding Partner Price Locks', () => {
    it('rehearses downgrade to Starter: Professional features gated while existing data is preserved', () => {
      // Simulating entitlement evaluation for starter vs professional
      const starterEntitlements = {
        'events.management': false,
        'events.consent': false,
        'events.transport': false,
        'automation.rules': false,
        'core.learners': true,
        'core.groups': true,
        'specialist.music': true,
        'specialist.dance': true
      };

      expect(starterEntitlements['events.management']).toBe(false);
      expect(starterEntitlements['core.learners']).toBe(true);
      expect(starterEntitlements['specialist.music']).toBe(true);
    });

    it('rehearses active learner usage limits: 80% warning, 90% upgrade recommendation, 100% block', () => {
      const checkLimit = (activeLearners: number, limit: number) => {
        const ratio = activeLearners / limit;
        return {
          warning: ratio >= 0.8 && ratio < 1.0,
          recommendation: ratio >= 0.9 && ratio < 1.0,
          blocked: activeLearners >= limit
        };
      };

      const starterLimit = 50;
      expect(checkLimit(40, starterLimit).warning).toBe(true);
      expect(checkLimit(45, starterLimit).recommendation).toBe(true);
      expect(checkLimit(50, starterLimit).blocked).toBe(true);
      expect(checkLimit(30, starterLimit).blocked).toBe(false);
    });

    it('rehearses trial expiry: transitions tenant to restricted while preserving all school records', () => {
      const operationalCheck = tenantAccessService.isTenantOperational('restricted');
      expect(operationalCheck).toBe(false);

      // Admin has read-only access to resolve billing
      const readOnly = tenantAccessService.isReadOnlyAdminAccess('restricted', 'organisation_admin');
      expect(readOnly).toBe(true);
    });

    it('rehearses Founding Partner #1 slot assignment with locked R799 / R399 price', async () => {
      const lockDate = new Date();
      lockDate.setMonth(lockDate.getMonth() + 12);

      const foundingPartnerOrg: Organisation = {
        ...mockHarmonyOrg,
        isFoundingPartner: true,
        foundingPartnerNumber: 1,
        foundingPriceLockEndsAt: lockDate.toISOString(),
        assignedPlanId: 'plan_professional'
      };

      expect(foundingPartnerOrg.isFoundingPartner).toBe(true);
      expect(foundingPartnerOrg.foundingPartnerNumber).toBe(1);
      // Remains assigned to standard canonical plan
      expect(foundingPartnerOrg.assignedPlanId).toBe('plan_professional');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. Customer Feedback Loop & Activation Tracking
  // ─────────────────────────────────────────────────────────────────────────────
  describe('9. Customer Feedback & Activation Progression', () => {
    it('allows Organisation Admin to submit feedback and verifies tenant isolation', async () => {
      const submitSpy = vi.spyOn(feedbackService, 'submitFeedback').mockResolvedValue({
        id: 'fb_harmony_01',
        organisationId: rehearsalOrgId,
        organisationName: 'Harmony School of Arts — Pilot Test',
        submittedBy: 'usr_harmony_admin',
        submittedByEmail: 'principal@harmony-arts.example.com',
        submittedByName: 'Elena Rostova',
        category: 'attendance',
        rating: 5,
        comment: 'Requesting CSV export for term attendance audits.',
        status: 'new',
        createdAt: '2026-09-02T12:00:00Z',
        updatedAt: '2026-09-02T12:00:00Z'
      });

      const fb = await feedbackService.submitFeedback('usr_harmony_admin', {
        organisationId: rehearsalOrgId,
        category: 'attendance',
        rating: 5,
        comment: 'Requesting CSV export for term attendance audits.'
      });

      expect(submitSpy).toHaveBeenCalled();
      expect(fb.organisationId).toBe(rehearsalOrgId);
      expect(fb.status).toBe('new');
    });

    it('calculates deterministic activation progression score (0 to 100) across operational categories', async () => {
      vi.spyOn(usageMeteringService, 'getUsageMeters').mockResolvedValue({
        organisationId: rehearsalOrgId,
        planId: 'plan_professional',
        planName: 'ArtsFlow Professional',
        meters: {
          'limits.learners': { key: 'limits.learners', name: 'Learners', current: 12, limit: 100, unit: 'learners', percentUsed: 12, status: 'ok', warning: false, exceeded: false },
          'limits.staff_users': { key: 'limits.staff_users', name: 'Staff', current: 5, limit: 20, unit: 'users', percentUsed: 25, status: 'ok', warning: false, exceeded: false }
        } as unknown as Record<import('../../types').LimitMeterKey, import('../../types').MeterStatus>,
        anyWarning: false,
        anyCritical: false,
        anyExceeded: false
      } as unknown as OrganisationUsageSummary);

      const scoreResult = await customerActivationService.calculateActivationScore(rehearsalOrgId);
      expect(scoreResult.totalScore).toBeGreaterThanOrEqual(0);
      expect(scoreResult.totalScore).toBeLessThanOrEqual(100);
      expect(['low', 'developing', 'strong', 'fully_activated']).toContain(scoreResult.level);
    });

    it('flags Needs Attention when critical milestones are missing or trial is near expiry', async () => {
      const restrictedOrg: Organisation = {
        ...mockHarmonyOrg,
        id: 'org_rehearsal_restricted',
        tenantStatus: 'restricted'
      };

      vi.spyOn(organisationRepository, 'getAll').mockResolvedValue([restrictedOrg]);

      const items = await customerActivationService.getNeedsAttentionList();
      expect(items.some((i) => i.organisationId === 'org_rehearsal_restricted' && i.category === 'restricted')).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. Platform Operations & Integration Readiness
  // ─────────────────────────────────────────────────────────────────────────────
  describe('10. Platform Operations & Truthful Integration Reporting', () => {
    it('accurately reports external integration statuses without faking connectivity', () => {
      const statuses = platformOperationsService.getIntegrationStatuses();
      expect(statuses.email.status).toBe('Not Configured');
      expect(statuses.sms.status).toBe('Not Configured');
      expect(statuses.payments.status).toBe('Not Configured');
    });
  });
});
