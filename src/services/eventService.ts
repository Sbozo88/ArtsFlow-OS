import { eventRepository } from '../repositories/eventRepository';
import { Event, AuditAction } from '../types';
import { auditService } from './auditService';

export const eventService = {
  async getEvents(organisationId: string): Promise<Event[]> {
    return eventRepository.getByOrganisation(organisationId);
  },

  async getEvent(organisationId: string, id: string): Promise<Event | null> {
    return eventRepository.getById(organisationId, id);
  },

  async createEvent(
    organisationId: string,
    data: Omit<Event, keyof import('../types').BaseRecord | 'organisationId'>,
    userId: string
  ): Promise<Event> {
    const event = await eventRepository.create(organisationId, userId, data as never);
    await auditService.log(
      organisationId,
      userId,
      'CREATE_EVENT',
      'events',
      event.id,
      undefined,
      event
    );
    return event;
  },

  async updateEvent(
    organisationId: string,
    id: string,
    updates: Partial<Omit<Event, keyof import('../types').BaseRecord | 'organisationId'>>,
    userId: string
  ): Promise<void> {
    const existing = await this.getEvent(organisationId, id);
    if (!existing) throw new Error('Event not found');

    await eventRepository.update(organisationId, userId, id, updates as never);
    
    let action: AuditAction = 'UPDATE_EVENT';
    if (updates.eventStatus === 'completed') action = 'COMPLETE_EVENT';
    if (updates.eventStatus === 'cancelled') action = 'CANCEL_EVENT';

    const updated = await eventRepository.getById(organisationId, id);
    await auditService.log(
      organisationId,
      userId,
      action,
      'events',
      id,
      existing,
      updated
    );
  },

  async deleteEvent(organisationId: string, id: string, userId: string): Promise<void> {
    const existing = await this.getEvent(organisationId, id);
    if (!existing) throw new Error('Event not found');

    await eventRepository.softDelete(organisationId, userId, id);
    await auditService.log(
      organisationId,
      userId,
      'DELETE' as never,
      'events',
      id,
      existing,
      { ...existing, status: 'deleted' }
    );
  }
};