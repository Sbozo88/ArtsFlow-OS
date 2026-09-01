import { eventStaffRepository } from '../repositories/eventStaffRepository';
import { EventStaff } from '../types';
import { auditService } from './auditService';
import { eventRepository } from '../repositories/eventRepository';
import { staffRepository } from '../repositories/staffRepository';

export const eventStaffService = {
  async getEventStaff(organisationId: string, eventId: string): Promise<EventStaff[]> {
    const staff = await eventStaffRepository.getByOrganisation(organisationId);
    return staff.filter(s => s.eventId === eventId);
  },

  async addEventStaff(
    organisationId: string,
    data: Omit<EventStaff, keyof import('../types').BaseRecord | 'organisationId'>,
    userId: string
  ): Promise<EventStaff> {
    const event = await eventRepository.getById(organisationId, data.eventId);
    if (!event) throw new Error('Event not found');

    const staffMember = await staffRepository.getById(organisationId, data.staffId);
    if (!staffMember) throw new Error('Staff not found');

    const existing = await this.getEventStaff(organisationId, data.eventId);
    if (existing.some(s => s.staffId === data.staffId)) {
      throw new Error('Staff member is already added to this event');
    }

    const eventStaff = await eventStaffRepository.create(organisationId, userId, data as never);
    await auditService.log(
      organisationId,
      userId,
      'ADD_EVENT_STAFF',
      'eventStaff',
      eventStaff.id,
      undefined,
      eventStaff
    );
    return eventStaff;
  },

  async updateEventStaff(
    organisationId: string,
    id: string,
    updates: Partial<Omit<EventStaff, keyof import('../types').BaseRecord | 'organisationId'>>,
    userId: string
  ): Promise<void> {
    const existing = await eventStaffRepository.getById(organisationId, id);
    if (!existing) throw new Error('Event Staff not found');

    await eventStaffRepository.update(organisationId, userId, id, updates as never);
    const updated = await eventStaffRepository.getById(organisationId, id);
    await auditService.log(
      organisationId,
      userId,
      'UPDATE_EVENT_STAFF',
      'eventStaff',
      id,
      existing,
      updated
    );
  },

  async removeEventStaff(organisationId: string, id: string, userId: string): Promise<void> {
    const existing = await eventStaffRepository.getById(organisationId, id);
    if (!existing) throw new Error('Event Staff not found');

    await eventStaffRepository.softDelete(organisationId, userId, id);
    await auditService.log(
      organisationId,
      userId,
      'DELETE' as never,
      'eventStaff',
      id,
      existing,
      { ...existing, status: 'deleted' }
    );
  }
};