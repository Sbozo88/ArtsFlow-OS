import { transportVehicleRepository } from '../repositories/transportVehicleRepository';
import { transportProviderRepository } from '../repositories/transportProviderRepository';
import { TransportVehicle } from '../types';
import { auditService } from './auditService';

export const transportVehicleService = {
  async getVehicles(organisationId: string, providerId?: string): Promise<TransportVehicle[]> {
    const all = await transportVehicleRepository.getByOrganisation(organisationId);
    if (providerId) {
      return all.filter(v => v.providerId === providerId);
    }
    return all;
  },

  async getVehicle(organisationId: string, id: string): Promise<TransportVehicle | null> {
    return transportVehicleRepository.getById(organisationId, id);
  },

  async createVehicle(
    organisationId: string,
    data: Omit<TransportVehicle, keyof import('../types').BaseRecord | 'organisationId'>,
    userId: string
  ): Promise<TransportVehicle> {
    // Capacity validation: must be a positive integer
    if (!Number.isInteger(data.capacity) || data.capacity <= 0) {
      throw new Error('Vehicle capacity must be a positive integer greater than zero');
    }

    if (data.providerId) {
      const provider = await transportProviderRepository.getById(organisationId, data.providerId);
      if (!provider) throw new Error('Transport provider not found or does not belong to this organisation');
    }

    const vehicle = await transportVehicleRepository.create(organisationId, userId, data as never);
    await auditService.log(
      organisationId,
      userId,
      'CREATE_TRANSPORT_VEHICLE',
      'transportVehicles',
      vehicle.id,
      undefined,
      vehicle
    );
    return vehicle;
  },

  async updateVehicle(
    organisationId: string,
    id: string,
    updates: Partial<Omit<TransportVehicle, keyof import('../types').BaseRecord | 'organisationId'>>,
    userId: string
  ): Promise<void> {
    const existing = await this.getVehicle(organisationId, id);
    if (!existing) throw new Error('Transport vehicle not found');

    if (updates.capacity !== undefined) {
      if (!Number.isInteger(updates.capacity) || updates.capacity <= 0) {
        throw new Error('Vehicle capacity must be a positive integer greater than zero');
      }
    }

    if (updates.providerId) {
      const provider = await transportProviderRepository.getById(organisationId, updates.providerId);
      if (!provider) throw new Error('Transport provider not found or does not belong to this organisation');
    }

    await transportVehicleRepository.update(organisationId, userId, id, updates as never);
    const updated = await this.getVehicle(organisationId, id);
    await auditService.log(
      organisationId,
      userId,
      'UPDATE_TRANSPORT_VEHICLE',
      'transportVehicles',
      id,
      existing,
      updated
    );
  },

  async deleteVehicle(organisationId: string, id: string, userId: string): Promise<void> {
    const existing = await this.getVehicle(organisationId, id);
    if (!existing) throw new Error('Transport vehicle not found');

    await transportVehicleRepository.softDelete(organisationId, userId, id);
    await auditService.log(
      organisationId,
      userId,
      'DELETE' as never,
      'transportVehicles',
      id,
      existing,
      { ...existing, status: 'deleted' }
    );
  }
};
