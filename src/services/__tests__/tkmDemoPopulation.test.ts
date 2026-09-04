import { describe, it, expect } from 'vitest';
import {
  TKM_DEMO_ORGANISATION_ID,
  FORBIDDEN_PILOT_ORGANISATION_ID,
  TKM_DEMO_DATA,
  TKM_LEARNERS_RAW,
  computeTkmSeedSummary,
  runTkmDemoSeed,
  assertTkmSafeEnvironment
} from '../../../scripts/seed-tkm-demo';
import { commercialAnalyticsService } from '../platform/commercialAnalyticsService';
import { platformMetricsService } from '../platformMetricsService';
import type { Organisation, Subscription, OrganisationUsage } from '../../types';

describe('ArtsFlow OS — TKM Master Register Demo Population Test Suite', () => {
  describe('1. Source Dataset Integrity & Master Register Counts', () => {
    it('contains exactly 46 learners matching the Consolidated TKM Master Student Database', () => {
      expect(TKM_LEARNERS_RAW.length).toBe(46);
      expect(TKM_DEMO_DATA.learners.length).toBe(46);
    });

    it('preserves the exact source status distribution (28 Active, 6 Pending, 8 Verify, 2 Unconfirmed, 2 Inactive)', () => {
      const summary = computeTkmSeedSummary();
      expect(summary.learners).toBe(46);
      expect(summary.active).toBe(28);
      expect(summary.pending).toBe(6);
      expect(summary.verify).toBe(8);
      expect(summary.unconfirmed).toBe(2);
      expect(summary.inactive).toBe(2);
    });

    it('ensures every learner has a unique deterministic ID with no duplicates', () => {
      const learnerIds = TKM_DEMO_DATA.learners.map((l) => l.id);
      const uniqueIds = new Set(learnerIds);
      expect(uniqueIds.size).toBe(46);

      // Verify ID pattern
      for (const id of learnerIds) {
        expect(id).toMatch(/^tkm_demo_lrn_\d{3}$/);
      }
    });

    it('preserves source verification notes for all pending, verify, and unconfirmed records', () => {
      const verifyRecords = TKM_DEMO_DATA.learners.filter(
        (l) => l.sourceRegistryStatus === 'VERIFY' ||
               l.sourceRegistryStatus === 'PENDING' ||
               l.sourceRegistryStatus === 'UNCONFIRMED DETAILS'
      );

      expect(verifyRecords.length).toBe(16); // 6 pending + 8 verify + 2 unconfirmed = 16
      for (const rec of verifyRecords) {
        expect(rec.requiresVerification).toBe(true);
        expect(rec.verificationNote).toBeDefined();
        expect(rec.verificationNote?.length).toBeGreaterThan(0);
        expect(rec.learnerStatus).toBe('pending');
      }
    });

    it('marks active records with requiresVerification = false and learnerStatus = active', () => {
      const activeRecords = TKM_DEMO_DATA.learners.filter((l) => l.sourceRegistryStatus === 'ACTIVE');
      expect(activeRecords.length).toBe(28);
      for (const rec of activeRecords) {
        expect(rec.requiresVerification).toBe(false);
        expect(rec.learnerStatus).toBe('active');
        expect(rec.status).toBe('active');
      }
    });

    it('marks inactive records with learnerStatus = inactive and status = inactive', () => {
      const inactiveRecords = TKM_DEMO_DATA.learners.filter((l) => l.sourceRegistryStatus === 'INACTIVE');
      expect(inactiveRecords.length).toBe(2);
      for (const rec of inactiveRecords) {
        expect(rec.learnerStatus).toBe('inactive');
        expect(rec.status).toBe('inactive');
      }
    });
  });

  describe('2. Privacy & Non-PII Safeguards', () => {
    it('contains zero parent or guardian phone numbers, real emails, or ID numbers on learners', () => {
      for (const learner of TKM_DEMO_DATA.learners) {
        expect((learner as unknown as Record<string, unknown>).phone).toBeUndefined();
        expect((learner as unknown as Record<string, unknown>).email).toBeUndefined();
        expect((learner as unknown as Record<string, unknown>).idNumber).toBeUndefined();
        expect((learner as unknown as Record<string, unknown>).medicalNotes).toBeUndefined();
        expect((learner as unknown as Record<string, unknown>).address).toBeUndefined();
      }
    });

    it('uses only clearly fictional dummy guardian accounts with example.com domains', () => {
      for (const guardian of TKM_DEMO_DATA.guardians) {
        expect(guardian.email).toContain('@example.com');
        expect(guardian.firstName).toContain('Demo Guardian');
        expect(guardian.isDemoRecord).toBe(true);
      }
    });
  });

  describe('3. Multi-Enrolment Architecture & Groups', () => {
    it('enforces ONE learner record -> MULTIPLE enrolments without creating duplicate learners', () => {
      // Tokelo Ntlhoka (#8) has 2 enrolments: Violin and Viola
      const tokeloEnrolments = TKM_DEMO_DATA.enrolments.filter((e) => e.learnerId === 'tkm_demo_lrn_008');
      expect(tokeloEnrolments.length).toBe(2);

      const groupIds = tokeloEnrolments.map((e) => e.groupId);
      expect(groupIds).toContain('grp_tkm_violin');
      expect(groupIds).toContain('grp_tkm_viola');

      // Still only 1 learner record in learners array
      const tokeloLearnerRecords = TKM_DEMO_DATA.learners.filter((l) => l.id === 'tkm_demo_lrn_008');
      expect(tokeloLearnerRecords.length).toBe(1);
    });

    it('creates co-requisite Theory and Youth Orchestra enrolments for selected active players', () => {
      const lehakweEnrolments = TKM_DEMO_DATA.enrolments.filter((e) => e.learnerId === 'tkm_demo_lrn_001');
      // Lehakwe: Violin primary + Theory + Orchestra = 3 enrolments
      expect(lehakweEnrolments.length).toBe(3);
      const groupIds = lehakweEnrolments.map((e) => e.groupId);
      expect(groupIds).toContain('grp_tkm_violin');
      expect(groupIds).toContain('grp_tkm_theory');
      expect(groupIds).toContain('grp_tkm_orchestra');
    });

    it('contains all required TKM teaching streams and classes', () => {
      const groupIds = TKM_DEMO_DATA.groups.map((g) => g.id);
      expect(groupIds).toContain('grp_tkm_violin');
      expect(groupIds).toContain('grp_tkm_viola');
      expect(groupIds).toContain('grp_tkm_cello');
      expect(groupIds).toContain('grp_tkm_flute');
      expect(groupIds).toContain('grp_tkm_clarinet');
      expect(groupIds).toContain('grp_tkm_trumpet');
      expect(groupIds).toContain('grp_tkm_marimba');
      expect(groupIds).toContain('grp_tkm_recorder');
      expect(groupIds).toContain('grp_tkm_theory');
      expect(groupIds).toContain('grp_tkm_dance');
      expect(groupIds).toContain('grp_tkm_orchestra');
    });
  });

  describe('4. Staff Structure & Operational Mappings', () => {
    it('populates known operational staff structure as non-login demo records', () => {
      expect(TKM_DEMO_DATA.staff.length).toBe(15);
      const names = TKM_DEMO_DATA.staff.map((s) => `${s.firstName} ${s.lastName}`);

      expect(names).toContain('Innocent Mokoena');
      expect(names).toContain('Never Bandarasi');
      expect(names).toContain('Thokozani Mazibuko');
      expect(names).toContain('Thoko Thotobolo');
      expect(names).toContain('Nqobile Mhlungu');
      expect(names).toContain('Gloria Boyi');
      expect(names).toContain('Vusi Hlatshwayo');
      expect(names).toContain('Bongani Kunene');
      expect(names).toContain('William Nobela');
      expect(names).toContain('Gontse Segona');
      expect(names).toContain('Nkuli Shiburi');
      expect(names).toContain('Nomonde Kubeka');
      expect(names).toContain('Thami Masoka');
      expect(names).toContain('Isaac Molelekoa');
      expect(names).toContain('Mpande Maseko');

      for (const s of TKM_DEMO_DATA.staff) {
        expect(s.isDemoRecord).toBe(true);
        expect(s.email).toContain('@thabang-ka-mmino.example.com');
      }
    });

    it('correctly maps teacher specialisations to groups', () => {
      const fluteGroup = TKM_DEMO_DATA.groups.find((g) => g.id === 'grp_tkm_flute');
      expect(fluteGroup?.teacherId).toBe('staff_tkm_nqobile');

      const clarinetGroup = TKM_DEMO_DATA.groups.find((g) => g.id === 'grp_tkm_clarinet');
      expect(clarinetGroup?.teacherId).toBe('staff_tkm_thoko');

      const celloGroup = TKM_DEMO_DATA.groups.find((g) => g.id === 'grp_tkm_cello');
      expect(celloGroup?.teacherId).toBe('staff_tkm_bongani');

      const danceGroup = TKM_DEMO_DATA.groups.find((g) => g.id === 'grp_tkm_dance');
      expect(danceGroup?.teacherId).toBe('staff_tkm_thami');

      const recorderGroup = TKM_DEMO_DATA.groups.find((g) => g.id === 'grp_tkm_recorder');
      expect(recorderGroup?.teacherId).toBe('staff_tkm_nkuli');
    });
  });

  describe('5. Demo Instruments, Sessions, Attendance & Repertoire', () => {
    it('flags all demo instruments with isDemoAsset = true and unique asset numbers', () => {
      expect(TKM_DEMO_DATA.instruments.length).toBe(7);
      for (const inst of TKM_DEMO_DATA.instruments) {
        expect(inst.isDemoAsset).toBe(true);
        expect(inst.isDemoRecord).toBe(true);
        expect(inst.assetNumber).toMatch(/^TKM-DEMO-[A-Z]{3}-001$/);
      }
    });

    it('allocates demo instruments to demo learners with valid references', () => {
      expect(TKM_DEMO_DATA.instrumentAllocations.length).toBe(6);
      for (const alloc of TKM_DEMO_DATA.instrumentAllocations) {
        expect(alloc.isDemoRecord).toBe(true);
        const learnerExists = TKM_DEMO_DATA.learners.some((l) => l.id === alloc.learnerId);
        const instrumentExists = TKM_DEMO_DATA.instruments.some((i) => i.id === alloc.instrumentId);
        expect(learnerExists).toBe(true);
        expect(instrumentExists).toBe(true);
      }
    });

    it('marks attendance only on completed past demo sessions', () => {
      for (const att of TKM_DEMO_DATA.attendance) {
        expect(att.isDemoRecord).toBe(true);
        const session = TKM_DEMO_DATA.sessions.find((s) => s.id === att.sessionId);
        expect(session).toBeDefined();
        expect(session?.sessionStatus).toBe('completed');
        expect(['present', 'late', 'excused', 'absent']).toContain(att.attendanceStatus);
      }
    });

    it('flags showcase events and sample finance records as demo records', () => {
      expect(TKM_DEMO_DATA.events.length).toBeGreaterThan(0);
      for (const evt of TKM_DEMO_DATA.events) {
        expect(evt.isDemoRecord).toBe(true);
      }

      for (const chg of TKM_DEMO_DATA.charges) {
        expect(chg.isDemoRecord).toBe(true);
      }

      for (const inv of TKM_DEMO_DATA.invoices) {
        expect(inv.isDemoRecord).toBe(true);
      }

      for (const pay of TKM_DEMO_DATA.payments) {
        expect(pay.isDemoRecord).toBe(true);
      }
    });
  });

  describe('6. Security Locks & Real Tenant Protection', () => {
    it('strictly isolates demo organisation as org_demo_tkm', () => {
      expect(TKM_DEMO_ORGANISATION_ID).toBe('org_demo_tkm');
      expect(TKM_DEMO_DATA.organisation.id).toBe('org_demo_tkm');
      expect(TKM_DEMO_DATA.organisation.isDemoTenant).toBe(true);
    });

    it('strictly forbids targeting org_tkm_pilot or any real customer tenant', () => {
      expect(FORBIDDEN_PILOT_ORGANISATION_ID).toBe('org_tkm_pilot');
      expect(TKM_DEMO_ORGANISATION_ID).not.toBe(FORBIDDEN_PILOT_ORGANISATION_ID);
    });

    it('throws error in production environment without explicit ALLOW_PRODUCTION_SEED=true override', () => {
      const origEnv = process.env.NODE_ENV;
      const origAllow = process.env.ALLOW_PRODUCTION_SEED;

      try {
        process.env.NODE_ENV = 'production';
        process.env.ALLOW_PRODUCTION_SEED = 'false';

        expect(() => {
          assertTkmSafeEnvironment({ allowProdOverride: false });
        }).toThrow(/FATAL SECURITY LOCK/);
      } finally {
        process.env.NODE_ENV = origEnv;
        process.env.ALLOW_PRODUCTION_SEED = origAllow;
      }
    });

    it('executes dry-run seed successfully and returns verified record summary', async () => {
      const result = await runTkmDemoSeed(true);
      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.organisationId).toBe('org_demo_tkm');
      expect(result.summary.learners).toBe(46);
      expect(result.summary.active).toBe(28);
      expect(result.summary.pending).toBe(6);
      expect(result.summary.verify).toBe(8);
      expect(result.summary.unconfirmed).toBe(2);
      expect(result.summary.inactive).toBe(2);
    });
  });

  describe('7. Commercial Analytics Exclusion', () => {
    it('strictly excludes org_demo_tkm from commercial analytics MRR, ARR, and paid counts', async () => {
      const mockOrgs: Organisation[] = [
        {
          id: 'org_paying_cust',
          organisationId: 'org_paying_cust',
          name: 'Paying Academy',
          isDemoTenant: false,
          tenantStatus: 'active',
          status: 'active',
          organisationType: 'music',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'admin',
          updatedBy: 'admin'
        },
        {
          id: 'org_demo_tkm',
          organisationId: 'org_demo_tkm',
          name: 'TKM Demo — Thabang Ka Mmino',
          isDemoTenant: true,
          tenantStatus: 'active',
          status: 'active',
          organisationType: 'community_arts',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'admin',
          updatedBy: 'admin'
        }
      ];

      const mockSubs: Subscription[] = [
        {
          id: 'sub_paying',
          organisationId: 'org_paying_cust',
          planId: 'plan_professional',
          subscriptionStatus: 'active',
          priceAmount: 85000, // ZAR 850.00
          currency: 'ZAR',
          billingInterval: 'monthly',
          billingMode: 'provider',
          cancelAtPeriodEnd: false,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
          updatedBy: 'system'
        },
        {
          id: 'sub_tkm_demo',
          organisationId: 'org_demo_tkm',
          planId: 'plan_professional',
          subscriptionStatus: 'active',
          priceAmount: 85000,
          currency: 'ZAR',
          billingInterval: 'monthly',
          billingMode: 'complimentary',
          cancelAtPeriodEnd: false,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
          updatedBy: 'system'
        }
      ];

      const mockUsages: OrganisationUsage[] = [];
      const mockPlans = [
        {
          id: 'plan_professional',
          name: 'Professional',
          tier: 'professional' as const,
          billingInterval: 'monthly' as const,
          priceAmount: 85000,
          currency: 'ZAR',
          status: 'active' as const,
          limits: {
            maxLearners: 100,
            maxStaffUsers: 10,
            storageBytes: 10 * 1024 * 1024 * 1024,
            monthlyCommunications: 1000,
            customBranding: true,
            advancedReporting: true,
            prioritySupport: true,
            guardianPortalAccess: true
          }
        }
      ];

      const metrics = commercialAnalyticsService.calculateCommercialAnalytics(
        mockOrgs,
        mockSubs,
        mockUsages,
        mockPlans as unknown as import('../../types').SubscriptionPlan[]
      );

      // Total MRR should only include the paying customer (85000 cents), not org_demo_tkm
      expect(metrics.mrr).toBe(85000);
      expect(metrics.activePaidSubscriptions).toBe(1);
    });

    it('excludes org_demo_tkm from commercial customer count in platform metrics', () => {
      const mockOrgs: Organisation[] = [
        {
          id: 'org_commercial_1',
          name: 'Commercial School',
          isDemoTenant: false,
          tenantStatus: 'active',
          status: 'active',
          organisationId: 'org_commercial_1',
          organisationType: 'music',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'admin',
          updatedBy: 'admin'
        },
        {
          id: 'org_demo_tkm',
          name: 'TKM Demo',
          isDemoTenant: true,
          tenantStatus: 'active',
          status: 'active',
          organisationId: 'org_demo_tkm',
          organisationType: 'community_arts',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'admin',
          updatedBy: 'admin'
        }
      ];

      const metrics = platformMetricsService.computeKPIs(mockOrgs, [], 5);
      expect(metrics.customerOrganisations).toBe(1);
      expect(metrics.demoOrganisations).toBe(1);
    });
  });
});
