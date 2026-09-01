import { eventParticipantRepository } from '../repositories/eventParticipantRepository';
import { EventParticipant, AuditAction } from '../types';
import { auditService } from './auditService';
import { eventRepository } from '../repositories/eventRepository';
import { learnerRepository } from '../repositories/learnerRepository';

export const eventParticipantService = {
  async getEventParticipants(organisationId: string, eventId: string): Promise<EventParticipant[]> {
    const participants = await eventParticipantRepository.getByOrganisation(organisationId);
    return participants.filter(p => p.eventId === eventId);
  },

  async addEventParticipant(
    organisationId: string,
    data: Omit<EventParticipant, keyof import('../types').BaseRecord | 'organisationId'>,
    userId: string
  ): Promise<EventParticipant> {
    const event = await eventRepository.getById(organisationId, data.eventId);
    if (!event) throw new Error('Event not found');

    const learner = await learnerRepository.getById(organisationId, data.learnerId);
    if (!learner) throw new Error('Learner not found');

    const existing = await this.getEventParticipants(organisationId, data.eventId);
    if (existing.some(p => p.learnerId === data.learnerId)) {
      throw new Error('Learner is already a participant in this event');
    }

    const participant = await eventParticipantRepository.create(organisationId, userId, data as never);
    await auditService.log(
      organisationId,
      userId,
      'ADD_EVENT_PARTICIPANT',
      'eventParticipants',
      participant.id,
      undefined,
      participant
    );
    return participant;
  },

  async updateEventParticipant(
    organisationId: string,
    id: string,
    updates: Partial<Omit<EventParticipant, keyof import('../types').BaseRecord | 'organisationId'>>,
    userId: string
  ): Promise<void> {
    const existing = await eventParticipantRepository.getById(organisationId, id);
    if (!existing) throw new Error('Participant not found');

    await eventParticipantRepository.update(organisationId, userId, id, updates as never);
    
    let action: AuditAction = 'UPDATE_EVENT_PARTICIPANT';
    if (updates.participationStatus === 'withdrawn') action = 'WITHDRAW_EVENT_PARTICIPANT';

    const updated = await eventParticipantRepository.getById(organisationId, id);
    await auditService.log(
      organisationId,
      userId,
      action,
      'eventParticipants',
      id,
      existing,
      updated
    );
  },

  async removeEventParticipant(organisationId: string, id: string, userId: string): Promise<void> {
    const existing = await eventParticipantRepository.getById(organisationId, id);
    if (!existing) throw new Error('Participant not found');

    await eventParticipantRepository.softDelete(organisationId, userId, id);
    await auditService.log(
      organisationId,
      userId,
      'DELETE' as never,
      'eventParticipants',
      id,
      existing,
      { ...existing, status: 'deleted' }
    );
  }
};