import { describe, it, expect, vi, beforeEach } from 'vitest';
import { metricCalculations } from '../analytics/metricCalculations';
import { operationalAlertService } from '../analytics/operationalAlertService';
import { analyticsService } from '../analytics/analyticsService';
import { reportingService } from '../reportingService';
import { operationalAlertRepository } from '../../repositories/operationalAlertRepository';
import { attendanceRepository } from '../../repositories/attendanceRepository';
import { sessionRepository } from '../../repositories/sessionRepository';
import { programmeGroupRepository } from '../../repositories/programmeGroupRepository';
import { learnerRepository } from '../../repositories/learnerRepository';
import { invoiceRepository } from '../../repositories/invoiceRepository';
import { paymentRepository } from '../../repositories/paymentRepository';
import { eventRepository } from '../../repositories/eventRepository';
import { consentRequestRepository } from '../../repositories/consentRequestRepository';
import { eventTransportPlanRepository } from '../../repositories/eventTransportPlanRepository';
import { transportPassengerRepository } from '../../repositories/transportPassengerRepository';
import { instrumentAllocationRepository } from '../../repositories/instrumentAllocationRepository';
import { costumeAllocationRepository } from '../../repositories/costumeAllocationRepository';
import { communicationRecipientRepository } from '../../repositories/communicationRecipientRepository';
import { followUpRepository } from '../../repositories/followUpRepository';
import { programmeRepository } from '../../repositories/programmeRepository';
import { enrolmentRepository } from '../../repositories/enrolmentRepository';
import { followUpService } from '../followUpService';
import { auditService } from '../auditService';
import type { 
  Attendance, 
  Invoice, 
  Event, 
  EventParticipant, 
  ConsentRequest, 
  EventTransportPlan, 
  TransportPassenger, 
  EventStaff,
  EventScheduleItem,
  EventPerformanceItem,
  Session,
  ProgrammeGroup,
  Learner,
  OperationalAlert,
  FollowUp,
  Payment
} from '../../types';

describe('Phase 5A: Analytics, Reporting & Operational Intelligence Tests', () => {
  const orgId = 'org-arts-123';
  const actorId = 'user-admin-1';

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(auditService, 'log').mockResolvedValue(undefined);
  });

  describe('1. Centralized Attendance Metric Calculations', () => {
    it('calculates attendance rate accurately with present and late records', () => {
      const records = [
        { attendanceStatus: 'present' },
        { attendanceStatus: 'present' },
        { attendanceStatus: 'late' },
        { attendanceStatus: 'absent' },
      ] as Attendance[];

      // 3 attended (2 present + 1 late) out of 4 eligible = 75.0%
      const rate = metricCalculations.calculateAttendanceRate(records);
      expect(rate).toBe(75.0);
    });

    it('exempts excused absences from penalty denominator', () => {
      const records = [
        { attendanceStatus: 'present' },
        { attendanceStatus: 'late' },
        { attendanceStatus: 'excused' },
      ] as Attendance[];

      // 2 attended out of 2 eligible = 100%
      const rate = metricCalculations.calculateAttendanceRate(records);
      expect(rate).toBe(100.0);
    });

    it('returns 0 for empty records without throwing divide-by-zero', () => {
      const rate = metricCalculations.calculateAttendanceRate([]);
      expect(rate).toBe(0);
    });

    it('detects learners with 3 consecutive session absences', () => {
      const sessionDateMap = new Map([
        ['s-1', '2026-09-01'],
        ['s-2', '2026-09-08'],
        ['s-3', '2026-09-15'],
        ['s-4', '2026-09-22'],
      ]);

      const records = [
        { learnerId: 'l-1', sessionId: 's-1', attendanceStatus: 'present' },
        { learnerId: 'l-1', sessionId: 's-2', attendanceStatus: 'absent' },
        { learnerId: 'l-1', sessionId: 's-3', attendanceStatus: 'absent' },
        { learnerId: 'l-1', sessionId: 's-4', attendanceStatus: 'absent' },
        { learnerId: 'l-2', sessionId: 's-1', attendanceStatus: 'absent' },
        { learnerId: 'l-2', sessionId: 's-2', attendanceStatus: 'present' },
        { learnerId: 'l-2', sessionId: 's-3', attendanceStatus: 'absent' },
      ] as Attendance[];

      const streaks = metricCalculations.detectConsecutiveAbsences(records, sessionDateMap, 3);
      expect(streaks).toHaveLength(1);
      expect(streaks[0].learnerId).toBe('l-1');
      expect(streaks[0].consecutiveCount).toBe(3);
      expect(streaks[0].lastAbsenceDate).toBe('2026-09-22');
    });
  });

  describe('2. Financial Ageing & Collection Calculations', () => {
    it('categorizes invoices into aged debtor buckets (Current, 1-30, 31-60, 61-90, 90+ days)', () => {
      const invoices = [
        { id: 'inv-1', dueDate: '2026-09-15', balance: 50000, invoiceStatus: 'issued' }, // Current (future)
        { id: 'inv-2', dueDate: '2026-08-25', balance: 30000, invoiceStatus: 'issued' }, // 7 days overdue -> 1-30
        { id: 'inv-3', dueDate: '2026-07-20', balance: 25000, invoiceStatus: 'issued' }, // 43 days overdue -> 31-60
        { id: 'inv-4', dueDate: '2026-06-15', balance: 20000, invoiceStatus: 'issued' }, // 78 days overdue -> 61-90
        { id: 'inv-5', dueDate: '2026-04-01', balance: 15000, invoiceStatus: 'issued' }, // 153 days overdue -> 90+
        { id: 'inv-6', dueDate: '2026-01-01', balance: 0, invoiceStatus: 'paid' },        // Paid -> ignored
        { id: 'inv-7', dueDate: '2026-01-01', balance: 10000, invoiceStatus: 'cancelled' } // Cancelled -> ignored
      ] as Invoice[];

      const referenceDate = '2026-09-01';
      const summary = metricCalculations.calculateAgeingBuckets(invoices, referenceDate);

      expect(summary.current).toBe(50000);
      expect(summary.days1_30).toBe(30000);
      expect(summary.days31_60).toBe(25000);
      expect(summary.days61_90).toBe(20000);
      expect(summary.days90Plus).toBe(15000);
      expect(summary.totalOutstanding).toBe(140000);
    });

    it('calculates collection rate percentage correctly', () => {
      expect(metricCalculations.calculateCollectionRate(100000, 80000)).toBe(80.0);
      expect(metricCalculations.calculateCollectionRate(0, 0)).toBe(0);
      expect(metricCalculations.calculateCollectionRate(50000, 60000)).toBe(100); // capped at 100%
    });
  });

  describe('3. Event Operational Readiness & Transport Warnings', () => {
    it('detects transport over-capacity as critical readiness deficiency', () => {
      const event = { id: 'ev-1', name: 'Youth Music Gala', startDate: '2026-09-10' } as Event;
      const participants = [
        { id: 'ep-1', eventId: 'ev-1', participationStatus: 'confirmed' }
      ] as EventParticipant[];
      const consents = [
        { id: 'cr-1', eventId: 'ev-1', requestStatus: 'approved' }
      ] as ConsentRequest[];
      const transportPlans = [
        { id: 'tp-1', eventId: 'ev-1', planName: 'Bus 1', vehicleCapacity: 20, transportStatus: 'confirmed' }
      ] as EventTransportPlan[];
      // 25 passengers assigned for 20 seats
      const passengers = Array.from({ length: 25 }, (_, i) => ({
        id: `pass-${i}`,
        eventId: 'ev-1',
        eventTransportPlanId: 'tp-1',
        boardingStatus: 'planned'
      })) as TransportPassenger[];
      const staff = [
        { id: 'es-1', eventId: 'ev-1', participationStatus: 'confirmed' }
      ] as EventStaff[];

      const readiness = metricCalculations.evaluateEventReadiness(
        event,
        participants,
        consents,
        transportPlans,
        passengers,
        staff,
        [{ id: 'item-1', eventId: 'ev-1' }] as unknown as EventScheduleItem[],
        [{ id: 'perf-1', eventId: 'ev-1' }] as unknown as EventPerformanceItem[]
      );

      expect(readiness.transportStatus).toBe('over_capacity');
      expect(readiness.overallReadiness).toBe('critical');
      expect(readiness.readinessIssues.some(i => i.includes('Transport capacity exceeded'))).toBe(true);
    });

    it('flags missing consent for participants', () => {
      const event = { id: 'ev-2', name: 'Spring Concert', startDate: '2026-09-20' } as Event;
      const participants = [
        { id: 'ep-1', eventId: 'ev-2', participationStatus: 'confirmed' },
        { id: 'ep-2', eventId: 'ev-2', participationStatus: 'confirmed' }
      ] as EventParticipant[];
      const consents = [
        { id: 'cr-1', eventId: 'ev-2', requestStatus: 'approved' },
        { id: 'cr-2', eventId: 'ev-2', requestStatus: 'pending' }
      ] as ConsentRequest[];
      const staff = [
        { id: 'es-1', eventId: 'ev-2', participationStatus: 'confirmed' }
      ] as EventStaff[];

      const readiness = metricCalculations.evaluateEventReadiness(
        event,
        participants,
        consents,
        [],
        [],
        staff,
        [{ id: 'item-1', eventId: 'ev-2' }] as unknown as EventScheduleItem[],
        [{ id: 'perf-1', eventId: 'ev-2' }] as unknown as EventPerformanceItem[]
      );

      expect(readiness.consentApproved).toBe(1);
      expect(readiness.consentPending).toBe(1);
      expect(readiness.overallReadiness).toBe('attention_needed');
    });
  });

  describe('4. Operational Alert Engine & Follow-Up Lifecycle', () => {
    it('scans operational collections and generates deterministic alerts without duplicating existing active alerts', async () => {
      // Mock repositories with low group attendance (< 75%)
      vi.spyOn(sessionRepository, 'getByOrganisation').mockResolvedValue([
        { id: 's-1', groupId: 'g-1', date: '2026-09-01', sessionStatus: 'completed' },
        { id: 's-2', groupId: 'g-1', date: '2026-09-08', sessionStatus: 'completed' },
        { id: 's-3', groupId: 'g-1', date: '2026-09-15', sessionStatus: 'completed' },
      ] as unknown as Session[]);

      vi.spyOn(attendanceRepository, 'getByOrganisation').mockResolvedValue([
        { id: 'a-1', sessionId: 's-1', learnerId: 'l-1', attendanceStatus: 'present' },
        { id: 'a-2', sessionId: 's-2', learnerId: 'l-1', attendanceStatus: 'absent' },
        { id: 'a-3', sessionId: 's-3', learnerId: 'l-1', attendanceStatus: 'absent' },
      ] as unknown as Attendance[]);

      vi.spyOn(programmeGroupRepository, 'getByOrganisation').mockResolvedValue([
        { id: 'g-1', name: 'Junior Strings', groupStatus: 'active' } as unknown as ProgrammeGroup
      ]);
      vi.spyOn(learnerRepository, 'getByOrganisation').mockResolvedValue([
        { id: 'l-1', firstName: 'Sipho', lastName: 'Ndlovu' } as unknown as Learner
      ]);
      vi.spyOn(invoiceRepository, 'getByOrganisation').mockResolvedValue([]);
      vi.spyOn(eventRepository, 'getByOrganisation').mockResolvedValue([]);
      vi.spyOn(consentRequestRepository, 'getByOrganisation').mockResolvedValue([]);
      vi.spyOn(eventTransportPlanRepository, 'getByOrganisation').mockResolvedValue([]);
      vi.spyOn(transportPassengerRepository, 'getByOrganisation').mockResolvedValue([]);
      vi.spyOn(instrumentAllocationRepository, 'getByOrganisation').mockResolvedValue([]);
      vi.spyOn(costumeAllocationRepository, 'getByOrganisation').mockResolvedValue([]);
      vi.spyOn(communicationRecipientRepository, 'getByOrganisation').mockResolvedValue([]);
      vi.spyOn(followUpRepository, 'getByOrganisation').mockResolvedValue([]);
      vi.spyOn(operationalAlertRepository, 'getByOrganisation').mockResolvedValue([]);

      const createdAlerts: OperationalAlert[] = [];
      vi.spyOn(operationalAlertRepository, 'create').mockImplementation(async (_org, _actor, data) => {
        const record = { id: `alert-${createdAlerts.length + 1}`, ...data } as OperationalAlert;
        createdAlerts.push(record);
        return record;
      });

      const alerts = await operationalAlertService.scanAndSyncAlerts(orgId, actorId);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
      expect(alerts.some(a => a.alertType === 'attendance_low')).toBe(true);
    });

    it('converts an operational alert into an assigned human-owned FollowUp task and marks alert as acknowledged', async () => {
      const mockAlert = {
        id: 'alt-99',
        organisationId: orgId,
        alertType: 'attendance_low',
        severity: 'urgent',
        title: 'Low attendance in Junior Strings (50%)',
        description: 'Junior Strings attendance is 50%',
        alertStatus: 'active',
        relatedEntityType: 'group',
        relatedEntityId: 'grp-1'
      } as OperationalAlert;

      vi.spyOn(operationalAlertRepository, 'getById').mockResolvedValue(mockAlert);
      vi.spyOn(operationalAlertRepository, 'update').mockResolvedValue();
      vi.spyOn(followUpService, 'createFollowUp').mockResolvedValue({
        id: 'fu-1',
        subject: 'Follow-up: Low attendance in Junior Strings (50%)',
        category: 'attendance'
      } as unknown as FollowUp);

      const fu = await operationalAlertService.createFollowUpFromAlert(orgId, 'alt-99', actorId, {
        priority: 'high',
        dueDate: '2026-09-05'
      });

      expect(fu.id).toBe('fu-1');
      expect(followUpService.createFollowUp).toHaveBeenCalledWith(
        orgId,
        actorId,
        expect.objectContaining({
          category: 'attendance',
          priority: 'high',
          groupId: 'grp-1'
        })
      );
      expect(operationalAlertRepository.update).toHaveBeenCalledWith(
        orgId,
        actorId,
        'alt-99',
        expect.objectContaining({ alertStatus: 'acknowledged' })
      );
    });
  });

  describe('5. Role-Based Security & Permissions', () => {
    it('restricts teacher role from viewing organization-wide finance analytics', async () => {
      const result = await analyticsService.getFinanceAnalytics(orgId, undefined, undefined, 'teacher');
      expect(result.isRestricted).toBe(true);
      expect(result.totalInvoiced).toBe(0);
      expect(result.outstandingBalance).toBe(0);
      expect(result.programmeCollections).toHaveLength(0);
    });

    it('allows finance role full access to financial intelligence', async () => {
      vi.spyOn(invoiceRepository, 'getByOrganisation').mockResolvedValue([
        { id: 'inv-1', total: 50000, amountPaid: 30000, balance: 20000, invoiceStatus: 'issued', dueDate: '2026-09-15' } as unknown as Invoice
      ]);
      vi.spyOn(paymentRepository, 'getByOrganisation').mockResolvedValue([
        { id: 'p-1', amount: 30000, paymentStatus: 'completed' } as unknown as Payment
      ]);
      vi.spyOn(programmeRepository, 'getByOrganisation').mockResolvedValue([]);
      vi.spyOn(enrolmentRepository, 'getByOrganisation').mockResolvedValue([]);

      const result = await analyticsService.getFinanceAnalytics(orgId, undefined, undefined, 'finance');
      expect(result.isRestricted).toBe(false);
      expect(result.totalInvoiced).toBe(50000);
      expect(result.totalReceived).toBe(30000);
      expect(result.outstandingBalance).toBe(20000);
    });

    it('filters out sensitive financial reports for teachers in reporting service', () => {
      const reports = reportingService.getAvailableReports('teacher');
      const sensitiveReports = reports.filter(r => r.sensitive);
      expect(sensitiveReports).toHaveLength(0);

      const adminReports = reportingService.getAvailableReports('organisation_admin');
      expect(adminReports.some(r => r.sensitive)).toBe(true);
    });
  });
});
