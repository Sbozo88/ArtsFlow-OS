import { eventScheduleRepository } from '../repositories/eventScheduleRepository';
import { EventScheduleItem } from '../types';
import { auditService } from './auditService';

export const eventScheduleService = {
  async getEventSchedule(organisationId: string, eventId: string): Promise<EventScheduleItem[]> {
    const items = await eventScheduleRepository.getByOrganisation(organisationId);
    return items.filter(i => i.eventId === eventId).sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  },

  async createScheduleItem(
    organisationId: string,
    data: Omit<EventScheduleItem, keyof import('../types').BaseRecord | 'organisationId'>,
    userId: string
  ): Promise<EventScheduleItem> {
    const item = await eventScheduleRepository.create(organisationId, userId, data as never);
    await auditService.log(
      organisationId,
      userId,
      'CREATE_EVENT_SCHEDULE_ITEM',
      'eventScheduleItems',
      item.id,
      undefined,
      item
    );
    return item;
  },

  async updateScheduleItem(
    organisationId: string,
    id: string,
    updates: Partial<Omit<EventScheduleItem, keyof import('../types').BaseRecord | 'organisationId'>>,
    userId: string
  ): Promise<void> {
    const existing = await eventScheduleRepository.getById(organisationId, id);
    if (!existing) throw new Error('Schedule item not found');

    await eventScheduleRepository.update(organisationId, userId, id, updates as never);
    const updated = await eventScheduleRepository.getById(organisationId, id);
    await auditService.log(
      organisationId,
      userId,
      'UPDATE_EVENT_SCHEDULE_ITEM',
      'eventScheduleItems',
      id,
      existing,
      updated
    );
  },

  async deleteScheduleItem(organisationId: string, id: string, userId: string): Promise<void> {
    const existing = await eventScheduleRepository.getById(organisationId, id);
    if (!existing) throw new Error('Schedule item not found');

    await eventScheduleRepository.softDelete(organisationId, userId, id);
    await auditService.log(
      organisationId,
      userId,
      'DELETE' as never,
      'eventScheduleItems',
      id,
      existing,
      { ...existing, status: 'deleted' }
    );
  }
};