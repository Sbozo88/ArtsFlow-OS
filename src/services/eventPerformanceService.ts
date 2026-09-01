import { eventPerformanceRepository } from '../repositories/eventPerformanceRepository';
import { EventPerformanceItem } from '../types';
import { auditService } from './auditService';

export const eventPerformanceService = {
  async getEventPerformances(organisationId: string, eventId: string): Promise<EventPerformanceItem[]> {
    const items = await eventPerformanceRepository.getByOrganisation(organisationId);
    return items.filter(i => i.eventId === eventId).sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  },

  async createPerformanceItem(
    organisationId: string,
    data: Omit<EventPerformanceItem, keyof import('../types').BaseRecord | 'organisationId'>,
    userId: string
  ): Promise<EventPerformanceItem> {
    const item = await eventPerformanceRepository.create(organisationId, userId, data as never);
    await auditService.log(
      organisationId,
      userId,
      'CREATE_EVENT_PERFORMANCE_ITEM',
      'eventPerformanceItems',
      item.id,
      undefined,
      item
    );
    return item;
  },

  async updatePerformanceItem(
    organisationId: string,
    id: string,
    updates: Partial<Omit<EventPerformanceItem, keyof import('../types').BaseRecord | 'organisationId'>>,
    userId: string
  ): Promise<void> {
    const existing = await eventPerformanceRepository.getById(organisationId, id);
    if (!existing) throw new Error('Performance item not found');

    await eventPerformanceRepository.update(organisationId, userId, id, updates as never);
    const updated = await eventPerformanceRepository.getById(organisationId, id);
    await auditService.log(
      organisationId,
      userId,
      'UPDATE_EVENT_PERFORMANCE_ITEM',
      'eventPerformanceItems',
      id,
      existing,
      updated
    );
  },

  async deletePerformanceItem(organisationId: string, id: string, userId: string): Promise<void> {
    const existing = await eventPerformanceRepository.getById(organisationId, id);
    if (!existing) throw new Error('Performance item not found');

    await eventPerformanceRepository.softDelete(organisationId, userId, id);
    await auditService.log(
      organisationId,
      userId,
      'DELETE' as never,
      'eventPerformanceItems',
      id,
      existing,
      { ...existing, status: 'deleted' }
    );
  }
};