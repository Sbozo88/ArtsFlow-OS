import { eventTransportPlanRepository } from '../repositories/eventTransportPlanRepository';
import { eventRepository } from '../repositories/eventRepository';
import { transportVehicleRepository } from '../repositories/transportVehicleRepository';
import { EventTransportPlan, AuditAction } from '../types';
import { auditService } from './auditService';

export const eventTransportPlanService = {
  async getTransportPlans(organisationId: string, eventId?: string): Promise<EventTransportPlan[]> {
    const all = await eventTransportPlanRepository.getByOrganisation(organisationId);
    if (eventId) {
      return all.filter(p => p.eventId === eventId);
    }
    return all;
  },

  async getTransportPlan(organisationId: string, id: string): Promise<EventTransportPlan | null> {
    return eventTransportPlanRepository.getById(organisationId, id);
  },

  async createTransportPlan(
    organisationId: string,
    data: Omit<EventTransportPlan, keyof import('../types').BaseRecord | 'organisationId'>,
    userId: string
  ): Promise<EventTransportPlan> {
    const event = await eventRepository.getById(organisationId, data.eventId);
    if (!event) throw new Error('Event not found or does not belong to this organisation');

    let capacity = data.vehicleCapacity;
    if (data.vehicleId) {
      const vehicle = await transportVehicleRepository.getById(organisationId, data.vehicleId);
      if (!vehicle) throw new Error('Transport vehicle not found or does not belong to this organisation');
      if (!capacity) {
        capacity = vehicle.capacity;
      }
    }

    if (!capacity || capacity <= 0) {
      throw new Error('Vehicle capacity must be specified and greater than zero');
    }

    const plan = await eventTransportPlanRepository.create(organisationId, userId, {
      ...data,
      vehicleCapacity: capacity,
      transportStatus: data.transportStatus || 'draft'
    } as never);

    await auditService.log(
      organisationId,
      userId,
      'CREATE_TRANSPORT_PLAN',
      'eventTransportPlans',
      plan.id,
      undefined,
      plan
    );

    return plan;
  },

  async updateTransportPlan(
    organisationId: string,
    id: string,
    updates: Partial<Omit<EventTransportPlan, keyof import('../types').BaseRecord | 'organisationId'>>,
    userId: string
  ): Promise<void> {
    const existing = await this.getTransportPlan(organisationId, id);
    if (!existing) throw new Error('Transport plan not found');

    if (updates.vehicleId) {
      const vehicle = await transportVehicleRepository.getById(organisationId, updates.vehicleId);
      if (!vehicle) throw new Error('Vehicle not found or does not belong to this organisation');
      if (!updates.vehicleCapacity) {
        updates.vehicleCapacity = vehicle.capacity;
      }
    }

    await eventTransportPlanRepository.update(organisationId, userId, id, updates as never);
    const updated = await this.getTransportPlan(organisationId, id);

    let action: AuditAction = 'UPDATE_TRANSPORT_PLAN';
    if (updates.transportStatus === 'confirmed') action = 'CONFIRM_TRANSPORT_PLAN';
    if (updates.transportStatus === 'departed') action = 'CONFIRM_TRANSPORT_DEPARTURE';
    if (updates.transportStatus === 'completed') action = 'CONFIRM_TRANSPORT_RETURN';

    await auditService.log(
      organisationId,
      userId,
      action,
      'eventTransportPlans',
      id,
      existing,
      updated
    );
  },

  async confirmDeparture(organisationId: string, id: string, userId: string): Promise<void> {
    const existing = await this.getTransportPlan(organisationId, id);
    if (!existing) throw new Error('Transport plan not found');

    await eventTransportPlanRepository.update(organisationId, userId, id, {
      transportStatus: 'departed'
    } as never);

    const updated = await this.getTransportPlan(organisationId, id);
    await auditService.log(
      organisationId,
      userId,
      'CONFIRM_TRANSPORT_DEPARTURE',
      'eventTransportPlans',
      id,
      existing,
      updated
    );
  },

  async confirmReturn(organisationId: string, id: string, userId: string): Promise<void> {
    const existing = await this.getTransportPlan(organisationId, id);
    if (!existing) throw new Error('Transport plan not found');

    await eventTransportPlanRepository.update(organisationId, userId, id, {
      transportStatus: 'completed'
    } as never);

    const updated = await this.getTransportPlan(organisationId, id);
    await auditService.log(
      organisationId,
      userId,
      'CONFIRM_TRANSPORT_RETURN',
      'eventTransportPlans',
      id,
      existing,
      updated
    );
  },

  async deleteTransportPlan(organisationId: string, id: string, userId: string): Promise<void> {
    const existing = await this.getTransportPlan(organisationId, id);
    if (!existing) throw new Error('Transport plan not found');

    await eventTransportPlanRepository.softDelete(organisationId, userId, id);
    await auditService.log(
      organisationId,
      userId,
      'DELETE' as never,
      'eventTransportPlans',
      id,
      existing,
      { ...existing, status: 'deleted' }
    );
  }
};
