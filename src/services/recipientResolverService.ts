import { learnerRepository } from '../repositories/learnerRepository';
import { guardianRepository } from '../repositories/guardianRepository';
import { learnerGuardianRepository } from '../repositories/learnerGuardianRepository';
import { staffRepository } from '../repositories/staffRepository';
import { enrolmentRepository } from '../repositories/enrolmentRepository';
import { eventParticipantRepository } from '../repositories/eventParticipantRepository';
import { eventStaffRepository } from '../repositories/eventStaffRepository';
import { consentRequestRepository } from '../repositories/consentRequestRepository';
import { transportPassengerRepository } from '../repositories/transportPassengerRepository';
import { invoiceRepository } from '../repositories/invoiceRepository';
import { formatMoney } from '../lib/money';
import type { 
  CommunicationChannel, 
  CommunicationRecipient, 
  BaseRecord 
} from '../types';

export type AudienceType =
  | 'all_guardians'
  | 'programme_guardians'
  | 'group_guardians'
  | 'event_participants'
  | 'event_staff'
  | 'transport_passengers'
  | 'missing_consent'
  | 'outstanding_invoices'
  | 'staff'
  | 'single_guardian'
  | 'single_learner';

export interface ResolveAudienceInput {
  audienceType: AudienceType;
  channel: CommunicationChannel;
  programmeId?: string;
  groupId?: string;
  eventId?: string;
  transportPlanId?: string;
  consentRequestId?: string;
  guardianId?: string;
  learnerId?: string;
  staffIds?: string[];
  invoiceIds?: string[];
}

export type RecipientDraft = Omit<CommunicationRecipient, keyof BaseRecord | 'communicationId'>;

export interface ResolvedAudienceResult {
  recipients: RecipientDraft[];
  totalCount: number;
  missingEmailCount: number;
  missingPhoneCount: number;
  mergeContexts: Record<string, Record<string, string>>; // Keyed by recipient identifier (guardianId/learnerId/staffId)
}

export const recipientResolverService = {
  async resolveAudience(
    organisationId: string,
    input: ResolveAudienceInput
  ): Promise<ResolvedAudienceResult> {
    const drafts: RecipientDraft[] = [];
    const mergeContexts: Record<string, Record<string, string>> = {};

    // Load common datasets
    const [allLearners, allGuardians, allLinks, allStaff] = await Promise.all([
      learnerRepository.getByOrganisation(organisationId),
      guardianRepository.getByOrganisation(organisationId),
      learnerGuardianRepository.getByOrganisation(organisationId),
      staffRepository.getByOrganisation(organisationId)
    ]);

    const learnerMap = new Map(allLearners.map(l => [l.id, l]));
    const guardianMap = new Map(allGuardians.map(g => [g.id, g]));
    const staffMap = new Map(allStaff.map(s => [s.id, s]));

    const addGuardianRecipient = (
      guardianId: string,
      learnerId?: string,
      extraContext?: Record<string, string>
    ) => {
      const guardian = guardianMap.get(guardianId);
      if (!guardian) return;

      const learner = learnerId ? learnerMap.get(learnerId) : undefined;
      const key = `${guardian.id}_${learnerId || 'none'}`;

      // Prevent exact duplicate drafts
      if (drafts.some(d => d.guardianId === guardian.id && d.learnerId === learnerId)) {
        return;
      }

      drafts.push({
        recipientType: 'guardian',
        guardianId: guardian.id,
        learnerId: learner?.id,
        recipientName: `${guardian.firstName} ${guardian.lastName}`.trim(),
        recipientEmail: guardian.email?.trim() || undefined,
        recipientPhone: guardian.mobileNumber?.trim() || undefined,
        deliveryStatus: 'pending',
        deliveryChannel: input.channel
      });

      mergeContexts[key] = {
        guardianFirstName: guardian.firstName,
        guardianLastName: guardian.lastName,
        guardianFullName: `${guardian.firstName} ${guardian.lastName}`.trim(),
        guardianEmail: guardian.email || '',
        guardianPhone: guardian.mobileNumber || '',
        learnerFirstName: learner?.firstName || '',
        learnerLastName: learner?.lastName || '',
        learnerFullName: learner ? `${learner.firstName} ${learner.lastName}`.trim() : '',
        ...(extraContext || {})
      };
    };

    const addStaffRecipient = (staffId: string, extraContext?: Record<string, string>) => {
      const staffMember = staffMap.get(staffId);
      if (!staffMember) return;
      if (drafts.some(d => d.staffId === staffMember.id)) return;

      drafts.push({
        recipientType: 'staff',
        staffId: staffMember.id,
        recipientName: `${staffMember.firstName} ${staffMember.lastName}`.trim(),
        recipientEmail: staffMember.email?.trim() || undefined,
        recipientPhone: staffMember.mobileNumber?.trim() || undefined,
        deliveryStatus: 'pending',
        deliveryChannel: input.channel
      });

      mergeContexts[staffMember.id] = {
        staffFirstName: staffMember.firstName,
        staffLastName: staffMember.lastName,
        staffFullName: `${staffMember.firstName} ${staffMember.lastName}`.trim(),
        staffEmail: staffMember.email || '',
        staffPhone: staffMember.mobileNumber || '',
        staffRole: staffMember.role || '',
        ...(extraContext || {})
      };
    };

    switch (input.audienceType) {
      case 'all_guardians': {
        for (const guardian of allGuardians) {
          addGuardianRecipient(guardian.id);
        }
        break;
      }

      case 'programme_guardians': {
        if (!input.programmeId) break;
        const allEnrolments = await enrolmentRepository.getByOrganisation(organisationId);
        const activeEnrolments = allEnrolments.filter(
          e => e.programmeId === input.programmeId && e.enrolmentStatus === 'active'
        );
        const learnerIds = new Set(activeEnrolments.map(e => e.learnerId));

        for (const link of allLinks) {
          if (learnerIds.has(link.learnerId)) {
            addGuardianRecipient(link.guardianId, link.learnerId);
          }
        }
        break;
      }

      case 'group_guardians': {
        if (!input.groupId) break;
        const allEnrolments = await enrolmentRepository.getByOrganisation(organisationId);
        const groupEnrolments = allEnrolments.filter(
          e => e.groupId === input.groupId && e.enrolmentStatus === 'active'
        );
        const learnerIds = new Set(groupEnrolments.map(e => e.learnerId));

        for (const link of allLinks) {
          if (learnerIds.has(link.learnerId)) {
            addGuardianRecipient(link.guardianId, link.learnerId);
          }
        }
        break;
      }

      case 'event_participants': {
        if (!input.eventId) break;
        const allParticipants = await eventParticipantRepository.getByOrganisation(organisationId);
        const eventParticipants = allParticipants.filter(
          p => p.eventId === input.eventId && p.participationStatus !== 'withdrawn'
        );
        const participantLearnerIds = new Set(eventParticipants.map(p => p.learnerId));

        for (const link of allLinks) {
          if (participantLearnerIds.has(link.learnerId)) {
            addGuardianRecipient(link.guardianId, link.learnerId);
          }
        }
        break;
      }

      case 'event_staff': {
        if (!input.eventId) break;
        const allEventStaff = await eventStaffRepository.getByOrganisation(organisationId);
        const eventStaff = allEventStaff.filter(
          s => s.eventId === input.eventId && s.participationStatus !== 'withdrawn'
        );
        for (const es of eventStaff) {
          addStaffRecipient(es.staffId);
        }
        break;
      }

      case 'transport_passengers': {
        if (!input.transportPlanId) break;
        const allPassengers = await transportPassengerRepository.getByOrganisation(organisationId);
        const passengers = allPassengers.filter(
          p => p.eventTransportPlanId === input.transportPlanId && p.boardingStatus !== 'cancelled'
        );
        for (const p of passengers) {
          if (p.passengerType === 'learner' && p.learnerId) {
            const learnerLinks = allLinks.filter(l => l.learnerId === p.learnerId);
            for (const link of learnerLinks) {
              addGuardianRecipient(link.guardianId, link.learnerId, {
                seatNumber: p.seatNumber || ''
              });
            }
          } else if (p.passengerType === 'staff' && p.staffId) {
            addStaffRecipient(p.staffId, {
              seatNumber: p.seatNumber || ''
            });
          }
        }
        break;
      }

      case 'missing_consent': {
        if (!input.eventId) break;
        const allConsentRequests = await consentRequestRepository.getByOrganisation(organisationId);
        const pendingRequests = allConsentRequests.filter(
          cr => cr.eventId === input.eventId && (cr.requestStatus === 'pending' || cr.requestStatus === 'sent')
        );
        for (const req of pendingRequests) {
          const guardianId = req.guardianId || allLinks.find(l => l.learnerId === req.learnerId)?.guardianId;
          if (guardianId) {
            addGuardianRecipient(guardianId, req.learnerId, {
              consentLink: `${typeof window !== 'undefined' ? window.location?.origin : ''}/consent/submit/${req.id}`
            });
          }
        }
        break;
      }

      case 'outstanding_invoices': {
        const allInvoices = await invoiceRepository.getByOrganisation(organisationId);
        const targetInvoices = allInvoices.filter(inv => {
          if (inv.invoiceStatus === 'cancelled' || inv.balance <= 0) return false;
          if (input.invoiceIds && input.invoiceIds.length > 0) {
            return input.invoiceIds.includes(inv.id);
          }
          return inv.invoiceStatus === 'overdue' || inv.invoiceStatus === 'issued' || inv.invoiceStatus === 'partially_paid';
        });

        for (const inv of targetInvoices) {
          let guardianId = inv.guardianId;
          if (!guardianId) {
            const learnerLinks = allLinks.filter(l => l.learnerId === inv.learnerId);
            const financialLink = learnerLinks.find(l => l.financialContact) || learnerLinks[0];
            guardianId = financialLink?.guardianId;
          }
          if (guardianId) {
            addGuardianRecipient(guardianId, inv.learnerId, {
              invoiceNumber: inv.invoiceNumber,
              invoiceBalance: formatMoney(inv.balance, inv.currency || 'ZAR'),
              invoiceTotal: formatMoney(inv.total, inv.currency || 'ZAR'),
              invoiceDueDate: inv.dueDate || ''
            });
          }
        }
        break;
      }

      case 'staff': {
        if (input.staffIds && input.staffIds.length > 0) {
          for (const sId of input.staffIds) {
            addStaffRecipient(sId);
          }
        } else {
          for (const s of allStaff) {
            addStaffRecipient(s.id);
          }
        }
        break;
      }

      case 'single_guardian': {
        if (input.guardianId) {
          addGuardianRecipient(input.guardianId, input.learnerId);
        }
        break;
      }

      case 'single_learner': {
        if (input.learnerId) {
          const learner = learnerMap.get(input.learnerId);
          if (learner) {
            drafts.push({
              recipientType: 'learner',
              learnerId: learner.id,
              recipientName: `${learner.firstName} ${learner.lastName}`.trim(),
              deliveryStatus: 'pending',
              deliveryChannel: input.channel
            });
            mergeContexts[learner.id] = {
              learnerFirstName: learner.firstName,
              learnerLastName: learner.lastName,
              learnerFullName: `${learner.firstName} ${learner.lastName}`.trim()
            };
          }
        }
        break;
      }
    }

    const missingEmailCount = drafts.filter(d => !d.recipientEmail?.trim()).length;
    const missingPhoneCount = drafts.filter(d => !d.recipientPhone?.trim()).length;

    return {
      recipients: drafts,
      totalCount: drafts.length,
      missingEmailCount,
      missingPhoneCount,
      mergeContexts
    };
  }
};
