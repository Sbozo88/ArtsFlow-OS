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
  EventReadinessCheck,
  FinanceAgeingSummary 
} from '../../types';

export const metricCalculations = {
  /**
   * Centralized Attendance Rate Formula:
   * Rate = (Present + Late) / (Present + Late + Absent) * 100
   * Excused absences are exempted from penalty.
   * If there are no eligible records, returns 0.
   */
  calculateAttendanceRate(records: Attendance[]): number {
    if (!records || records.length === 0) return 0;

    let presentEquivalent = 0;
    let eligible = 0;

    for (const r of records) {
      if (r.attendanceStatus === 'present' || r.attendanceStatus === 'late') {
        presentEquivalent += 1;
        eligible += 1;
      } else if (r.attendanceStatus === 'absent') {
        eligible += 1;
      }
      // 'excused' does not increase eligible count (exempted from denominator)
    }

    if (eligible === 0) {
      // If only excused records exist, treat as 100% compliant
      return records.some(r => r.attendanceStatus === 'excused') ? 100 : 0;
    }

    return Math.round((presentEquivalent / eligible) * 1000) / 10;
  },

  /**
   * Detects learners with >= threshold (default 3) consecutive absences.
   * Sorts records chronologically and counts trailing or consecutive runs.
   */
  detectConsecutiveAbsences(
    records: Attendance[],
    sessionDateMap: Map<string, string>,
    threshold: number = 3
  ): Array<{ learnerId: string; consecutiveCount: number; lastAbsenceDate?: string }> {
    const learnerMap = new Map<string, Attendance[]>();

    for (const r of records) {
      if (!learnerMap.has(r.learnerId)) {
        learnerMap.set(r.learnerId, []);
      }
      learnerMap.get(r.learnerId)!.push(r);
    }

    const results: Array<{ learnerId: string; consecutiveCount: number; lastAbsenceDate?: string }> = [];

    for (const [learnerId, list] of learnerMap.entries()) {
      // Sort by session date ascending
      list.sort((a, b) => {
        const dateA = sessionDateMap.get(a.sessionId) || a.createdAt;
        const dateB = sessionDateMap.get(b.sessionId) || b.createdAt;
        return dateA.localeCompare(dateB);
      });

      let currentStreak = 0;
      let maxStreak = 0;
      let lastDate: string | undefined;

      for (const item of list) {
        if (item.attendanceStatus === 'absent') {
          currentStreak += 1;
          lastDate = sessionDateMap.get(item.sessionId) || item.createdAt.split('T')[0];
          if (currentStreak > maxStreak) {
            maxStreak = currentStreak;
          }
        } else if (item.attendanceStatus === 'present' || item.attendanceStatus === 'late') {
          currentStreak = 0;
        }
        // Excused does not break streak or increment it
      }

      if (maxStreak >= threshold) {
        results.push({
          learnerId,
          consecutiveCount: maxStreak,
          lastAbsenceDate: lastDate
        });
      }
    }

    return results;
  },

  /**
   * Computes Aged Debtors buckets for outstanding invoices based on due date.
   * Current (<= 0 days overdue), 1–30 Days, 31–60 Days, 61–90 Days, 90+ Days.
   */
  calculateAgeingBuckets(invoices: Invoice[], todayStr?: string): FinanceAgeingSummary {
    const today = todayStr ? new Date(todayStr) : new Date();
    today.setHours(0, 0, 0, 0);

    const summary: FinanceAgeingSummary = {
      current: 0,
      days1_30: 0,
      days31_60: 0,
      days61_90: 0,
      days90Plus: 0,
      totalOutstanding: 0
    };

    for (const inv of invoices) {
      if (inv.invoiceStatus === 'cancelled' || inv.balance <= 0) continue;

      summary.totalOutstanding += inv.balance;

      const dueDate = new Date(inv.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        summary.current += inv.balance;
      } else if (diffDays <= 30) {
        summary.days1_30 += inv.balance;
      } else if (diffDays <= 60) {
        summary.days31_60 += inv.balance;
      } else if (diffDays <= 90) {
        summary.days61_90 += inv.balance;
      } else {
        summary.days90Plus += inv.balance;
      }
    }

    return summary;
  },

  /**
   * Computes payment collection rate as percentage of billed amount.
   */
  calculateCollectionRate(totalInvoiced: number, totalCollected: number): number {
    if (totalInvoiced <= 0) {
      return totalCollected > 0 ? 100 : 0;
    }
    const rate = (totalCollected / totalInvoiced) * 100;
    return Math.min(100, Math.round(rate * 10) / 10);
  },

  /**
   * Operational readiness check for upcoming events across 6 core operational dimensions.
   */
  evaluateEventReadiness(
    event: Event,
    participants: EventParticipant[],
    consentRequests: ConsentRequest[],
    transportPlans: EventTransportPlan[],
    passengers: TransportPassenger[],
    staff: EventStaff[],
    scheduleItems: EventScheduleItem[],
    performances: EventPerformanceItem[]
  ): EventReadinessCheck {
    const issues: string[] = [];

    const eventParts = participants.filter(p => p.eventId === event.id && p.participationStatus !== 'withdrawn');
    const partsCount = eventParts.length;

    // 1. Consent
    const eventConsents = consentRequests.filter(cr => cr.eventId === event.id);
    const approvedConsents = eventConsents.filter(cr => cr.requestStatus === 'approved').length;
    const pendingConsents = eventConsents.filter(cr => cr.requestStatus === 'pending' || cr.requestStatus === 'sent').length;

    if (partsCount > 0 && pendingConsents > 0) {
      issues.push(`${pendingConsents} participants have pending or missing consent.`);
    }

    // 2. Staff
    const assignedStaff = staff.filter(s => s.eventId === event.id && s.participationStatus !== 'withdrawn');
    if (assignedStaff.length === 0) {
      issues.push('No supervisor or staff assigned to this event.');
    }

    // 3. Transport
    const eventPlans = transportPlans.filter(tp => tp.eventId === event.id && tp.transportStatus !== 'cancelled');
    let totalCapacity = 0;
    for (const plan of eventPlans) {
      totalCapacity += plan.vehicleCapacity || 0;
    }

    const eventPassengers = passengers.filter(
      p => p.eventId === event.id && p.boardingStatus !== 'cancelled'
    );
    const seatsNeeded = eventPassengers.length;

    let transportStatus: 'none_needed' | 'confirmed' | 'over_capacity' | 'unassigned' = 'none_needed';
    if (eventPlans.length > 0 || seatsNeeded > 0) {
      if (eventPlans.length === 0 && seatsNeeded > 0) {
        transportStatus = 'unassigned';
        issues.push(`${seatsNeeded} passengers require transport but no vehicle plan exists.`);
      } else if (seatsNeeded > totalCapacity) {
        transportStatus = 'over_capacity';
        issues.push(`Transport capacity exceeded! ${seatsNeeded} passengers booked for ${totalCapacity} available seats.`);
      } else {
        transportStatus = 'confirmed';
      }
    }

    // 4. Schedule & Items
    const eventSchedule = scheduleItems.filter(s => s.eventId === event.id);
    if (eventSchedule.length === 0) {
      issues.push('Schedule timeline has not been configured.');
    }

    const eventPerformances = performances.filter(p => p.eventId === event.id && p.performanceStatus !== 'cancelled');
    if (eventPerformances.length === 0) {
      issues.push('No repertoire or performance items registered.');
    }

    // Determine overall readiness
    let overallReadiness: 'ready' | 'attention_needed' | 'critical' = 'ready';
    if (transportStatus === 'over_capacity' || assignedStaff.length === 0 || (partsCount > 0 && pendingConsents > partsCount / 2)) {
      overallReadiness = 'critical';
    } else if (issues.length > 0) {
      overallReadiness = 'attention_needed';
    }

    return {
      eventId: event.id,
      eventName: event.name,
      eventDate: event.startDate,
      participantsCount: partsCount,
      consentTotal: eventConsents.length,
      consentApproved: approvedConsents,
      consentPending: pendingConsents,
      staffCount: assignedStaff.length,
      transportPlanCount: eventPlans.length,
      transportSeatsNeeded: seatsNeeded,
      transportCapacity: totalCapacity,
      transportStatus,
      scheduleItemsCount: eventSchedule.length,
      performancesCount: eventPerformances.length,
      overallReadiness,
      readinessIssues: issues
    };
  }
};
