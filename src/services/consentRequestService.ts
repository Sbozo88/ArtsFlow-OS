import { consentRequestRepository } from '../repositories/consentRequestRepository';
import { eventRepository } from '../repositories/eventRepository';
import { learnerRepository } from '../repositories/learnerRepository';
import { consentTemplateRepository } from '../repositories/consentTemplateRepository';
import { eventParticipantRepository } from '../repositories/eventParticipantRepository';
import { learnerGuardianRepository } from '../repositories/learnerGuardianRepository';
import { ConsentRequest } from '../types';
import { auditService } from './auditService';

export const consentRequestService = {
  async getConsentRequests(organisationId: string, eventId?: string): Promise<ConsentRequest[]> {
    const all = await consentRequestRepository.getByOrganisation(organisationId);
    if (eventId) {
      return all.filter(r => r.eventId === eventId);
    }
    return all;
  },

  async getConsentRequest(organisationId: string, id: string): Promise<ConsentRequest | null> {
    return consentRequestRepository.getById(organisationId, id);
  },

  async createConsentRequest(
    organisationId: string,
    data: Omit<ConsentRequest, keyof import('../types').BaseRecord | 'organisationId'>,
    userId: string
  ): Promise<ConsentRequest> {
    // 1. Validation of related entities
    const event = await eventRepository.getById(organisationId, data.eventId);
    if (!event) throw new Error('Event not found or does not belong to this organisation');

    const learner = await learnerRepository.getById(organisationId, data.learnerId);
    if (!learner) throw new Error('Learner not found or does not belong to this organisation');

    const template = await consentTemplateRepository.getById(organisationId, data.templateId);
    if (!template) throw new Error('Consent template not found or does not belong to this organisation');

    // 2. Duplicate prevention for same eventId + same learnerId + same templateId
    const existingRequests = await this.getConsentRequests(organisationId, data.eventId);
    const hasActiveDuplicate = existingRequests.some(
      r => r.learnerId === data.learnerId &&
           r.templateId === data.templateId &&
           !['cancelled', 'expired'].includes(r.requestStatus)
    );

    if (hasActiveDuplicate) {
      throw new Error('An active consent request already exists for this learner and template in this event');
    }

    const newRequest = await consentRequestRepository.create(organisationId, userId, {
      ...data,
      requestedAt: data.requestedAt || new Date().toISOString(),
      requestStatus: data.requestStatus || 'pending'
    } as never);

    await auditService.log(
      organisationId,
      userId,
      'CREATE_CONSENT_REQUEST',
      'consentRequests',
      newRequest.id,
      undefined,
      newRequest
    );

    return newRequest;
  },

  async generateRequestsForConfirmedParticipants(
    organisationId: string,
    eventId: string,
    templateId: string,
    userId: string,
    dueDate?: string
  ): Promise<{ created: number; skipped: number }> {
    const event = await eventRepository.getById(organisationId, eventId);
    if (!event) throw new Error('Event not found');

    const template = await consentTemplateRepository.getById(organisationId, templateId);
    if (!template) throw new Error('Consent template not found');

    const allParticipants = await eventParticipantRepository.getByOrganisation(organisationId);
    const confirmedParticipants = allParticipants.filter(
      p => p.eventId === eventId && p.participationStatus === 'confirmed'
    );

    const existingRequests = await this.getConsentRequests(organisationId, eventId);
    const learnerGuardians = await learnerGuardianRepository.getByOrganisation(organisationId);

    let created = 0;
    let skipped = 0;

    for (const participant of confirmedParticipants) {
      const alreadyHasActive = existingRequests.some(
        r => r.learnerId === participant.learnerId &&
             r.templateId === templateId &&
             !['cancelled', 'expired'].includes(r.requestStatus)
      );

      if (alreadyHasActive) {
        skipped++;
        continue;
      }

      // Find primary or first guardian
      const links = learnerGuardians.filter(lg => lg.learnerId === participant.learnerId);
      const primaryLink = links.find(lg => lg.primaryContact) || links[0];
      const guardianId = primaryLink?.guardianId;

      await consentRequestRepository.create(organisationId, userId, {
        eventId,
        learnerId: participant.learnerId,
        guardianId,
        templateId,
        requestStatus: 'pending',
        requestedAt: new Date().toISOString(),
        dueDate
      } as never);

      created++;
    }

    return { created, skipped };
  },

  async updateConsentRequest(
    organisationId: string,
    id: string,
    updates: Partial<Omit<ConsentRequest, keyof import('../types').BaseRecord | 'organisationId'>>,
    userId: string
  ): Promise<void> {
    const existing = await this.getConsentRequest(organisationId, id);
    if (!existing) throw new Error('Consent request not found');

    await consentRequestRepository.update(organisationId, userId, id, updates as never);
  },

  async cancelConsentRequest(
    organisationId: string,
    id: string,
    userId: string,
    notes?: string
  ): Promise<void> {
    const existing = await this.getConsentRequest(organisationId, id);
    if (!existing) throw new Error('Consent request not found');

    await consentRequestRepository.update(organisationId, userId, id, {
      requestStatus: 'cancelled',
      notes: notes || existing.notes
    } as never);

    const updated = await this.getConsentRequest(organisationId, id);
    await auditService.log(
      organisationId,
      userId,
      'CANCEL_CONSENT_REQUEST',
      'consentRequests',
      id,
      existing,
      updated
    );
  }
};
