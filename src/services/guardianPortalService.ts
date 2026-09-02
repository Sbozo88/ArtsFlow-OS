import { guardianAccessService } from './guardianAccessService';
import { consentSubmissionService } from './consentSubmissionService';
import { receiptService, ReceiptData } from './receiptService';
import { metricCalculations } from './analytics/metricCalculations';
import { auditService } from './auditService';
import { enrolmentRepository } from '../repositories/enrolmentRepository';
import { programmeRepository } from '../repositories/programmeRepository';
import { programmeGroupRepository } from '../repositories/programmeGroupRepository';
import { sessionRepository } from '../repositories/sessionRepository';
import { attendanceRepository } from '../repositories/attendanceRepository';
import { eventRepository } from '../repositories/eventRepository';
import { eventParticipantRepository } from '../repositories/eventParticipantRepository';
import { consentRequestRepository } from '../repositories/consentRequestRepository';
import { consentSubmissionRepository } from '../repositories/consentSubmissionRepository';
import { consentTemplateRepository } from '../repositories/consentTemplateRepository';
import { eventTransportPlanRepository } from '../repositories/eventTransportPlanRepository';
import { transportPassengerRepository } from '../repositories/transportPassengerRepository';
import { invoiceRepository } from '../repositories/invoiceRepository';
import { invoiceLineItemRepository } from '../repositories/invoiceLineItemRepository';
import { paymentRepository } from '../repositories/paymentRepository';
import { paymentAllocationRepository } from '../repositories/paymentAllocationRepository';
import { documentRepository } from '../repositories/documentRepository';
import { documentLinkRepository } from '../repositories/documentLinkRepository';
import { communicationRepository } from '../repositories/communicationRepository';
import { communicationRecipientRepository } from '../repositories/communicationRecipientRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { portalChangeRequestRepository } from '../repositories/portalChangeRequestRepository';
import { guardianRepository } from '../repositories/guardianRepository';
import { organisationSettingsService } from './organisationSettingsService';
import type {
  GuardianDashboardDto,
  GuardianLearnerSummaryDto,
  GuardianProgrammeInfoDto,
  GuardianSessionDto,
  GuardianAttendanceSummaryDto,
  GuardianEventDto,
  GuardianConsentDetailDto,
  GuardianTransportPlanDto,
  GuardianFinanceSummaryDto,
  GuardianInvoiceDto,
  GuardianPaymentDto,
  GuardianDocumentDto,
  GuardianMessageDto,
  GuardianProfileDto,
  PortalChangeRequest,
  PortalChangeRequestType,
  ConsentSubmission
} from '../types';

export const guardianPortalService = {
  /**
   * Retrieves high-level dashboard data for the guardian.
   */
  async getDashboard(organisationId: string, userId: string): Promise<GuardianDashboardDto> {
    const { guardian, linkedLearners, portalSettings } =
      await guardianAccessService.resolveGuardianContext(organisationId, userId);

    const learnerIds = linkedLearners.map(l => l.id);
    const learnerSummaries = await this.getLearners(organisationId, userId);

    // 1. Pending Consents Count
    let pendingConsentCount = 0;
    try {
      const consents = await this.getConsentList(organisationId, userId);
      pendingConsentCount = consents.filter(c => c.submissionStatus === 'pending').length;
    } catch {
      // consent may be empty or disabled
    }

    // 2. Upcoming Events Count & Next Upcoming Event
    let upcomingEventsCount = 0;
    let nextUpcomingEvent: GuardianEventDto | undefined;
    try {
      if (portalSettings.showEvents) {
        const events = await this.getEvents(organisationId, userId);
        const now = new Date().toISOString().split('T')[0];
        const futureEvents = events
          .filter(e => e.startDate >= now)
          .sort((a, b) => a.startDate.localeCompare(b.startDate));
        upcomingEventsCount = futureEvents.length;
        nextUpcomingEvent = futureEvents[0];
      }
    } catch {
      // events may be empty
    }

    // 3. Outstanding Balance & Overdue Invoices Count
    let overdueInvoicesCount = 0;
    let totalOutstandingBalanceCents = 0;
    if (portalSettings.showFinance) {
      for (const summary of learnerSummaries) {
        if (summary.financialContact || !portalSettings.financeRequiresFinancialContact) {
          totalOutstandingBalanceCents += summary.balanceDueCents;
          try {
            const finance = await this.getFinance(organisationId, userId, summary.id);
            const now = new Date().toISOString().split('T')[0];
            const overdue = finance.invoices.filter(i => i.invoiceStatus !== 'paid' && i.dueDate < now);
            overdueInvoicesCount += overdue.length;
          } catch {
            // financial access not permitted
          }
        }
      }
    }

    // 4. Unread Notifications Count
    let unreadNotificationsCount = 0;
    try {
      unreadNotificationsCount = (await notificationRepository.getUnreadForUser(organisationId, userId)).length;
    } catch {
      // ignore
    }

    // 5. Next Upcoming Session
    let nextUpcomingSession: GuardianSessionDto | undefined;
    try {
      const allSessions: GuardianSessionDto[] = [];
      const now = new Date().toISOString().split('T')[0];
      for (const lid of learnerIds) {
        const enrolments = (await enrolmentRepository.getByLearner(organisationId, lid)).filter(e => e.enrolmentStatus === 'active');
        for (const enrol of enrolments) {
          const sessions = await sessionRepository.getByGroupId(organisationId, enrol.groupId);
          const futureSessions = sessions.filter(s => s.date >= now && s.sessionStatus !== 'cancelled');
          const prog = await programmeRepository.getById(organisationId, enrol.programmeId);
          const grp = await programmeGroupRepository.getById(organisationId, enrol.groupId);
          for (const s of futureSessions) {
            allSessions.push({
              id: s.id,
              programmeId: enrol.programmeId,
              programmeName: prog?.name || 'Programme',
              groupId: enrol.groupId,
              groupName: grp?.name,
              sessionDate: s.date,
              startTime: s.startTime,
              endTime: s.endTime,
              venue: s.venue,
              sessionType: s.sessionType
            });
          }
        }
      }
      allSessions.sort((a, b) => `${a.sessionDate} ${a.startTime}`.localeCompare(`${b.sessionDate} ${b.startTime}`));
      nextUpcomingSession = allSessions[0];
    } catch {
      // ignore
    }

    return {
      guardian: {
        id: guardian.id,
        displayName: `${guardian.firstName} ${guardian.lastName}`.trim(),
        email: guardian.email
      },
      actionCards: {
        pendingConsentCount,
        upcomingEventsCount,
        overdueInvoicesCount,
        totalOutstandingBalanceCents,
        unreadNotificationsCount
      },
      learners: learnerSummaries,
      nextUpcomingEvent,
      nextUpcomingSession
    };
  },

  /**
   * Retrieves summary cards for all linked learners.
   */
  async getLearners(organisationId: string, userId: string): Promise<GuardianLearnerSummaryDto[]> {
    const { linkedLearnerGuardians, linkedLearners, portalSettings } =
      await guardianAccessService.resolveGuardianContext(organisationId, userId);

    const settings = await organisationSettingsService.getSettings(organisationId);

    const summaries = await Promise.all(
      linkedLearners.map(async learner => {
        const relationship = linkedLearnerGuardians.find(r => r.learnerId === learner.id)!;

        // 1. Programmes
        const enrolments = (await enrolmentRepository.getByLearner(organisationId, learner.id))
          .filter(e => e.enrolmentStatus === 'active');
        const programmes = await Promise.all(
          enrolments.map(async e => {
            const p = await programmeRepository.getById(organisationId, e.programmeId);
            const g = await programmeGroupRepository.getById(organisationId, e.groupId);
            return {
              id: e.programmeId,
              name: p?.name || 'Programme',
              type: p?.programmeType || 'General',
              groupName: g?.name
            };
          })
        );

        // 2. Attendance
        let attendanceRate = 100;
        if (portalSettings.showAttendance) {
          const attendanceRecords = await attendanceRepository.getByLearner(organisationId, learner.id);
          attendanceRate = metricCalculations.calculateAttendanceRate(attendanceRecords, {
            lateCountsAsPresent: settings.attendance.lateCountsAsPresent,
            excusedCountsInDenominator: settings.attendance.excusedCountsInDenominator
          });
        }

        // 3. Outstanding Balance
        let balanceDueCents = 0;
        if (portalSettings.showFinance) {
          const isFinancial = relationship.financialContact || !portalSettings.financeRequiresFinancialContact;
          if (isFinancial) {
            const allInvoices = await invoiceRepository.getByLearner(organisationId, learner.id);
            const activeInvoices = allInvoices.filter(i => i.invoiceStatus !== 'cancelled' && i.invoiceStatus !== 'paid');
            balanceDueCents = activeInvoices.reduce((acc, inv) => acc + (inv.balance || 0), 0);
          }
        }

        // 4. Outstanding Consent Count
        let outstandingConsentCount = 0;
        try {
          const consents = await this.getConsentList(organisationId, userId, learner.id);
          outstandingConsentCount = consents.filter(c => c.submissionStatus === 'pending').length;
        } catch {
          // ignore
        }

        // 5. Transport Enrolled Count
        let transportEnrolledCount = 0;
        try {
          const passengers = await transportPassengerRepository.getByOrganisation(organisationId);
          transportEnrolledCount = passengers.filter(p => p.learnerId === learner.id && p.boardingStatus !== 'cancelled').length;
        } catch {
          // ignore
        }

        return {
          id: learner.id,
          firstName: learner.firstName,
          lastName: learner.lastName,
          preferredName: learner.preferredName,
          dateOfBirth: learner.dateOfBirth,
          photoUrl: learner.photoUrl,
          programmes,
          attendanceRate,
          outstandingConsentCount,
          transportEnrolledCount,
          balanceDueCents,
          relationshipType: relationship.relationshipType || 'Guardian',
          financialContact: relationship.financialContact,
          emergencyContact: relationship.emergencyContact
        };
      })
    );

    return summaries;
  },

  /**
   * Retrieves detailed learner information including classes and upcoming sessions.
   */
  async getLearnerDetail(organisationId: string, userId: string, learnerId: string): Promise<{
    learner: GuardianLearnerSummaryDto;
    programmes: GuardianProgrammeInfoDto[];
    upcomingSessions: GuardianSessionDto[];
  }> {
    const { guardian } = await guardianAccessService.resolveGuardianContext(organisationId, userId);
    await guardianAccessService.assertLearnerAccess(organisationId, guardian.id, learnerId);

    const learners = await this.getLearners(organisationId, userId);
    const summary = learners.find(l => l.id === learnerId);
    if (!summary) throw new Error('Learner not found.');

    const enrolments = (await enrolmentRepository.getByLearner(organisationId, learnerId))
      .filter(e => e.enrolmentStatus === 'active');

    const programmes: GuardianProgrammeInfoDto[] = await Promise.all(
      enrolments.map(async e => {
        const p = await programmeRepository.getById(organisationId, e.programmeId);
        const g = await programmeGroupRepository.getById(organisationId, e.groupId);
        return {
          id: e.programmeId,
          name: p?.name || 'Programme',
          type: p?.programmeType || 'General',
          description: p?.description,
          groupName: g?.name,
          venue: g?.venue,
          schedule: g?.venue || ''
        };
      })
    );

    const now = new Date().toISOString().split('T')[0];
    const upcomingSessions: GuardianSessionDto[] = [];
    for (const e of enrolments) {
      const sessions = await sessionRepository.getByGroupId(organisationId, e.groupId);
      const future = sessions.filter(s => s.date >= now && s.sessionStatus !== 'cancelled');
      const p = programmes.find(pr => pr.id === e.programmeId);
      for (const s of future) {
        upcomingSessions.push({
          id: s.id,
          programmeId: e.programmeId,
          programmeName: p?.name || 'Class',
          groupId: e.groupId,
          groupName: p?.groupName,
          sessionDate: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          venue: s.venue || p?.venue,
          sessionType: s.sessionType
        });
      }
    }

    upcomingSessions.sort((a, b) => `${a.sessionDate} ${a.startTime}`.localeCompare(`${b.sessionDate} ${b.startTime}`));

    return {
      learner: summary,
      programmes,
      upcomingSessions
    };
  },

  /**
   * Retrieves attendance records and breakdown for a linked learner.
   */
  async getAttendance(organisationId: string, userId: string, learnerId: string): Promise<GuardianAttendanceSummaryDto> {
    const { guardian, portalSettings } = await guardianAccessService.resolveGuardianContext(organisationId, userId);
    guardianAccessService.assertFeatureEnabled(portalSettings, 'showAttendance');
    await guardianAccessService.assertLearnerAccess(organisationId, guardian.id, learnerId);

    const settings = await organisationSettingsService.getSettings(organisationId);
    const attendanceRecords = await attendanceRepository.getByLearner(organisationId, learnerId);

    const rate = metricCalculations.calculateAttendanceRate(attendanceRecords, {
      lateCountsAsPresent: settings.attendance.lateCountsAsPresent,
      excusedCountsInDenominator: settings.attendance.excusedCountsInDenominator
    });

    let present = 0;
    let late = 0;
    let absent = 0;
    let excused = 0;

    for (const a of attendanceRecords) {
      if (a.attendanceStatus === 'present') present++;
      else if (a.attendanceStatus === 'late') late++;
      else if (a.attendanceStatus === 'absent') absent++;
      else if (a.attendanceStatus === 'excused') excused++;
    }

    // Load recent session dates
    const recent = attendanceRecords
      .slice(-15)
      .reverse();

    const recentSessions = await Promise.all(
      recent.map(async a => {
        const session = await sessionRepository.getById(organisationId, a.sessionId);
        return {
          sessionId: a.sessionId,
          date: session?.date || a.createdAt.split('T')[0],
          sessionTitle: session ? `${session.sessionType.toUpperCase()} - ${session.startTime}` : 'Session',
          status: a.attendanceStatus as 'present' | 'late' | 'absent' | 'excused'
        };
      })
    );

    return {
      learnerId,
      attendanceRate: rate,
      presentCount: present,
      lateCount: late,
      absentCount: absent,
      excusedCount: excused,
      totalEvaluatedSessions: attendanceRecords.length,
      recentSessions
    };
  },

  /**
   * Retrieves events where linked learners are participants.
   */
  async getEvents(organisationId: string, userId: string, learnerId?: string): Promise<GuardianEventDto[]> {
    const { guardian, linkedLearners, portalSettings } = await guardianAccessService.resolveGuardianContext(organisationId, userId);
    guardianAccessService.assertFeatureEnabled(portalSettings, 'showEvents');

    const targetLearnerIds = learnerId ? [learnerId] : linkedLearners.map(l => l.id);
    for (const lid of targetLearnerIds) {
      await guardianAccessService.assertLearnerAccess(organisationId, guardian.id, lid);
    }

    const allParticipants = await eventParticipantRepository.getByOrganisation(organisationId);
    const relevantParticipants = allParticipants.filter(p => targetLearnerIds.includes(p.learnerId) && p.participationStatus !== 'withdrawn');

    const eventIds = Array.from(new Set(relevantParticipants.map(p => p.eventId)));
    const events: GuardianEventDto[] = [];

    for (const eid of eventIds) {
      const event = await eventRepository.getById(organisationId, eid);
      if (!event || event.eventStatus === 'cancelled') continue;

      const participant = relevantParticipants.find(p => p.eventId === eid);

      // Check Consent Request
      const allConsentRequests = await consentRequestRepository.getByOrganisation(organisationId);
      const consentReq = allConsentRequests.find(r => r.eventId === eid && targetLearnerIds.includes(r.learnerId));

      let consentStatus: 'pending' | 'submitted' | 'approved' | 'declined' | 'not_required' = 'not_required';
      let consentRequestId: string | undefined;

      if (consentReq) {
        consentRequestId = consentReq.id;
        const allSubmissions = await consentSubmissionRepository.getByOrganisation(organisationId);
        const sub = allSubmissions.find(s => s.consentRequestId === consentReq.id && s.submissionStatus !== 'superseded');
        if (!sub) {
          consentStatus = 'pending';
        } else {
          consentStatus = sub.submissionStatus as 'submitted' | 'approved' | 'declined';
        }
      }

      // Check Transport Status
      let transportStatus: 'not_booked' | 'booked' | 'boarded' | 'returned' = 'not_booked';
      const allPassengers = await transportPassengerRepository.getByOrganisation(organisationId);
      const passenger = allPassengers.find(p => p.eventId === eid && targetLearnerIds.includes(p.learnerId || ''));
      if (passenger && passenger.boardingStatus !== 'cancelled') {
        if (passenger.returnStatus === 'returned') transportStatus = 'returned';
        else if (passenger.boardingStatus === 'boarded') transportStatus = 'boarded';
        else transportStatus = 'booked';
      }

      events.push({
        id: event.id,
        name: event.name,
        eventType: event.eventType,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate || event.startDate,
        startTime: event.startTime,
        endTime: event.endTime,
        venue: event.venue || 'TBA',
        address: event.address,
        participationStatus: (participant?.participationStatus as never) || 'confirmed',
        consentRequired: !!consentReq,
        consentStatus,
        consentRequestId,
        transportAvailable: !!passenger,
        transportStatus,
        scheduleSummary: event.notes
      });
    }

    events.sort((a, b) => a.startDate.localeCompare(b.startDate));
    return events;
  },

  /**
   * Retrieves pending and historical consents for linked learners.
   */
  async getConsentList(organisationId: string, userId: string, learnerId?: string): Promise<GuardianConsentDetailDto[]> {
    const { guardian, linkedLearners } = await guardianAccessService.resolveGuardianContext(organisationId, userId);
    const targetLearnerIds = learnerId ? [learnerId] : linkedLearners.map(l => l.id);

    for (const lid of targetLearnerIds) {
      await guardianAccessService.assertLearnerAccess(organisationId, guardian.id, lid);
    }

    const allRequests = await consentRequestRepository.getByOrganisation(organisationId);
    const relevantRequests = allRequests.filter(r => targetLearnerIds.includes(r.learnerId));

    const allSubmissions = await consentSubmissionRepository.getByOrganisation(organisationId);

    const consentList: GuardianConsentDetailDto[] = await Promise.all(
      relevantRequests.map(async req => {
        const event = await eventRepository.getById(organisationId, req.eventId);
        const learner = linkedLearners.find(l => l.id === req.learnerId);
        const sub = allSubmissions.find(s => s.consentRequestId === req.id && s.submissionStatus !== 'superseded');
        const template = req.templateId ? await consentTemplateRepository.getById(organisationId, req.templateId) : null;

        return {
          requestId: req.id,
          eventId: req.eventId,
          eventTitle: event?.name || 'Event Consent',
          eventDate: event?.startDate || '',
          eventVenue: event?.venue || '',
          learnerId: req.learnerId,
          learnerName: learner ? `${learner.firstName} ${learner.lastName}` : 'Learner',
          deadline: req.dueDate,
          requiresTransportApproval: template?.requiresTransportApproval ?? false,
          requiresMedicalDeclaration: template?.requiresMedicalDeclaration ?? false,
          requiresIndemnity: template?.consentType === 'indemnity',
          indemnityText: template?.bodyText,
          submissionStatus: sub ? (sub.submissionStatus as never) : 'pending',
          participationApproved: sub?.participationApproved,
          transportApproved: sub?.transportApproved,
          indemnityAccepted: sub?.indemnityAccepted,
          medicalDeclaration: sub?.medicalConditions,
          additionalInfo: sub?.notes,
          signedByGuardianName: sub?.signatureName || sub?.guardianName,
          signedAt: sub?.signatureTimestamp
        };
      })
    );

    return consentList;
  },

  /**
   * Submits structured guardian consent with historical audit and non-destructive versioning.
   */
  async submitConsent(
    organisationId: string,
    userId: string,
    consentRequestId: string,
    input: {
      participationApproved: boolean;
      transportApproved?: boolean;
      indemnityAccepted?: boolean;
      medicalDeclaration?: string;
      additionalInfo?: string;
    }
  ): Promise<ConsentSubmission> {
    const { guardian } = await guardianAccessService.resolveGuardianContext(organisationId, userId);
    const req = await consentRequestRepository.getById(organisationId, consentRequestId);
    if (!req) throw new Error('Consent request not found.');

    await guardianAccessService.assertLearnerAccess(organisationId, guardian.id, req.learnerId);

    const submission = await consentSubmissionService.submitConsent(
      organisationId,
      {
        consentRequestId,
        eventId: req.eventId,
        learnerId: req.learnerId,
        guardianId: guardian.id,
        participationApproved: input.participationApproved,
        transportApproved: input.transportApproved ?? false,
        indemnityAccepted: input.indemnityAccepted ?? false,
        medicalConditions: input.medicalDeclaration,
        notes: input.additionalInfo,
        guardianName: `${guardian.firstName} ${guardian.lastName}`.trim(),
        signatureName: `${guardian.firstName} ${guardian.lastName}`.trim(),
        signatureTimestamp: new Date().toISOString()
      },
      userId
    );

    await auditService.log(
      organisationId,
      userId,
      'GUARDIAN_SUBMIT_CONSENT',
      'consentSubmissions',
      submission.id,
      null,
      { consentRequestId, participationApproved: input.participationApproved }
    );

    return submission;
  },

  /**
   * Retrieves transport itineraries and boarding status for linked learners.
   */
  async getTransportPlans(organisationId: string, userId: string, learnerId?: string): Promise<GuardianTransportPlanDto[]> {
    const { guardian, linkedLearners, portalSettings } = await guardianAccessService.resolveGuardianContext(organisationId, userId);
    guardianAccessService.assertFeatureEnabled(portalSettings, 'showTransport');

    const targetLearnerIds = learnerId ? [learnerId] : linkedLearners.map(l => l.id);
    for (const lid of targetLearnerIds) {
      await guardianAccessService.assertLearnerAccess(organisationId, guardian.id, lid);
    }

    const allPassengers = await transportPassengerRepository.getByOrganisation(organisationId);
    const learnerPassengers = allPassengers.filter(p => targetLearnerIds.includes(p.learnerId || '') && p.boardingStatus !== 'cancelled');

    const plans: GuardianTransportPlanDto[] = [];
    for (const passenger of learnerPassengers) {
      const plan = await eventTransportPlanRepository.getById(organisationId, passenger.eventTransportPlanId);
      if (!plan || plan.transportStatus === 'cancelled') continue;
      const event = await eventRepository.getById(organisationId, plan.eventId);

      plans.push({
        planId: plan.id,
        eventId: plan.eventId,
        eventTitle: event?.name || 'Event Transport',
        planName: plan.planName,
        pickupLocation: plan.pickupLocation,
        destination: plan.destination,
        departureDate: plan.departureDate,
        departureTime: plan.departureTime,
        returnDate: plan.returnDate,
        returnTime: plan.returnTime,
        meetingTime: plan.meetingTime,
        boardingStatus: passenger.boardingStatus,
        returnStatus: passenger.returnStatus,
        seatNumber: passenger.seatNumber,
        notes: plan.notes
      });
    }

    plans.sort((a, b) => `${a.departureDate} ${a.departureTime}`.localeCompare(`${b.departureDate} ${b.departureTime}`));
    return plans;
  },

  /**
   * Retrieves financial summary, invoices, and payments for a learner.
   */
  async getFinance(organisationId: string, userId: string, learnerId: string): Promise<GuardianFinanceSummaryDto> {
    const { guardian, portalSettings } = await guardianAccessService.resolveGuardianContext(organisationId, userId);
    guardianAccessService.assertFeatureEnabled(portalSettings, 'showFinance');
    await guardianAccessService.assertFinancialAccess(organisationId, guardian.id, learnerId);

    const learner = (await guardianAccessService.assertLearnerAccess(organisationId, guardian.id, learnerId)).learner;
    const settings = await organisationSettingsService.getSettings(organisationId);

    // Invoices for this learner
    const allInvoices = await invoiceRepository.getByLearner(organisationId, learnerId);
    const activeInvoices = allInvoices.filter(i => i.invoiceStatus !== 'cancelled');

    const invoiceDtos: GuardianInvoiceDto[] = await Promise.all(
      activeInvoices.map(async inv => {
        const lineItems = await invoiceLineItemRepository.getByInvoice(organisationId, inv.id);
        return {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          learnerId: inv.learnerId,
          learnerName: `${learner.firstName} ${learner.lastName}`,
          issueDate: inv.issueDate,
          dueDate: inv.dueDate,
          currency: inv.currency,
          subtotalCents: inv.subtotal,
          discountCents: inv.discountTotal,
          totalCents: inv.total,
          amountPaidCents: inv.amountPaid,
          balanceCents: inv.balance,
          invoiceStatus: inv.invoiceStatus,
          lineItems: lineItems.map(li => ({
            description: li.description,
            quantity: li.quantity,
            unitAmountCents: li.unitAmount,
            lineTotalCents: li.lineTotal
          }))
        };
      })
    );

    // Payments for this learner
    const allPayments = await paymentRepository.getByLearner(organisationId, learnerId);
    const validPayments = allPayments.filter(p => p.paymentStatus !== 'reversed');

    const paymentDtos: GuardianPaymentDto[] = await Promise.all(
      validPayments.map(async p => {
        const allAllocations = await paymentAllocationRepository.getByOrganisation(organisationId);
        const pAllocations = allAllocations.filter(a => a.paymentId === p.id);
        const allocations = await Promise.all(
          pAllocations.map(async a => {
            const inv = await invoiceRepository.getById(organisationId, a.invoiceId);
            return {
              invoiceNumber: inv?.invoiceNumber || 'INV',
              amountCents: a.amount
            };
          })
        );

        return {
          id: p.id,
          paymentDate: p.createdAt.split('T')[0],
          amountCents: p.amount,
          currency: p.currency,
          paymentMethod: p.paymentMethod,
          reference: p.reference || p.externalReference,
          receiptNumber: `${settings.finance.receiptPrefix}${p.id.slice(0, 6).toUpperCase()}`,
          allocations
        };
      })
    );

    const totalInvoicedCents = activeInvoices.reduce((acc, i) => acc + (i.total || 0), 0);
    const totalPaidCents = activeInvoices.reduce((acc, i) => acc + (i.amountPaid || 0), 0);
    const outstandingBalanceCents = activeInvoices.reduce((acc, i) => acc + (i.balance || 0), 0);

    return {
      learnerId,
      learnerName: `${learner.firstName} ${learner.lastName}`,
      totalInvoicedCents,
      totalPaidCents,
      outstandingBalanceCents,
      currency: settings.finance.defaultCurrency || 'ZAR',
      invoices: invoiceDtos,
      recentPayments: paymentDtos,
      paymentInstructions: {
        accountHolder: settings.profile.name,
        referenceFormat: `${learner.lastName.toUpperCase()}-${learner.id.slice(0, 4).toUpperCase()}`
      }
    };
  },

  /**
   * Retrieves single invoice view with line items.
   */
  async getInvoice(organisationId: string, userId: string, invoiceId: string): Promise<GuardianInvoiceDto> {
    const { guardian } = await guardianAccessService.resolveGuardianContext(organisationId, userId);
    const invoice = await invoiceRepository.getById(organisationId, invoiceId);
    if (!invoice || invoice.invoiceStatus === 'cancelled') throw new Error('Invoice not found.');

    await guardianAccessService.assertFinancialAccess(organisationId, guardian.id, invoice.learnerId);
    const learner = (await guardianAccessService.assertLearnerAccess(organisationId, guardian.id, invoice.learnerId)).learner;
    const lineItems = await invoiceLineItemRepository.getByInvoice(organisationId, invoice.id);

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      learnerId: invoice.learnerId,
      learnerName: `${learner.firstName} ${learner.lastName}`,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency,
      subtotalCents: invoice.subtotal,
      discountCents: invoice.discountTotal,
      totalCents: invoice.total,
      amountPaidCents: invoice.amountPaid,
      balanceCents: invoice.balance,
      invoiceStatus: invoice.invoiceStatus,
      lineItems: lineItems.map(li => ({
        description: li.description,
        quantity: li.quantity,
        unitAmountCents: li.unitAmount,
        lineTotalCents: li.lineTotal
      }))
    };
  },

  /**
   * Retrieves official receipt data for a payment.
   */
  async getReceipt(organisationId: string, userId: string, paymentId: string): Promise<ReceiptData | null> {
    const { guardian } = await guardianAccessService.resolveGuardianContext(organisationId, userId);
    const payment = await paymentRepository.getById(organisationId, paymentId);
    if (!payment) throw new Error('Payment record not found.');

    if (payment.learnerId) {
      await guardianAccessService.assertFinancialAccess(organisationId, guardian.id, payment.learnerId);
    }

    return receiptService.getReceiptForPayment(organisationId, paymentId);
  },

  /**
   * Retrieves portal-safe documents linked to learners or flagged for guardians.
   */
  async getDocuments(organisationId: string, userId: string, learnerId?: string): Promise<GuardianDocumentDto[]> {
    const { guardian, linkedLearners, portalSettings } = await guardianAccessService.resolveGuardianContext(organisationId, userId);
    guardianAccessService.assertFeatureEnabled(portalSettings, 'showDocuments');

    const targetLearnerIds = learnerId ? [learnerId] : linkedLearners.map(l => l.id);
    for (const lid of targetLearnerIds) {
      await guardianAccessService.assertLearnerAccess(organisationId, guardian.id, lid);
    }

    const allDocs = await documentRepository.getByOrganisation(organisationId);
    const allLinks = await documentLinkRepository.getByOrganisation(organisationId);

    // Filter documents: must have portalVisibility === 'guardian' OR 'public'
    // AND must either be general or linked to permitted learner
    const guardianDocs: GuardianDocumentDto[] = [];

    for (const doc of allDocs) {
      if (doc.documentStatus !== 'active') continue;
      const isGuardianVisible = doc.portalVisibility === 'guardian' || doc.portalVisibility === 'public';
      if (!isGuardianVisible) continue;

      const links = allLinks.filter(l => l.documentId === doc.id);
      const learnerLink = links.find(l => l.entityType === 'learner' && targetLearnerIds.includes(l.entityId));

      // If document is linked to an entity, ensure it's an authorized learner or guardian
      if (links.length > 0 && !learnerLink && !links.some(l => l.entityType === 'guardian' && l.entityId === guardian.id)) {
        continue;
      }

      let relatedLearnerName: string | undefined;
      if (learnerLink) {
        const l = linkedLearners.find(item => item.id === learnerLink.entityId);
        if (l) relatedLearnerName = `${l.firstName} ${l.lastName}`;
      }

      guardianDocs.push({
        id: doc.id,
        name: doc.name,
        documentType: doc.documentType,
        fileName: doc.fileName,
        downloadUrl: doc.downloadUrl,
        fileSize: doc.fileSize,
        createdAt: doc.createdAt,
        relatedLearnerName
      });
    }

    return guardianDocs;
  },

  /**
   * Retrieves communication history where the guardian was an explicit recipient.
   */
  async getMessages(organisationId: string, userId: string): Promise<GuardianMessageDto[]> {
    const { guardian, linkedLearners } = await guardianAccessService.resolveGuardianContext(organisationId, userId);

    const allRecipients = await communicationRecipientRepository.getByOrganisation(organisationId);
    const guardianRecipients = allRecipients.filter(r =>
      (r.guardianId && r.guardianId === guardian.id) ||
      (r.recipientEmail && guardian.email && r.recipientEmail.toLowerCase() === guardian.email.toLowerCase())
    );

    const communicationIds = Array.from(new Set(guardianRecipients.map(r => r.communicationId)));
    const messages: GuardianMessageDto[] = [];

    for (const cid of communicationIds) {
      const comm = await communicationRepository.getById(organisationId, cid);
      if (!comm || comm.communicationStatus === 'cancelled' || comm.communicationStatus === 'draft') continue;

      let relatedLearnerName: string | undefined;
      if (comm.relatedEntityType === 'learner' && comm.relatedEntityId) {
        const l = linkedLearners.find(item => item.id === comm.relatedEntityId);
        if (l) relatedLearnerName = `${l.firstName} ${l.lastName}`;
      }

      messages.push({
        id: comm.id,
        communicationType: comm.communicationType,
        channel: comm.channel,
        subject: comm.subject,
        body: comm.body,
        sentAt: comm.sentAt || comm.createdAt,
        relatedLearnerName
      });
    }

    messages.sort((a, b) => (b.sentAt || '').localeCompare(a.sentAt || ''));
    return messages;
  },

  /**
   * Retrieves guardian profile and linked children.
   */
  async getProfile(organisationId: string, userId: string): Promise<GuardianProfileDto> {
    const { guardian, linkedLearnerGuardians, linkedLearners } =
      await guardianAccessService.resolveGuardianContext(organisationId, userId);

    const linkedLearnersSummary = linkedLearnerGuardians.map(rel => {
      const l = linkedLearners.find(item => item.id === rel.learnerId);
      return {
        learnerId: rel.learnerId,
        learnerName: l ? `${l.firstName} ${l.lastName}` : 'Child',
        relationshipType: rel.relationshipType || 'Parent/Guardian',
        financialContact: rel.financialContact,
        emergencyContact: rel.emergencyContact
      };
    });

    return {
      id: guardian.id,
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      email: guardian.email,
      mobileNumber: guardian.mobileNumber,
      address: guardian.address,
      communicationPreference: guardian.communicationPreference,
      linkedLearners: linkedLearnersSummary
    };
  },

  /**
   * Updates guardian contact details or creates a change request depending on policy.
   */
  async updateProfile(
    organisationId: string,
    userId: string,
    input: {
      mobileNumber?: string;
      email?: string;
      address?: string;
      communicationPreference?: string;
    }
  ): Promise<{ updatedDirectly: boolean; changeRequestId?: string }> {
    const { guardian, portalSettings } = await guardianAccessService.resolveGuardianContext(organisationId, userId);
    guardianAccessService.assertFeatureEnabled(portalSettings, 'allowContactUpdates');

    if (portalSettings.allowDirectProfileEdit) {
      const before = { ...guardian };
      await guardianRepository.update(organisationId, userId, guardian.id, {
        mobileNumber: input.mobileNumber?.trim() || guardian.mobileNumber,
        email: input.email ? input.email.trim().toLowerCase() : guardian.email,
        address: input.address !== undefined ? input.address.trim() : guardian.address,
        communicationPreference: input.communicationPreference || guardian.communicationPreference
      } as never);

      await auditService.log(
        organisationId,
        userId,
        'GUARDIAN_UPDATE_CONTACT',
        'guardians',
        guardian.id,
        before,
        input
      );

      return { updatedDirectly: true };
    } else {
      // Create pending change request for staff review
      const req = await this.createChangeRequest(organisationId, userId, {
        requestType: 'contact_details',
        description: `Update requested: Mobile: ${input.mobileNumber || guardian.mobileNumber}, Address: ${input.address || guardian.address}`,
        newValue: JSON.stringify(input)
      });
      return { updatedDirectly: false, changeRequestId: req.id };
    }
  },

  /**
   * Creates a formal profile change request for staff review.
   */
  async createChangeRequest(
    organisationId: string,
    userId: string,
    input: {
      requestType: PortalChangeRequestType;
      fieldName?: string;
      oldValue?: string;
      newValue?: string;
      description?: string;
    }
  ): Promise<PortalChangeRequest> {
    const { guardian } = await guardianAccessService.resolveGuardianContext(organisationId, userId);

    const req = await portalChangeRequestRepository.create(organisationId, userId, {
      guardianId: guardian.id,
      userId,
      requestType: input.requestType,
      fieldName: input.fieldName,
      oldValue: input.oldValue,
      newValue: input.newValue,
      description: input.description,
      requestStatus: 'pending',
      submittedAt: new Date().toISOString()
    } as never);

    await auditService.log(
      organisationId,
      userId,
      'GUARDIAN_CREATE_CHANGE_REQUEST',
      'portalChangeRequests',
      req.id,
      null,
      input
    );

    return req;
  }
};
