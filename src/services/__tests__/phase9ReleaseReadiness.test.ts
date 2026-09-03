import { describe, it, expect, vi, beforeEach } from 'vitest';
import { permissionService, ALL_PERMISSIONS } from '../permissionService';
import { financeReconciliationService } from '../financeReconciliationService';
import { platformOperationsService } from '../platformOperationsService';
import { metricCalculations } from '../analytics/metricCalculations';
import { toIsoString, isSameDay, isDateOverdue } from '../../lib/datetime';
import { runDemoSeed, assertSafeEnvironment } from '../../../scripts/seed-demo';
import { runMigrations, ALL_MIGRATIONS } from '../../../scripts/migrations/runner';

import type { Invoice, Payment, PaymentAllocation, Attendance, AuthUser } from '../../types';

interface NodeProcess {
  env: Record<string, string | undefined>;
}
declare const process: NodeProcess;

vi.mock('../../lib/firebase', () => ({
  db: {},
  auth: {}
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  runTransaction: vi.fn()
}));

describe('ArtsFlow OS Phase 9 — Final Functional & Release Readiness Test Suite', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Comprehensive Role Permissions Matrix Tests (Section 23, 24, 90)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Role-Based Access Control & Permissions Matrix', () => {
    const createActor = (role: AuthUser['role']): AuthUser => ({
      uid: `user_${role}`,
      email: `${role}@artsflow.test`,
      displayName: `Test ${role}`,
      role
    });

    it('grants full administrative permissions to Super Admin and Organisation Admin', () => {
      const superAdmin = createActor('super_admin');
      const orgAdmin = createActor('organisation_admin');

      for (const p of ALL_PERMISSIONS) {
        expect(permissionService.can(superAdmin, p)).toBe(true);
        expect(permissionService.can(orgAdmin, p)).toBe(true);
      }
    });

    it('enforces that Teachers CANNOT access or mutate Finance', () => {
      const teacher = createActor('teacher');
      expect(permissionService.can(teacher, 'finance.read')).toBe(false);
      expect(permissionService.can(teacher, 'finance.write')).toBe(false);
      expect(permissionService.can(teacher, 'finance.reverse')).toBe(false);
      expect(permissionService.can(teacher, 'settings.manage')).toBe(false);
    });

    it('enforces that Finance staff CANNOT approve timesheets or mark attendance', () => {
      const financeUser = createActor('finance');
      expect(permissionService.can(financeUser, 'finance.read')).toBe(true);
      expect(permissionService.can(financeUser, 'finance.write')).toBe(true);
      expect(permissionService.can(financeUser, 'finance.reverse')).toBe(true);

      expect(permissionService.can(financeUser, 'staff.approve_timesheets')).toBe(false);
      expect(permissionService.can(financeUser, 'staff.verify_timesheets')).toBe(false);
      expect(permissionService.can(financeUser, 'attendance.write')).toBe(false);
    });

    it('enforces that Viewers have strictly read-only permissions and CANNOT write or manage anything', () => {
      const viewer = createActor('viewer');
      expect(permissionService.can(viewer, 'learners.read')).toBe(true);
      expect(permissionService.can(viewer, 'finance.read')).toBe(true);
      expect(permissionService.can(viewer, 'attendance.read')).toBe(true);

      expect(permissionService.can(viewer, 'learners.write')).toBe(false);
      expect(permissionService.can(viewer, 'attendance.write')).toBe(false);
      expect(permissionService.can(viewer, 'finance.write')).toBe(false);
      expect(permissionService.can(viewer, 'settings.manage')).toBe(false);
      expect(permissionService.can(viewer, 'automation.manage')).toBe(false);
    });

    it('enforces that Guardians and Learners have ZERO internal staff permissions', () => {
      const guardian = createActor('guardian');
      const learner = createActor('learner');

      for (const p of ALL_PERMISSIONS) {
        expect(permissionService.can(guardian, p)).toBe(false);
        expect(permissionService.can(learner, p)).toBe(false);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Finance Reconciliation & Integrity Validator (Section 14, 15, 16)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Finance Reconciliation & Mathematical Integrity', () => {
    it('validates a perfectly balanced invoice without discrepancies', () => {
      const invoice: Invoice = {
        id: 'inv_101',
        organisationId: 'org_test',
        invoiceNumber: 'INV-2026-000101',
        learnerId: 'lrn_1',
        issueDate: '2026-09-01',
        subtotal: 100000,
        discountTotal: 0,
        waiverTotal: 0,
        total: 100000, // R1000.00 in cents
        amountPaid: 100000,
        balance: 0,
        invoiceStatus: 'paid',
        dueDate: '2026-09-30',
        currency: 'ZAR',
        status: 'active',
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
        createdBy: 'admin',
        updatedBy: 'admin'
      };

      const allocations: PaymentAllocation[] = [
        {
          id: 'alloc_1',
          organisationId: 'org_test',
          paymentId: 'pay_1',
          invoiceId: 'inv_101',
          amount: 100000,
          allocationDate: '2026-09-02',
          status: 'active',
          createdAt: '2026-09-02T00:00:00.000Z',
          updatedAt: '2026-09-02T00:00:00.000Z',
          createdBy: 'admin',
          updatedBy: 'admin'
        }
      ];

      const discrepancy = financeReconciliationService.validateInvoiceIntegrity(invoice, allocations, '2026-09-02');
      expect(discrepancy).toBeNull();
    });

    it('detects and flags an invoice marked as paid that still has an outstanding balance', () => {
      const corruptInvoice: Invoice = {
        id: 'inv_corrupt',
        organisationId: 'org_test',
        invoiceNumber: 'INV-2026-000999',
        learnerId: 'lrn_1',
        issueDate: '2026-09-01',
        subtotal: 150000,
        discountTotal: 0,
        waiverTotal: 0,
        total: 150000,
        amountPaid: 50000, // Only R500 paid out of R1500
        balance: 100000,
        invoiceStatus: 'paid', // Erroneously marked paid!
        dueDate: '2026-09-30',
        currency: 'ZAR',
        status: 'active',
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
        createdBy: 'admin',
        updatedBy: 'admin'
      };

      const allocations: PaymentAllocation[] = [
        {
          id: 'alloc_part',
          organisationId: 'org_test',
          paymentId: 'pay_1',
          invoiceId: 'inv_corrupt',
          amount: 50000,
          allocationDate: '2026-09-02',
          status: 'active',
          createdAt: '2026-09-02T00:00:00.000Z',
          updatedAt: '2026-09-02T00:00:00.000Z',
          createdBy: 'admin',
          updatedBy: 'admin'
        }
      ];

      const discrepancy = financeReconciliationService.validateInvoiceIntegrity(corruptInvoice, allocations, '2026-09-02');
      expect(discrepancy).not.toBeNull();
      expect(discrepancy?.issues.some(i => i.includes('positive outstanding balance'))).toBe(true);
      expect(discrepancy?.expectedStatus).toBe('partially_paid');
    });

    it('detects and flags over-allocated payments', () => {
      const payment: Payment = {
        id: 'pay_over',
        organisationId: 'org_test',
        paymentNumber: 'PAY-2026-000001',
        currency: 'ZAR',
        amount: 50000, // R500
        allocatedAmount: 60000, // R600 allocated
        paymentMethod: 'eft',
        paymentStatus: 'allocated',
        paymentDate: '2026-09-01',
        receivedBy: 'admin',
        status: 'active',
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
        createdBy: 'admin',
        updatedBy: 'admin'
      };

      const allocations: PaymentAllocation[] = [
        {
          id: 'alloc_1',
          organisationId: 'org_test',
          paymentId: 'pay_over',
          invoiceId: 'inv_1',
          amount: 60000,
          allocationDate: '2026-09-01',
          status: 'active',
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
          createdBy: 'admin',
          updatedBy: 'admin'
        }
      ];

      const discrepancy = financeReconciliationService.validatePaymentIntegrity(payment, allocations);
      expect(discrepancy).not.toBeNull();
      expect(discrepancy?.issues.some(i => i.includes('Over-allocated'))).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Attendance Rate Formula Consistency (Section 18)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Attendance Rate Formula Consistency', () => {
    it('calculates attendance rate according to authoritative standard: (Present + Late) / (Present + Late + Absent) * 100', () => {
      const records: Attendance[] = [
        { id: '1', organisationId: 'org', sessionId: 's1', learnerId: 'l1', attendanceStatus: 'present', markedBy: 't1', status: 'active', createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' },
        { id: '2', organisationId: 'org', sessionId: 's2', learnerId: 'l1', attendanceStatus: 'present', markedBy: 't1', status: 'active', createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' },
        { id: '3', organisationId: 'org', sessionId: 's3', learnerId: 'l1', attendanceStatus: 'late', markedBy: 't1', status: 'active', createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' },
        { id: '4', organisationId: 'org', sessionId: 's4', learnerId: 'l1', attendanceStatus: 'absent', markedBy: 't1', status: 'active', createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' },
        { id: '5', organisationId: 'org', sessionId: 's5', learnerId: 'l1', attendanceStatus: 'excused', markedBy: 't1', status: 'active', createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' }
      ];

      // Eligible: 2 present + 1 late + 1 absent = 4. Excused is exempted from denominator.
      // Equivalent present: 2 present + 1 late = 3. Rate = (3 / 4) * 100 = 75.0%
      const rate = metricCalculations.calculateAttendanceRate(records);
      expect(rate).toBe(75.0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Platform Operations, Diagnostics & Safe Export (Section 12, 44, 48, 79)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Platform Operations, Diagnostics & Sanitization', () => {
    it('returns official release metadata matching v1.0.0-rc.1', () => {
      const meta = platformOperationsService.getReleaseMetadata();
      expect(meta.version).toBe('1.0.0-rc.1');
      expect(meta.platformName).toBe('ArtsFlow OS');
      expect(meta.schemaVersion).toBe(1);
    });

    it('reports integration adapter statuses with resilient fallbacks', () => {
      const statuses = platformOperationsService.getIntegrationStatuses();
      expect(statuses.email.status).toBe('Not Configured');
      expect(statuses.sms.status).toBe('Not Configured');
      expect(statuses.whatsapp.status).toBe('Connected');
      expect(statuses.payments.status).toBe('Not Configured');
      expect(statuses.calendar.status).toBe('Connected');
      expect(statuses.accounting.status).toBe('Connected');
      expect(statuses.webhooks.status).toBe('Not Configured');
    });

    it('validates learner CSV import formats and flags missing required headers', () => {
      const invalidCsv = 'email,phone\njane@test.com,+27821112222';
      const result = platformOperationsService.validateLearnerImportCsv(invalidCsv);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('firstName'))).toBe(true);

      const validCsv = 'firstName,lastName,email,dateOfBirth\nLerato,Khumalo,lerato@example.com,2010-05-12';
      const validResult = platformOperationsService.validateLearnerImportCsv(validCsv);
      expect(validResult.valid).toBe(true);
      expect(validResult.validRows.length).toBe(1);
      expect(validResult.validRows[0].firstName).toBe('Lerato');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Safe Demo Seed Production Lock (Section 57, 58)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Safe Demo Seed & Production Lock', () => {
    it('refuses demo seeding in production environment without explicit override', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalOverride = process.env.ALLOW_PRODUCTION_SEED;

      try {
        process.env.NODE_ENV = 'production';
        delete process.env.ALLOW_PRODUCTION_SEED;

        expect(() => assertSafeEnvironment()).toThrow(/FATAL SECURITY LOCK/);
      } finally {
        process.env.NODE_ENV = originalEnv;
        if (originalOverride !== undefined) {
          process.env.ALLOW_PRODUCTION_SEED = originalOverride;
        }
      }
    });

    it('executes safe dry-run demo seed in development environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'development';
        const res = await runDemoSeed(true);
        expect(res.success).toBe(true);
        expect(res.dryRun).toBe(true);
        expect(res.recordCounts.organisations).toBe(1);
        expect(res.recordCounts.programmes).toBeGreaterThan(0);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Centralized Datetime & Timezone Utilities (Section 12, 13)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Centralized Datetime & Timezone Utilities', () => {
    it('normalizes Firestore Timestamp-like objects, Dates, and ISO strings consistently', () => {
      const date = new Date('2026-09-02T14:30:00.000Z');
      const timestampLike = { seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 };
      const objWithToDate = { toDate: () => date };

      expect(toIsoString(date)).toBe(date.toISOString());
      expect(toIsoString(timestampLike)).toBe(date.toISOString());
      expect(toIsoString(objWithToDate)).toBe(date.toISOString());
    });

    it('accurately evaluates date overdue status in target organisation timezone', () => {
      // 2020 is strictly overdue
      expect(isDateOverdue('2020-01-01')).toBe(true);
      // 2099 is strictly not overdue
      expect(isDateOverdue('2099-12-31')).toBe(false);
    });

    it('accurately compares calendar days in organisation timezone', () => {
      expect(isSameDay('2026-09-02T08:00:00.000Z', '2026-09-02T20:00:00.000Z')).toBe(true);
      expect(isSameDay('2026-09-02T08:00:00.000Z', '2026-09-03T08:00:00.000Z')).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Migration Framework Dry-Run Safety (Section 60, 61, 62)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Migration Framework Safety', () => {
    it('executes migrations safely in dryRun mode without writing changes', async () => {
      const logs: string[] = [];
      const result = await runMigrations({
        dryRun: true,
        logger: msg => logs.push(msg)
      });

      expect(result.allSucceeded).toBe(true);
      expect(result.appliedMigrations).toBe(ALL_MIGRATIONS.length);
      expect(result.results[0].recordsUpdated).toBe(0); // dryRun updates 0 records
      expect(logs.some(l => l.includes('Dry run validated'))).toBe(true);
    });
  });
});
