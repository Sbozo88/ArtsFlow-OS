import { operationalAlertRepository } from '../../repositories/operationalAlertRepository';
import { attendanceRepository } from '../../repositories/attendanceRepository';
import { sessionRepository } from '../../repositories/sessionRepository';
import { programmeGroupRepository } from '../../repositories/programmeGroupRepository';
import { learnerRepository } from '../../repositories/learnerRepository';
import { invoiceRepository } from '../../repositories/invoiceRepository';
import { eventRepository } from '../../repositories/eventRepository';
import { consentRequestRepository } from '../../repositories/consentRequestRepository';
import { eventTransportPlanRepository } from '../../repositories/eventTransportPlanRepository';
import { transportPassengerRepository } from '../../repositories/transportPassengerRepository';
import { instrumentAllocationRepository } from '../../repositories/instrumentAllocationRepository';
import { costumeAllocationRepository } from '../../repositories/costumeAllocationRepository';
import { communicationRecipientRepository } from '../../repositories/communicationRecipientRepository';
import { followUpRepository } from '../../repositories/followUpRepository';
import { followUpService } from '../followUpService';
import { auditService } from '../auditService';
import { metricCalculations } from './metricCalculations';
import { formatMoney } from '../../lib/money';
import type { 
  OperationalAlert, 
  OperationalAlertType, 
  AlertSeverity, 
  FollowUp,
  FollowUpCategory 
} from '../../types';

export interface AlertDraft {
  key: string;
  alertType: OperationalAlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
}

export const operationalAlertService = {
  /**
   * Scans live operational data using deterministic rules and updates/creates operationalAlerts.
   */
  async scanAndSyncAlerts(organisationId: string, actorId: string = 'system'): Promise<OperationalAlert[]> {
    const todayStr = new Date().toISOString().split('T')[0];
    const drafts: AlertDraft[] = [];

    // Parallel fetch operational collections
    const [
      allSessions,
      allAttendance,
      allGroups,
      allLearners,
      allInvoices,
      allEvents,
      allConsentRequests,
      allTransportPlans,
      allPassengers,
      allInstrumentAllocations,
      allCostumeAllocations,
      allRecipients,
      allFollowUps,
      existingAlerts
    ] = await Promise.all([
      sessionRepository.getByOrganisation(organisationId),
      attendanceRepository.getByOrganisation(organisationId),
      programmeGroupRepository.getByOrganisation(organisationId),
      learnerRepository.getByOrganisation(organisationId),
      invoiceRepository.getByOrganisation(organisationId),
      eventRepository.getByOrganisation(organisationId),
      consentRequestRepository.getByOrganisation(organisationId),
      eventTransportPlanRepository.getByOrganisation(organisationId),
      transportPassengerRepository.getByOrganisation(organisationId),
      instrumentAllocationRepository.getByOrganisation(organisationId),
      costumeAllocationRepository.getByOrganisation(organisationId),
      communicationRecipientRepository.getByOrganisation(organisationId),
      followUpRepository.getByOrganisation(organisationId),
      operationalAlertRepository.getByOrganisation(organisationId)
    ]);

    const sessionDateMap = new Map(allSessions.map(s => [s.id, s.date]));
    const learnerMap = new Map(allLearners.map(l => [l.id, l]));

    // ── Rule 1: Low Group Attendance (< 75%) ───────────────────────
    for (const group of allGroups) {
      if (group.groupStatus !== 'active') continue;
      const groupSessions = allSessions.filter(s => s.groupId === group.id && s.sessionStatus === 'completed');
      if (groupSessions.length < 3) continue; // Minimum 3 sessions for reliable signal

      const groupSessionIds = new Set(groupSessions.map(s => s.id));
      const groupAttendance = allAttendance.filter(a => groupSessionIds.has(a.sessionId));
      const rate = metricCalculations.calculateAttendanceRate(groupAttendance);

      if (rate > 0 && rate < 75) {
        drafts.push({
          key: `attendance_low_group_${group.id}`,
          alertType: 'attendance_low',
          severity: rate < 60 ? 'urgent' : 'attention',
          title: `Low attendance in ${group.name} (${rate}%)`,
          description: `${group.name} has recorded an attendance rate of ${rate}% across ${groupSessions.length} sessions, below the 75% threshold.`,
          relatedEntityType: 'group',
          relatedEntityId: group.id,
          metadata: { groupId: group.id, attendanceRate: rate, sessionsCount: groupSessions.length }
        });
      }
    }

    // ── Rule 2: Consecutive Absences (>= 3 absences in a row) ───────
    const streakLearners = metricCalculations.detectConsecutiveAbsences(allAttendance, sessionDateMap, 3);
    for (const item of streakLearners) {
      const l = learnerMap.get(item.learnerId);
      const name = l ? `${l.firstName} ${l.lastName}` : item.learnerId;
      drafts.push({
        key: `attendance_consecutive_${item.learnerId}`,
        alertType: 'attendance_consecutive_absence',
        severity: item.consecutiveCount >= 4 ? 'critical' : 'urgent',
        title: `${name}: ${item.consecutiveCount} Consecutive Absences`,
        description: `${name} has been absent for ${item.consecutiveCount} consecutive scheduled sessions (last absence: ${item.lastAbsenceDate || 'recent'}).`,
        relatedEntityType: 'learner',
        relatedEntityId: item.learnerId,
        metadata: { learnerId: item.learnerId, consecutiveCount: item.consecutiveCount, lastAbsenceDate: item.lastAbsenceDate }
      });
    }

    // ── Rule 3: Overdue Invoices ────────────────────────────────────
    const overdueInvoices = allInvoices.filter(inv => {
      if (inv.invoiceStatus === 'cancelled' || inv.balance <= 0) return false;
      return inv.dueDate < todayStr;
    });

    if (overdueInvoices.length > 0) {
      const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.balance, 0);
      drafts.push({
        key: `finance_overdue_summary_${todayStr.slice(0, 7)}`,
        alertType: 'finance_overdue',
        severity: totalOverdue > 1000000 ? 'critical' : 'urgent', // > R10,000
        title: `${overdueInvoices.length} Overdue Invoices (${formatMoney(totalOverdue)})`,
        description: `There are ${overdueInvoices.length} unpaid invoices past their due date with total outstanding balance of ${formatMoney(totalOverdue)}.`,
        relatedEntityType: 'finance',
        metadata: { overdueCount: overdueInvoices.length, totalOverdue }
      });
    }

    // ── Rule 4: Missing Consent for Upcoming Events (within 7 days) ─
    for (const ev of allEvents) {
      if (ev.eventStatus === 'cancelled' || ev.eventStatus === 'completed') continue;
      const daysUntil = Math.floor((new Date(ev.startDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil >= 0 && daysUntil <= 7) {
        const evRequests = allConsentRequests.filter(cr => cr.eventId === ev.id);
        const pendingRequests = evRequests.filter(cr => cr.requestStatus === 'pending' || cr.requestStatus === 'sent');
        if (pendingRequests.length > 0) {
          drafts.push({
            key: `consent_missing_event_${ev.id}`,
            alertType: 'consent_missing',
            severity: daysUntil <= 2 ? 'critical' : 'urgent',
            title: `${ev.name}: ${pendingRequests.length} Missing Consents`,
            description: `Event takes place in ${daysUntil === 0 ? 'today' : `${daysUntil} days`} and ${pendingRequests.length} participants still lack approved consent.`,
            relatedEntityType: 'event',
            relatedEntityId: ev.id,
            metadata: { eventId: ev.id, pendingCount: pendingRequests.length, daysUntil }
          });
        }
      }
    }

    // ── Rule 5: Transport Over-Capacity ─────────────────────────────
    for (const plan of allTransportPlans) {
      if (plan.transportStatus === 'cancelled' || plan.transportStatus === 'completed') continue;
      const planPassengers = allPassengers.filter(
        p => p.eventTransportPlanId === plan.id && p.boardingStatus !== 'cancelled'
      );
      if (planPassengers.length > plan.vehicleCapacity) {
        drafts.push({
          key: `transport_capacity_plan_${plan.id}`,
          alertType: 'transport_capacity',
          severity: 'critical',
          title: `Transport Capacity Exceeded: ${plan.planName}`,
          description: `${planPassengers.length} passengers assigned to vehicle with capacity of ${plan.vehicleCapacity} seats.`,
          relatedEntityType: 'eventTransportPlan',
          relatedEntityId: plan.id,
          metadata: { planId: plan.id, passengersCount: planPassengers.length, capacity: plan.vehicleCapacity }
        });
      }
    }

    // ── Rule 6: Overdue Asset Returns (Instruments & Costumes) ──────
    const overdueInstruments = allInstrumentAllocations.filter(
      ia => ia.allocationStatus === 'active' && ia.returnDueDate && ia.returnDueDate < todayStr
    );
    if (overdueInstruments.length > 0) {
      drafts.push({
        key: `instrument_overdue_summary_${todayStr.slice(0, 7)}`,
        alertType: 'instrument_overdue',
        severity: 'attention',
        title: `${overdueInstruments.length} Overdue Instrument Returns`,
        description: `${overdueInstruments.length} instruments are currently past their scheduled return date.`,
        relatedEntityType: 'instrument',
        metadata: { overdueCount: overdueInstruments.length }
      });
    }

    const overdueCostumes = allCostumeAllocations.filter(
      ca => ca.allocationStatus === 'active' && ca.returnDueDate && ca.returnDueDate < todayStr
    );
    if (overdueCostumes.length > 0) {
      drafts.push({
        key: `costume_overdue_summary_${todayStr.slice(0, 7)}`,
        alertType: 'costume_overdue',
        severity: 'attention',
        title: `${overdueCostumes.length} Overdue Costume Returns`,
        description: `${overdueCostumes.length} costume items are currently past their scheduled return date.`,
        relatedEntityType: 'costume',
        metadata: { overdueCount: overdueCostumes.length }
      });
    }

    // ── Rule 7: Failed Communications ──────────────────────────────
    const failedRecipients = allRecipients.filter(r => r.deliveryStatus === 'failed');
    if (failedRecipients.length > 0) {
      drafts.push({
        key: `communication_failed_summary_${todayStr.slice(0, 7)}`,
        alertType: 'communication_failed',
        severity: 'attention',
        title: `${failedRecipients.length} Communication Delivery Failures`,
        description: `${failedRecipients.length} outbound messages encountered provider or address errors and require attention.`,
        relatedEntityType: 'communication',
        metadata: { failedCount: failedRecipients.length }
      });
    }

    // ── Rule 8: Overdue Follow-Ups ──────────────────────────────────
    const overdueFollowUps = allFollowUps.filter(
      fu => (fu.status === 'active' || fu.followUpStatus === 'open' || fu.followUpStatus === 'in_progress') && fu.dueDate && fu.dueDate < todayStr
    );
    if (overdueFollowUps.length > 0) {
      drafts.push({
        key: `followup_overdue_summary_${todayStr.slice(0, 7)}`,
        alertType: 'followup_overdue',
        severity: 'urgent',
        title: `${overdueFollowUps.length} Overdue Follow-Ups`,
        description: `${overdueFollowUps.length} follow-up tasks are past their deadline and require immediate review.`,
        relatedEntityType: 'followUp',
        metadata: { overdueCount: overdueFollowUps.length }
      });
    }

    // ── Sync to Firestore ──────────────────────────────────────────
    const existingMap = new Map(existingAlerts.map(a => [a.title, a]));
    const synchronizedAlerts: OperationalAlert[] = [];

    for (const draft of drafts) {
      const match = existingMap.get(draft.title);

      if (match) {
        // If existing is resolved or dismissed, do not overwrite unless conditions re-triggered
        if (match.alertStatus === 'active' || match.alertStatus === 'acknowledged') {
          synchronizedAlerts.push(match);
        }
      } else {
        const created = await operationalAlertRepository.create(organisationId, actorId, {
          alertType: draft.alertType,
          severity: draft.severity,
          title: draft.title,
          description: draft.description,
          relatedEntityType: draft.relatedEntityType,
          relatedEntityId: draft.relatedEntityId,
          detectedAt: new Date().toISOString(),
          alertStatus: 'active',
          metadata: draft.metadata
        } as never);
        synchronizedAlerts.push(created);
      }
    }

    return synchronizedAlerts;
  },

  async getActiveAlerts(organisationId: string): Promise<OperationalAlert[]> {
    return operationalAlertRepository.getActiveAlerts(organisationId);
  },

  async acknowledgeAlert(organisationId: string, alertId: string, actorId: string): Promise<void> {
    const existing = await operationalAlertRepository.getById(organisationId, alertId);
    if (!existing) throw new Error('Alert not found');

    const updates = {
      alertStatus: 'acknowledged' as const,
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: actorId
    };

    await operationalAlertRepository.update(organisationId, actorId, alertId, updates as never);
    await auditService.log(organisationId, actorId, 'ACKNOWLEDGE_OPERATIONAL_ALERT', 'operationalAlert', alertId, existing, { ...existing, ...updates });
  },

  async dismissAlert(organisationId: string, alertId: string, actorId: string): Promise<void> {
    const existing = await operationalAlertRepository.getById(organisationId, alertId);
    if (!existing) throw new Error('Alert not found');

    const updates = {
      alertStatus: 'dismissed' as const,
      dismissedAt: new Date().toISOString(),
      dismissedBy: actorId
    };

    await operationalAlertRepository.update(organisationId, actorId, alertId, updates as never);
    await auditService.log(organisationId, actorId, 'DISMISS_OPERATIONAL_ALERT', 'operationalAlert', alertId, existing, { ...existing, ...updates });
  },

  async resolveAlert(organisationId: string, alertId: string, actorId: string): Promise<void> {
    const existing = await operationalAlertRepository.getById(organisationId, alertId);
    if (!existing) throw new Error('Alert not found');

    const updates = {
      alertStatus: 'resolved' as const,
      resolvedAt: new Date().toISOString(),
      resolvedBy: actorId
    };

    await operationalAlertRepository.update(organisationId, actorId, alertId, updates as never);
    await auditService.log(organisationId, actorId, 'RESOLVE_OPERATIONAL_ALERT', 'operationalAlert', alertId, existing, { ...existing, ...updates });
  },

  /**
   * 1-Click Action: Converts an observation alert into an assigned human-owned FollowUp task.
   */
  async createFollowUpFromAlert(
    organisationId: string,
    alertId: string,
    actorId: string,
    options?: {
      assignedStaffId?: string;
      dueDate?: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
    }
  ): Promise<FollowUp> {
    const alert = await operationalAlertRepository.getById(organisationId, alertId);
    if (!alert) throw new Error('Alert not found');

    let category: FollowUpCategory;
    switch (alert.alertType) {
      case 'attendance_low':
      case 'attendance_consecutive_absence':
        category = 'attendance';
        break;
      case 'finance_overdue':
        category = 'payment';
        break;
      case 'consent_missing':
        category = 'consent';
        break;
      case 'transport_capacity':
        category = 'event';
        break;
      case 'instrument_overdue':
        category = 'instrument';
        break;
      default:
        category = 'general';
    }

    const dueDate = options?.dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const followUp = await followUpService.createFollowUp(organisationId, actorId, {
      category,
      subject: `Follow-up: ${alert.title}`,
      description: `Generated from operational alert (${alert.alertType}): ${alert.description}`,
      ownerId: options?.assignedStaffId || actorId,
      dueDate,
      priority: options?.priority || (alert.severity === 'critical' ? 'urgent' : alert.severity === 'urgent' ? 'high' : 'normal'),
      learnerId: alert.relatedEntityType === 'learner' ? alert.relatedEntityId : undefined,
      groupId: alert.relatedEntityType === 'group' ? alert.relatedEntityId : undefined
    });

    // Mark alert as acknowledged
    await this.acknowledgeAlert(organisationId, alertId, actorId);

    await auditService.log(
      organisationId,
      actorId,
      'CREATE_FOLLOW_UP_FROM_ALERT',
      'operationalAlert',
      alertId,
      alert,
      { followUpId: followUp.id }
    );

    return followUp;
  }
};
