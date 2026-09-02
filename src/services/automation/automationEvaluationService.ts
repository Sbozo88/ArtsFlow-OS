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
import { eventStaffRepository } from '../../repositories/eventStaffRepository';
import { eventScheduleRepository } from '../../repositories/eventScheduleRepository';
import { eventPerformanceRepository } from '../../repositories/eventPerformanceRepository';
import { eventParticipantRepository } from '../../repositories/eventParticipantRepository';
import { instrumentAllocationRepository } from '../../repositories/instrumentAllocationRepository';
import { costumeAllocationRepository } from '../../repositories/costumeAllocationRepository';
import { followUpRepository } from '../../repositories/followUpRepository';
import { communicationRecipientRepository } from '../../repositories/communicationRecipientRepository';
import { guardianRepository } from '../../repositories/guardianRepository';
import { learnerGuardianRepository } from '../../repositories/learnerGuardianRepository';
import { metricCalculations } from '../analytics/metricCalculations';
import type { AutomationRule, ConditionPredicate } from '../../types';

export interface MatchedEntity {
  entityType: string;
  entityId: string;
  learnerId?: string;
  guardianId?: string;
  groupId?: string;
  programmeId?: string;
  eventId?: string;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export const automationEvaluationService = {
  /**
   * Evaluates a rule against operational data and returns all matching entities that satisfy the trigger.
   */
  async evaluateRule(
    organisationId: string,
    rule: AutomationRule
  ): Promise<MatchedEntity[]> {
    if (rule.ruleStatus === 'paused' || rule.ruleStatus === 'disabled' || rule.ruleStatus === 'archived') {
      return [];
    }

    const todayStr = new Date().toISOString().split('T')[0];

    switch (rule.ruleCategory) {
      // ─── 1. ATTENDANCE RULES ───────────────────────────────────────
      case 'attendance': {
        const [allSessions, allAttendance, allGroups, allLearners] = await Promise.all([
          sessionRepository.getByOrganisation(organisationId),
          attendanceRepository.getByOrganisation(organisationId),
          programmeGroupRepository.getByOrganisation(organisationId),
          learnerRepository.getByOrganisation(organisationId)
        ]);

        const sessionDateMap = new Map(allSessions.map(s => [s.id, s.date]));
        const groupMap = new Map(allGroups.map(g => [g.id, g]));
        const learnerMap = new Map(allLearners.map(l => [l.id, l]));

        // Consecutive absences check
        if (rule.triggerType === 'pattern_detected' || rule.triggerConfig.consecutiveCount) {
          const streakCount = rule.triggerConfig.consecutiveCount || 3;
          const streaks = metricCalculations.detectConsecutiveAbsences(allAttendance, sessionDateMap, streakCount);

          const matches: MatchedEntity[] = [];
          for (const s of streaks) {
            const learner = learnerMap.get(s.learnerId);
            if (!learner || learner.learnerStatus !== 'active') continue;

            // Find group from latest session
            const latestAtt = allAttendance.find(a => a.learnerId === s.learnerId && sessionDateMap.get(a.sessionId) === s.lastAbsenceDate);
            const latestSession = latestAtt ? allSessions.find(sess => sess.id === latestAtt.sessionId) : undefined;
            const group = latestSession ? groupMap.get(latestSession.groupId) : undefined;

            matches.push({
              entityType: 'learner',
              entityId: s.learnerId,
              learnerId: s.learnerId,
              groupId: group?.id,
              programmeId: group?.programmeId,
              title: `${s.consecutiveCount} Consecutive Absences: ${learner.firstName} ${learner.lastName}`,
              description: `Learner ${learner.firstName} ${learner.lastName} has missed ${s.consecutiveCount} consecutive sessions. Last missed: ${s.lastAbsenceDate}.`,
              metadata: {
                consecutiveAbsences: s.consecutiveCount,
                lastAbsenceDate: s.lastAbsenceDate,
                groupName: group?.name || 'Unassigned'
              }
            });
          }
          return matches;
        }

        // Low group attendance rate check
        if (rule.triggerType === 'threshold_reached' || rule.triggerConfig.thresholdPercent) {
          const threshold = rule.triggerConfig.thresholdPercent || 75;
          const minSessions = rule.triggerConfig.minSessions || 4;
          const matches: MatchedEntity[] = [];

          for (const group of allGroups) {
            if (group.groupStatus !== 'active') continue;
            const groupSessions = allSessions.filter(s => s.groupId === group.id && s.sessionStatus === 'completed');
            if (groupSessions.length < minSessions) continue;

            const groupSessionIds = new Set(groupSessions.map(s => s.id));
            const groupAttendance = allAttendance.filter(a => groupSessionIds.has(a.sessionId));
            const rate = metricCalculations.calculateAttendanceRate(groupAttendance);

            if (rate < threshold) {
              matches.push({
                entityType: 'group',
                entityId: group.id,
                groupId: group.id,
                programmeId: group.programmeId,
                title: `Low Attendance: ${group.name} (${rate}%)`,
                description: `Group ${group.name} attendance is ${rate}%, which is below the required ${threshold}% threshold across ${groupSessions.length} sessions.`,
                metadata: { rate, threshold, sessionsHeld: groupSessions.length }
              });
            }
          }
          return matches;
        }

        return [];
      }

      // ─── 2. FINANCE RULES ──────────────────────────────────────────
      case 'finance': {
        const [allInvoices, allPayments, allLearners] = await Promise.all([
          invoiceRepository.getByOrganisation(organisationId),
          paymentRepository.getByOrganisation(organisationId),
          learnerRepository.getByOrganisation(organisationId)
        ]);

        const learnerMap = new Map(allLearners.map(l => [l.id, l]));
        const overdueDaysTarget = rule.triggerConfig.overdueDays ?? (rule.triggerType === 'date_reached' ? 1 : 30);

        const matches: MatchedEntity[] = [];

        // Check overdue invoices
        for (const inv of allInvoices) {
          if (inv.invoiceStatus === 'cancelled' || inv.balance <= 0) continue;
          const due = new Date(inv.dueDate);
          const now = new Date(todayStr);
          const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays >= overdueDaysTarget) {
            const learner = learnerMap.get(inv.learnerId);
            matches.push({
              entityType: 'invoice',
              entityId: inv.id,
              learnerId: inv.learnerId,
              guardianId: inv.guardianId,
              title: `Overdue Invoice #${inv.invoiceNumber} (${diffDays} days)`,
              description: `Invoice #${inv.invoiceNumber} for ${learner?.firstName || ''} ${learner?.lastName || ''} is ${diffDays} days past due date (${inv.dueDate}). Balance: ${(inv.balance / 100).toFixed(2)}.`,
              metadata: {
                invoiceNumber: inv.invoiceNumber,
                balance: inv.balance,
                dueDate: inv.dueDate,
                daysOverdue: diffDays,
                recipientName: learner ? `${learner.firstName} ${learner.lastName}` : 'Guardian'
              }
            });
          }
        }

        // Check unallocated payments (> 3 days)
        if (rule.triggerConfig.unallocatedPaymentCheck) {
          for (const payment of allPayments) {
            if (payment.paymentStatus === 'unallocated') {
              const paymentDate = new Date(payment.paymentDate);
              const now = new Date(todayStr);
              const diffDays = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays >= 3) {
                matches.push({
                  entityType: 'payment',
                  entityId: payment.id,
                  title: `Unallocated Payment: ${(payment.amount / 100).toFixed(2)} (${diffDays} days)`,
                  description: `Payment received on ${payment.paymentDate} has remained unallocated for ${diffDays} days.`,
                  metadata: { amount: payment.amount, paymentDate: payment.paymentDate }
                });
              }
            }
          }
        }

        return matches;
      }

      // ─── 3. CONSENT RULES ──────────────────────────────────────────
      case 'consent': {
        const [allEvents, allConsents, allLearners] = await Promise.all([
          eventRepository.getByOrganisation(organisationId),
          consentRequestRepository.getByOrganisation(organisationId),
          learnerRepository.getByOrganisation(organisationId)
        ]);

        const learnerMap = new Map(allLearners.map(l => [l.id, l]));
        const daysBefore = rule.triggerConfig.daysBefore || 7;
        const matches: MatchedEntity[] = [];

        for (const ev of allEvents) {
          if (ev.eventStatus === 'cancelled' || ev.eventStatus === 'completed') continue;
          const eventDate = new Date(ev.startDate);
          const now = new Date(todayStr);
          const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          // If within the daysBefore window (e.g. within 7 days or within 2 days)
          if (diffDays > 0 && diffDays <= daysBefore) {
            const eventConsents = allConsents.filter(c => c.eventId === ev.id);
            const pendingConsents = eventConsents.filter(c => c.requestStatus === 'pending' || c.requestStatus === 'sent');

            for (const pc of pendingConsents) {
              const learner = learnerMap.get(pc.learnerId);
              matches.push({
                entityType: 'consentRequest',
                entityId: pc.id,
                learnerId: pc.learnerId,
                guardianId: pc.guardianId,
                eventId: ev.id,
                title: `Pending Consent: ${learner?.firstName || ''} ${learner?.lastName || ''} for ${ev.name}`,
                description: `Consent request for ${ev.name} (taking place in ${diffDays} days on ${ev.startDate}) has not been submitted yet.`,
                metadata: {
                  eventName: ev.name,
                  eventDate: ev.startDate,
                  daysUntilEvent: diffDays,
                  recipientName: learner ? `${learner.firstName} ${learner.lastName}` : 'Guardian'
                }
              });
            }
          }
        }

        return matches;
      }

      // ─── 4. EVENT READINESS RULES ──────────────────────────────────
      case 'event': {
        const [
          allEvents,
          allParticipants,
          allConsents,
          allTransportPlans,
          allPassengers,
          allStaff,
          allSchedule,
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

        const daysBefore = rule.triggerConfig.daysBefore || 7;
        const matches: MatchedEntity[] = [];

        for (const ev of allEvents) {
          if (ev.eventStatus === 'cancelled' || ev.eventStatus === 'completed') continue;
          const eventDate = new Date(ev.startDate);
          const now = new Date(todayStr);
          const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays > 0 && diffDays <= daysBefore) {
            const readiness = metricCalculations.evaluateEventReadiness(
              ev,
              allParticipants,
              allConsents,
              allTransportPlans,
              allPassengers,
              allStaff,
              allSchedule,
              allPerformances
            );

            if (readiness.overallReadiness === 'critical' || readiness.overallReadiness === 'attention_needed') {
              matches.push({
                entityType: 'event',
                entityId: ev.id,
                eventId: ev.id,
                title: `Event Readiness Warning: ${ev.name} (${diffDays} days away)`,
                description: `Event "${ev.name}" on ${ev.startDate} has ${readiness.readinessIssues.length} unresolved readiness issue(s): ${readiness.readinessIssues.slice(0, 2).join('; ')}`,
                metadata: {
                  eventName: ev.name,
                  eventDate: ev.startDate,
                  daysUntilEvent: diffDays,
                  readiness: readiness.overallReadiness,
                  issues: readiness.readinessIssues
                }
              });
            }
          }
        }

        return matches;
      }

      // ─── 5. TRANSPORT RULES ────────────────────────────────────────
      case 'transport': {
        const [allPlans, allPassengers, allEvents] = await Promise.all([
          eventTransportPlanRepository.getByOrganisation(organisationId),
          transportPassengerRepository.getByOrganisation(organisationId),
          eventRepository.getByOrganisation(organisationId)
        ]);

        const eventMap = new Map(allEvents.map(e => [e.id, e]));
        const matches: MatchedEntity[] = [];

        for (const plan of allPlans) {
          if (plan.transportStatus === 'cancelled' || plan.transportStatus === 'completed') continue;
          const assignedPassengers = allPassengers.filter(p => p.eventTransportPlanId === plan.id);
          const ev = eventMap.get(plan.eventId);

          // Over capacity check
          if (assignedPassengers.length > plan.vehicleCapacity) {
            matches.push({
              entityType: 'transportPlan',
              entityId: plan.id,
              eventId: plan.eventId,
              title: `Transport Capacity Exceeded: ${plan.planName}`,
              description: `Vehicle capacity is ${plan.vehicleCapacity} but ${assignedPassengers.length} passengers are assigned. Event: ${ev?.name || 'Upcoming Event'}.`,
              metadata: {
                vehicleCapacity: plan.vehicleCapacity,
                passengerCount: assignedPassengers.length,
                planName: plan.planName,
                eventName: ev?.name
              }
            });
          }

          // Unconfirmed vehicle approaching deadline (< 3 days)
          const planDate = new Date(plan.departureDate);
          const now = new Date(todayStr);
          const diffDays = Math.ceil((planDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays > 0 && diffDays <= 3 && plan.transportStatus !== 'confirmed') {
            matches.push({
              entityType: 'transportPlan',
              entityId: plan.id,
              eventId: plan.eventId,
              title: `Unconfirmed Transport: ${plan.planName} (${diffDays} days away)`,
              description: `Transport departure scheduled on ${plan.departureDate} is not yet confirmed.`,
              metadata: { departureDate: plan.departureDate, status: plan.transportStatus }
            });
          }
        }

        return matches;
      }

      // ─── 6. ASSET RULES (INSTRUMENTS & COSTUMES) ───────────────────
      case 'instrument':
      case 'costume': {
        const matches: MatchedEntity[] = [];

        if (rule.ruleCategory === 'instrument') {
          const [allAllocations, allLearners] = await Promise.all([
            instrumentAllocationRepository.getByOrganisation(organisationId),
            learnerRepository.getByOrganisation(organisationId)
          ]);
          const learnerMap = new Map(allLearners.map(l => [l.id, l]));

          for (const alloc of allAllocations) {
            if (alloc.allocationStatus === 'active' && alloc.returnDueDate && alloc.returnDueDate < todayStr) {
              const learner = learnerMap.get(alloc.learnerId);
              matches.push({
                entityType: 'instrumentAllocation',
                entityId: alloc.id,
                learnerId: alloc.learnerId,
                title: `Overdue Instrument Return: ${learner?.firstName || ''} ${learner?.lastName || ''}`,
                description: `Instrument allocation is past return due date (${alloc.returnDueDate}).`,
                metadata: { returnDueDate: alloc.returnDueDate, instrumentId: alloc.instrumentId }
              });
            }
          }
        } else {
          const [allAllocations, allLearners] = await Promise.all([
            costumeAllocationRepository.getByOrganisation(organisationId),
            learnerRepository.getByOrganisation(organisationId)
          ]);
          const learnerMap = new Map(allLearners.map(l => [l.id, l]));

          for (const alloc of allAllocations) {
            if (alloc.allocationStatus === 'active' && alloc.returnDueDate && alloc.returnDueDate < todayStr) {
              const learner = learnerMap.get(alloc.learnerId);
              matches.push({
                entityType: 'costumeAllocation',
                entityId: alloc.id,
                learnerId: alloc.learnerId,
                title: `Overdue Costume Return: ${learner?.firstName || ''} ${learner?.lastName || ''}`,
                description: `Costume allocation is past return due date (${alloc.returnDueDate}).`,
                metadata: { returnDueDate: alloc.returnDueDate, costumeId: alloc.costumeId }
              });
            }
          }
        }

        return matches;
      }

      // ─── 7. FOLLOW-UP ESCALATION RULES ─────────────────────────────
      case 'follow_up': {
        const allFollowUps = await followUpRepository.getByOrganisation(organisationId);
        const matches: MatchedEntity[] = [];

        for (const fu of allFollowUps) {
          if (fu.followUpStatus === 'completed' || fu.followUpStatus === 'cancelled') continue;
          if (fu.dueDate && fu.dueDate < todayStr) {
            const due = new Date(fu.dueDate);
            const now = new Date(todayStr);
            const daysOverdue = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

            matches.push({
              entityType: 'followUp',
              entityId: fu.id,
              learnerId: fu.learnerId,
              groupId: fu.groupId,
              title: `Overdue Follow-Up: ${fu.subject} (${daysOverdue} days)`,
              description: `Follow-up task is ${daysOverdue} days past due date (${fu.dueDate}). Priority: ${fu.priority}.`,
              metadata: { dueDate: fu.dueDate, daysOverdue, priority: fu.priority, currentOwnerId: fu.ownerId }
            });
          }
        }

        return matches;
      }

      // ─── 8. COMMUNICATION FAILURE RULES ────────────────────────────
      case 'communication': {
        const allRecipients = await communicationRecipientRepository.getByOrganisation(organisationId);
        const matches: MatchedEntity[] = [];

        for (const r of allRecipients) {
          if (r.deliveryStatus === 'failed') {
            const dest = r.recipientPhone || r.recipientEmail || 'address';
            matches.push({
              entityType: 'communicationRecipient',
              entityId: r.id,
              title: `Delivery Failed: Message to ${r.recipientType} (${dest})`,
              description: `Communication delivery failed. Failure reason: ${r.failureReason || 'Provider error'}.`,
              metadata: {
                communicationId: r.communicationId,
                failureReason: r.failureReason,
                destination: dest
              }
            });
          }
        }

        return matches;
      }

      // ─── 9. DATA QUALITY RULES ─────────────────────────────────────
      case 'general': {
        const [allGuardians, allLinks] = await Promise.all([
          guardianRepository.getByOrganisation(organisationId),
          learnerGuardianRepository.getByOrganisation(organisationId)
        ]);

        const matches: MatchedEntity[] = [];

        // Flag primary guardians missing both phone and email
        for (const g of allGuardians) {
          if (g.status === 'deleted') continue;
          const hasPhone = Boolean(g.mobileNumber && g.mobileNumber.trim());
          const hasEmail = Boolean(g.email && g.email.trim());

          if (!hasPhone && !hasEmail) {
            const link = allLinks.find(l => l.guardianId === g.id);
            matches.push({
              entityType: 'guardian',
              entityId: g.id,
              guardianId: g.id,
              learnerId: link?.learnerId,
              title: `Missing Contact Info: ${g.firstName} ${g.lastName}`,
              description: `Guardian record has neither a mobile number nor an email address on file.`,
              metadata: { guardianName: `${g.firstName} ${g.lastName}` }
            });
          }
        }

        return matches;
      }

      default:
        return [];
    }
  },

  /**
   * Helper to evaluate arbitrary conditions on an entity object.
   */
  evaluateConditionPredicates(data: Record<string, unknown>, conditions: ConditionPredicate[]): boolean {
    if (!conditions || conditions.length === 0) return true;

    for (const cond of conditions) {
      const val = data[cond.field];
      switch (cond.operator) {
        case 'equals':
          if (val !== cond.value) return false;
          break;
        case 'not_equals':
          if (val === cond.value) return false;
          break;
        case 'greater_than':
          if (typeof val !== 'number' || val <= Number(cond.value)) return false;
          break;
        case 'less_than':
          if (typeof val !== 'number' || val >= Number(cond.value)) return false;
          break;
        case 'in':
          if (!Array.isArray(cond.value) || !cond.value.includes(val)) return false;
          break;
        case 'contains':
          if (typeof val !== 'string' || !val.includes(String(cond.value))) return false;
          break;
        case 'is_empty':
          if (val !== null && val !== undefined && val !== '') return false;
          break;
        case 'is_not_empty':
          if (val === null || val === undefined || val === '') return false;
          break;
      }
    }

    return true;
  }
};
