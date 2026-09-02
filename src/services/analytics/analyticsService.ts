import { learnerRepository } from '../../repositories/learnerRepository';
import { enrolmentRepository } from '../../repositories/enrolmentRepository';
import { programmeRepository } from '../../repositories/programmeRepository';
import { programmeGroupRepository } from '../../repositories/programmeGroupRepository';
import { sessionRepository } from '../../repositories/sessionRepository';
import { attendanceRepository } from '../../repositories/attendanceRepository';
import { invoiceRepository } from '../../repositories/invoiceRepository';
import { paymentRepository } from '../../repositories/paymentRepository';
import { eventRepository } from '../../repositories/eventRepository';
import { eventParticipantRepository } from '../../repositories/eventParticipantRepository';
import { eventStaffRepository } from '../../repositories/eventStaffRepository';
import { eventScheduleRepository } from '../../repositories/eventScheduleRepository';
import { eventPerformanceRepository } from '../../repositories/eventPerformanceRepository';
import { consentRequestRepository } from '../../repositories/consentRequestRepository';
import { eventTransportPlanRepository } from '../../repositories/eventTransportPlanRepository';
import { transportPassengerRepository } from '../../repositories/transportPassengerRepository';
import { followUpRepository } from '../../repositories/followUpRepository';
import { operationalAlertRepository } from '../../repositories/operationalAlertRepository';

import { metricCalculations } from './metricCalculations';
import { addMoney } from '../../lib/money';
import type { 
  AnalyticsOverviewMetrics,
  LearnerAnalyticsSummary,
  ProgrammeAnalyticsSummary,
  AttendanceAnalyticsSummary,
  EventReadinessCheck,
  FinanceAgeingSummary,
  AuthRole
} from '../../types';

export const analyticsService = {
  /**
   * Executive Overview KPIs
   */
  async getOverviewMetrics(
    organisationId: string,
    startDate?: string,
    endDate?: string
  ): Promise<AnalyticsOverviewMetrics> {
    const [
      learners,
      enrolments,
      programmes,
      groups,
      sessions,
      attendance,
      events,
      invoices,
      payments,
      consents,
      followUps,
      alerts
    ] = await Promise.all([
      learnerRepository.getByOrganisation(organisationId),
      enrolmentRepository.getByOrganisation(organisationId),
      programmeRepository.getByOrganisation(organisationId),
      programmeGroupRepository.getByOrganisation(organisationId),
      sessionRepository.getByOrganisation(organisationId),
      attendanceRepository.getByOrganisation(organisationId),
      eventRepository.getByOrganisation(organisationId),
      invoiceRepository.getByOrganisation(organisationId),
      paymentRepository.getByOrganisation(organisationId),
      consentRequestRepository.getByOrganisation(organisationId),
      followUpRepository.getByOrganisation(organisationId),
      operationalAlertRepository.getByOrganisation(organisationId)
    ]);

    const todayStr = new Date().toISOString().split('T')[0];

    // Filter sessions by date range if provided
    const filteredSessions = sessions.filter(s => {
      if (s.sessionStatus === 'cancelled') return false;
      if (startDate && s.date < startDate) return false;
      if (endDate && s.date > endDate) return false;
      return true;
    });
    const sessionIds = new Set(filteredSessions.map(s => s.id));
    const filteredAttendance = attendance.filter(a => sessionIds.has(a.sessionId));

    // Filter finance by date range if provided
    const filteredInvoices = invoices.filter(inv => {
      if (inv.invoiceStatus === 'cancelled') return false;
      if (startDate && inv.issueDate < startDate) return false;
      if (endDate && inv.issueDate > endDate) return false;
      return true;
    });

    const filteredPayments = payments.filter(p => {
      if (p.paymentStatus === 'reversed') return false;
      if (startDate && p.paymentDate < startDate) return false;
      if (endDate && p.paymentDate > endDate) return false;
      return true;
    });

    const totalInvoiced = filteredInvoices.reduce((sum, inv) => addMoney(sum, inv.total), 0);
    const totalReceived = filteredPayments.reduce((sum, p) => addMoney(sum, p.amount), 0);
    const outstandingFinance = filteredInvoices.reduce((sum, inv) => addMoney(sum, inv.balance), 0);

    const activeLearners = learners.filter(l => l.learnerStatus === 'active').length;
    const activeEnrolments = enrolments.filter(e => e.enrolmentStatus === 'active').length;
    const activeProgrammes = programmes.filter(p => p.programmeStatus === 'active').length;
    const activeGroups = groups.filter(g => g.groupStatus === 'active').length;

    const upcomingEvents = events.filter(
      ev => ev.eventStatus !== 'cancelled' && ev.startDate >= todayStr
    ).length;

    const pendingConsents = consents.filter(
      c => c.requestStatus === 'pending' || c.requestStatus === 'sent'
    ).length;

    const openFollowUps = followUps.filter(
      f => f.status === 'active' || f.followUpStatus === 'open' || f.followUpStatus === 'in_progress'
    ).length;

    const activeAlerts = alerts.filter(
      a => a.alertStatus === 'active' || a.alertStatus === 'acknowledged'
    ).length;

    const attendanceRate = metricCalculations.calculateAttendanceRate(filteredAttendance);

    return {
      activeLearners,
      activeEnrolments,
      activeProgrammes,
      activeGroups,
      attendanceRate,
      sessionsHeld: filteredSessions.length,
      upcomingEvents,
      totalInvoiced,
      totalReceived,
      outstandingFinance,
      pendingConsentCount: pendingConsents,
      openFollowUpsCount: openFollowUps,
      activeAlertsCount: activeAlerts
    };
  },

  /**
   * Learner Analytics & Operational Risk Profiler
   */
  async getLearnerAnalytics(
    organisationId: string,
    startDate?: string,
    endDate?: string,
    filterProgrammeId?: string
  ): Promise<LearnerAnalyticsSummary> {
    const [
      allLearners,
      allEnrolments,
      allProgrammes,
      allSessions,
      allAttendance,
      allInvoices,
      allConsents,
      allFollowUps
    ] = await Promise.all([
      learnerRepository.getByOrganisation(organisationId),
      enrolmentRepository.getByOrganisation(organisationId),
      programmeRepository.getByOrganisation(organisationId),
      sessionRepository.getByOrganisation(organisationId),
      attendanceRepository.getByOrganisation(organisationId),
      invoiceRepository.getByOrganisation(organisationId),
      consentRequestRepository.getByOrganisation(organisationId),
      followUpRepository.getByOrganisation(organisationId)
    ]);

    const progMap = new Map(allProgrammes.map(p => [p.id, p.name]));
    const sessionDateMap = new Map(allSessions.map(s => [s.id, s.date]));

    // Multi-enrolment count
    const learnerEnrolmentCount = new Map<string, number>();
    for (const e of allEnrolments) {
      if (e.enrolmentStatus === 'active') {
        if (filterProgrammeId && e.programmeId !== filterProgrammeId) continue;
        learnerEnrolmentCount.set(e.learnerId, (learnerEnrolmentCount.get(e.learnerId) || 0) + 1);
      }
    }

    let multiEnrolled = 0;
    for (const count of learnerEnrolmentCount.values()) {
      if (count > 1) multiEnrolled += 1;
    }

    // New learners created in period
    let newLearnersCount = 0;
    for (const l of allLearners) {
      const createdDate = l.createdAt?.split('T')[0];
      if (createdDate) {
        if (startDate && createdDate < startDate) continue;
        if (endDate && createdDate > endDate) continue;
        newLearnersCount += 1;
      }
    }

    // Breakdown by programme
    const programmeCounts = new Map<string, number>();
    for (const e of allEnrolments) {
      if (e.enrolmentStatus === 'active') {
        programmeCounts.set(e.programmeId, (programmeCounts.get(e.programmeId) || 0) + 1);
      }
    }
    const byProgramme = Array.from(programmeCounts.entries()).map(([pId, count]) => ({
      programmeId: pId,
      programmeName: progMap.get(pId) || 'Unknown',
      count
    }));

    // Breakdown by status
    const byStatus: Record<string, number> = {};
    for (const l of allLearners) {
      byStatus[l.learnerStatus] = (byStatus[l.learnerStatus] || 0) + 1;
    }

    // Consecutive absences check
    const streakMap = new Map(
      metricCalculations.detectConsecutiveAbsences(allAttendance, sessionDateMap, 3).map(s => [s.learnerId, s.consecutiveCount])
    );

    // Overdue balance per learner
    const overduePerLearner = new Map<string, number>();
    const todayStr = new Date().toISOString().split('T')[0];
    for (const inv of allInvoices) {
      if (inv.invoiceStatus !== 'cancelled' && inv.balance > 0 && inv.dueDate < todayStr) {
        overduePerLearner.set(inv.learnerId, (overduePerLearner.get(inv.learnerId) || 0) + inv.balance);
      }
    }

    // At-Risk Profiler
    const atRiskLearners: LearnerAnalyticsSummary['atRiskLearners'] = [];

    for (const l of allLearners) {
      if (l.learnerStatus !== 'active') continue;
      const reasons: string[] = [];

      // Check attendance rate
      const learnerAtt = allAttendance.filter(a => a.learnerId === l.id);
      const attRate = metricCalculations.calculateAttendanceRate(learnerAtt);
      if (learnerAtt.length >= 3 && attRate < 75) {
        reasons.push(`Low attendance rate (${attRate}%)`);
      }

      // Check consecutive absences
      const streak = streakMap.get(l.id);
      if (streak && streak >= 3) {
        reasons.push(`${streak} consecutive session absences`);
      }

      // Check overdue invoices
      const overdueAmount = overduePerLearner.get(l.id);
      if (overdueAmount && overdueAmount > 0) {
        reasons.push(`Overdue account balance`);
      }

      // Check missing consent
      const hasPendingConsent = allConsents.some(
        c => c.learnerId === l.id && (c.requestStatus === 'pending' || c.requestStatus === 'sent')
      );
      if (hasPendingConsent) {
        reasons.push('Pending event consent requires signature');
      }

      // Check open follow-ups
      const openFollowUps = allFollowUps.filter(
        f => f.learnerId === l.id && (f.status === 'active' || f.followUpStatus === 'open' || f.followUpStatus === 'in_progress')
      ).length;
      if (openFollowUps > 0) {
        reasons.push(`${openFollowUps} open follow-up task(s)`);
      }

      if (reasons.length > 0) {
        atRiskLearners.push({
          learner: l,
          riskReasons: reasons,
          attendanceRate: learnerAtt.length > 0 ? attRate : undefined,
          consecutiveAbsences: streak,
          overdueFinance: overdueAmount,
          pendingConsent: hasPendingConsent,
          openFollowUps
        });
      }
    }

    return {
      totalLearners: allLearners.length,
      activeLearners: allLearners.filter(l => l.learnerStatus === 'active').length,
      inactiveLearners: allLearners.filter(l => l.learnerStatus !== 'active').length,
      newLearnersInPeriod: newLearnersCount,
      multiEnrolledCount: multiEnrolled,
      atRiskCount: atRiskLearners.length,
      byProgramme,
      byStatus,
      atRiskLearners
    };
  },

  /**
   * Programme Analytics Summary
   */
  async getProgrammeAnalytics(
    organisationId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ProgrammeAnalyticsSummary[]> {
    const [
      programmes,
      groups,
      enrolments,
      sessions,
      attendance,
      events,
      invoices
    ] = await Promise.all([
      programmeRepository.getByOrganisation(organisationId),
      programmeGroupRepository.getByOrganisation(organisationId),
      enrolmentRepository.getByOrganisation(organisationId),
      sessionRepository.getByOrganisation(organisationId),
      attendanceRepository.getByOrganisation(organisationId),
      eventRepository.getByOrganisation(organisationId),
      invoiceRepository.getByOrganisation(organisationId)
    ]);

    const results: ProgrammeAnalyticsSummary[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (const prog of programmes) {
      const progGroups = groups.filter(g => g.programmeId === prog.id);
      const progGroupIds = new Set(progGroups.map(g => g.id));

      const progEnrolments = enrolments.filter(
        e => e.programmeId === prog.id && e.enrolmentStatus === 'active'
      );
      const activeLearnerIds = new Set(progEnrolments.map(e => e.learnerId));

      // Unique teachers
      const teacherIds = new Set(progGroups.map(g => g.teacherId).filter(Boolean));

      // Sessions in period
      const progSessions = sessions.filter(s => {
        if (!progGroupIds.has(s.groupId)) return false;
        if (s.sessionStatus === 'cancelled') return false;
        if (startDate && s.date < startDate) return false;
        if (endDate && s.date > endDate) return false;
        return true;
      });
      const sessionIds = new Set(progSessions.map(s => s.id));
      const progAttendance = attendance.filter(a => sessionIds.has(a.sessionId));
      const attendanceRate = metricCalculations.calculateAttendanceRate(progAttendance);

      // Invoices for learners in this programme
      const progInvoices = invoices.filter(inv => {
        if (!activeLearnerIds.has(inv.learnerId) || inv.invoiceStatus === 'cancelled') return false;
        if (startDate && inv.issueDate < startDate) return false;
        if (endDate && inv.issueDate > endDate) return false;
        return true;
      });

      const totalInvoiced = progInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const outstandingBalance = progInvoices.reduce((sum, inv) => sum + inv.balance, 0);
      const totalReceived = progInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
      const collectionRate = metricCalculations.calculateCollectionRate(totalInvoiced, totalReceived);

      // Upcoming events for organisation in period
      const upcomingEvents = events.filter(
        ev => ev.startDate >= todayStr && ev.eventStatus !== 'cancelled'
      ).length;

      results.push({
        programmeId: prog.id,
        programmeName: prog.name,
        groupCount: progGroups.length,
        enrolmentCount: progEnrolments.length,
        activeLearners: activeLearnerIds.size,
        teacherCount: teacherIds.size,
        sessionsHeld: progSessions.length,
        attendanceRate,
        upcomingEventsCount: upcomingEvents,
        totalInvoiced,
        totalReceived,
        outstandingBalance,
        collectionRate
      });
    }

    return results;
  },

  /**
   * Attendance Analytics with Trend & Day-of-Week Patterns
   */
  async getAttendanceAnalytics(
    organisationId: string,
    startDate?: string,
    endDate?: string,
    programmeId?: string,
    groupId?: string
  ): Promise<AttendanceAnalyticsSummary> {
    const [
      allSessions,
      allAttendance,
      allGroups,
      allProgrammes,
      allLearners
    ] = await Promise.all([
      sessionRepository.getByOrganisation(organisationId),
      attendanceRepository.getByOrganisation(organisationId),
      programmeGroupRepository.getByOrganisation(organisationId),
      programmeRepository.getByOrganisation(organisationId),
      learnerRepository.getByOrganisation(organisationId)
    ]);

    const progMap = new Map(allProgrammes.map(p => [p.id, p.name]));
    const groupProgMap = new Map(allGroups.map(g => [g.id, g.programmeId]));
    const learnerMap = new Map(allLearners.map(l => [l.id, l]));

    // Filter sessions
    const sessions = allSessions.filter(s => {
      if (s.sessionStatus === 'cancelled') return false;
      if (programmeId && groupProgMap.get(s.groupId) !== programmeId) return false;
      if (groupId && s.groupId !== groupId) return false;
      if (startDate && s.date < startDate) return false;
      if (endDate && s.date > endDate) return false;
      return true;
    });

    const sessionDateMap = new Map(sessions.map(s => [s.id, s.date]));
    const sessionIds = new Set(sessions.map(s => s.id));
    const attendance = allAttendance.filter(a => sessionIds.has(a.sessionId));

    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    for (const a of attendance) {
      if (a.attendanceStatus === 'present') present += 1;
      else if (a.attendanceStatus === 'absent') absent += 1;
      else if (a.attendanceStatus === 'late') late += 1;
      else if (a.attendanceStatus === 'excused') excused += 1;
    }

    const overallRate = metricCalculations.calculateAttendanceRate(attendance);

    // Day of Week Pattern (0: Sun, 1: Mon, ..., 6: Sat)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayRecords = new Map<number, { records: typeof attendance; sessionCount: number }>();
    for (let i = 0; i < 7; i++) {
      dayRecords.set(i, { records: [], sessionCount: 0 });
    }

    for (const s of sessions) {
      const d = new Date(s.date);
      const dayIdx = d.getUTCDay();
      dayRecords.get(dayIdx)!.sessionCount += 1;
    }

    for (const a of attendance) {
      const sDate = sessionDateMap.get(a.sessionId);
      if (sDate) {
        const d = new Date(sDate);
        dayRecords.get(d.getUTCDay())?.records.push(a);
      }
    }

    const dayOfWeekPattern = Array.from(dayRecords.entries()).map(([dayIdx, data]) => ({
      day: dayNames[dayIdx],
      dayIndex: dayIdx,
      rate: metricCalculations.calculateAttendanceRate(data.records),
      sessionCount: data.sessionCount
    }));

    // Weekly Trend
    const weekMap = new Map<string, typeof attendance>();
    const weekSessionMap = new Map<string, number>();

    for (const s of sessions) {
      const d = new Date(s.date);
      // Week label: YYYY-Www or start of week
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      const weekLabel = `${year}-${month}-${day}`; // Group roughly by date/week

      weekSessionMap.set(weekLabel, (weekSessionMap.get(weekLabel) || 0) + 1);
      if (!weekMap.has(weekLabel)) {
        weekMap.set(weekLabel, []);
      }
    }

    for (const a of attendance) {
      const sDate = sessionDateMap.get(a.sessionId);
      if (sDate && weekMap.has(sDate)) {
        weekMap.get(sDate)!.push(a);
      }
    }

    const weeklyTrend = Array.from(weekMap.entries())
      .map(([label, records]) => ({
        weekLabel: label,
        rate: metricCalculations.calculateAttendanceRate(records),
        sessionCount: weekSessionMap.get(label) || 0
      }))
      .sort((a, b) => a.weekLabel.localeCompare(b.weekLabel))
      .slice(-10); // Last 10 points

    // Low Attendance Groups (< 75%)
    const lowAttendanceGroups: AttendanceAnalyticsSummary['lowAttendanceGroups'] = [];
    for (const grp of allGroups) {
      if (programmeId && grp.programmeId !== programmeId) continue;
      if (groupId && grp.id !== groupId) continue;

      const grpSessions = sessions.filter(s => s.groupId === grp.id);
      if (grpSessions.length === 0) continue;

      const grpSessionIds = new Set(grpSessions.map(s => s.id));
      const grpAttendance = attendance.filter(a => grpSessionIds.has(a.sessionId));
      const rate = metricCalculations.calculateAttendanceRate(grpAttendance);

      if (rate < 75 && grpAttendance.length > 0) {
        lowAttendanceGroups.push({
          groupId: grp.id,
          groupName: grp.name,
          programmeName: progMap.get(grp.programmeId) || 'Unknown',
          rate,
          sessionCount: grpSessions.length
        });
      }
    }

    // Consecutive Absences
    const streakList = metricCalculations.detectConsecutiveAbsences(attendance, sessionDateMap, 3);
    const consecutiveAbsenceLearners = streakList.map(s => {
      const l = learnerMap.get(s.learnerId);
      return {
        learnerId: s.learnerId,
        learnerName: l ? `${l.firstName} ${l.lastName}` : s.learnerId,
        groupName: 'Multiple / Enrolled',
        consecutiveAbsences: s.consecutiveCount,
        lastAbsenceDate: s.lastAbsenceDate
      };
    });

    return {
      sessionsHeld: sessions.length,
      attendanceRecordsCount: attendance.length,
      presentCount: present,
      absentCount: absent,
      lateCount: late,
      excusedCount: excused,
      overallAttendanceRate: overallRate,
      weeklyTrend,
      dayOfWeekPattern,
      lowAttendanceGroups,
      consecutiveAbsenceLearners
    };
  },

  /**
   * Event Analytics with Readiness Scoring
   */
  async getEventAnalytics(
    organisationId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ upcomingReadiness: EventReadinessCheck[]; completedCount: number; upcomingCount: number }> {
    const [
      allEvents,
      allParticipants,
      allConsents,
      allTransportPlans,
      allPassengers,
      allStaff,
      allScheduleItems,
      allPerformances
    ] = await Promise.all([
      eventRepository.getByOrganisation(organisationId),
      eventParticipantRepository.getByOrganisation(organisationId),
      consentRequestRepository.getByOrganisation(organisationId),
      eventTransportPlanRepository.getByOrganisation(organisationId),
      transportPassengerRepository.getByOrganisation(organisationId),
      eventStaffRepository.getByOrganisation(organisationId),
      eventScheduleRepository.getByOrganisation(organisationId),
      eventPerformanceRepository.getByOrganisation(organisationId)
    ]);

    const todayStr = new Date().toISOString().split('T')[0];

    const upcomingEvents = allEvents.filter(ev => {
      if (ev.eventStatus === 'cancelled') return false;
      if (startDate && ev.startDate < startDate) return false;
      if (endDate && ev.startDate > endDate) return false;
      return ev.startDate >= todayStr;
    });

    const completedCount = allEvents.filter(ev => ev.startDate < todayStr && ev.eventStatus !== 'cancelled').length;

    const upcomingReadiness = upcomingEvents.map(ev => {
      return metricCalculations.evaluateEventReadiness(
        ev,
        allParticipants,
        allConsents,
        allTransportPlans,
        allPassengers,
        allStaff,
        allScheduleItems,
        allPerformances
      );
    });

    return {
      upcomingReadiness,
      completedCount,
      upcomingCount: upcomingEvents.length
    };
  },

  /**
   * Finance Analytics with Role Protection & Aged Debtors
   */
  async getFinanceAnalytics(
    organisationId: string,
    startDate?: string,
    endDate?: string,
    userRole?: AuthRole
  ): Promise<{
    isRestricted: boolean;
    totalInvoiced: number;
    totalReceived: number;
    outstandingBalance: number;
    collectionRate: number;
    ageingSummary: FinanceAgeingSummary;
    programmeCollections: Array<{
      programmeName: string;
      invoiced: number;
      received: number;
      outstanding: number;
      collectionRate: number;
    }>;
  }> {
    // Role protection rule: Teachers and Viewers without finance role are restricted
    if (userRole === 'teacher' || userRole === 'viewer') {
      return {
        isRestricted: true,
        totalInvoiced: 0,
        totalReceived: 0,
        outstandingBalance: 0,
        collectionRate: 0,
        ageingSummary: { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days90Plus: 0, totalOutstanding: 0 },
        programmeCollections: []
      };
    }

    const [allInvoices, allPayments, allProgrammes, allEnrolments] = await Promise.all([
      invoiceRepository.getByOrganisation(organisationId),
      paymentRepository.getByOrganisation(organisationId),
      programmeRepository.getByOrganisation(organisationId),
      enrolmentRepository.getByOrganisation(organisationId)
    ]);

    const progMap = new Map(allProgrammes.map(p => [p.id, p.name]));
    const learnerProgMap = new Map<string, string>();
    for (const e of allEnrolments) {
      if (e.enrolmentStatus === 'active') {
        learnerProgMap.set(e.learnerId, e.programmeId);
      }
    }

    const filteredInvoices = allInvoices.filter(inv => {
      if (inv.invoiceStatus === 'cancelled') return false;
      if (startDate && inv.issueDate < startDate) return false;
      if (endDate && inv.issueDate > endDate) return false;
      return true;
    });

    const filteredPayments = allPayments.filter(p => {
      if (p.paymentStatus === 'reversed') return false;
      if (startDate && p.paymentDate < startDate) return false;
      if (endDate && p.paymentDate > endDate) return false;
      return true;
    });

    const totalInvoiced = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalReceived = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const outstandingBalance = filteredInvoices.reduce((sum, inv) => sum + inv.balance, 0);
    const collectionRate = metricCalculations.calculateCollectionRate(totalInvoiced, totalReceived);

    const ageingSummary = metricCalculations.calculateAgeingBuckets(filteredInvoices);

    // Programme collections
    const progMapData = new Map<string, { invoiced: number; received: number; outstanding: number }>();
    for (const inv of filteredInvoices) {
      const pId = learnerProgMap.get(inv.learnerId) || 'general';
      if (!progMapData.has(pId)) {
        progMapData.set(pId, { invoiced: 0, received: 0, outstanding: 0 });
      }
      const d = progMapData.get(pId)!;
      d.invoiced += inv.total;
      d.received += inv.amountPaid;
      d.outstanding += inv.balance;
    }

    const programmeCollections = Array.from(progMapData.entries()).map(([pId, d]) => ({
      programmeName: progMap.get(pId) || 'General / Unassigned',
      invoiced: d.invoiced,
      received: d.received,
      outstanding: d.outstanding,
      collectionRate: metricCalculations.calculateCollectionRate(d.invoiced, d.received)
    }));

    return {
      isRestricted: false,
      totalInvoiced,
      totalReceived,
      outstandingBalance,
      collectionRate,
      ageingSummary,
      programmeCollections
    };
  }
};
