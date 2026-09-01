import { eventGroupRepository } from '../repositories/eventGroupRepository';
import { EventGroup } from '../types';
import { auditService } from './auditService';
import { eventRepository } from '../repositories/eventRepository';
import { programmeGroupRepository } from '../repositories/programmeGroupRepository';

export const eventGroupService = {
  async getEventGroups(organisationId: string, eventId: string): Promise<EventGroup[]> {
    const groups = await eventGroupRepository.getByOrganisation(organisationId);
    return groups.filter(g => g.eventId === eventId);
  },

  async addEventGroup(
    organisationId: string,
    data: Omit<EventGroup, keyof import('../types').BaseRecord | 'organisationId'>,
    userId: string
  ): Promise<EventGroup> {
    const event = await eventRepository.getById(organisationId, data.eventId);
    if (!event) throw new Error('Event not found');

    const group = await programmeGroupRepository.getById(organisationId, data.groupId);
    if (!group) throw new Error('Group not found');

    const existingGroups = await this.getEventGroups(organisationId, data.eventId);
    if (existingGroups.some(g => g.groupId === data.groupId)) {
      throw new Error('Group is already added to this event');
    }

    const eventGroup = await eventGroupRepository.create(organisationId, userId, data as never);
    await auditService.log(
      organisationId,
      userId,
      'ADD_EVENT_GROUP',
      'eventGroups',
      eventGroup.id,
      undefined,
      eventGroup
    );
    return eventGroup;
  },

  async removeEventGroup(organisationId: string, id: string, userId: string): Promise<void> {
    const existing = await eventGroupRepository.getById(organisationId, id);
    if (!existing) throw new Error('EventGroup not found');

    await eventGroupRepository.softDelete(organisationId, userId, id);
    await auditService.log(
      organisationId,
      userId,
      'REMOVE_EVENT_GROUP',
      'eventGroups',
      id,
      existing,
      { ...existing, status: 'deleted' }
    );
  }
};