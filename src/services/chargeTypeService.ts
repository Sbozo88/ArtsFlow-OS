import { chargeTypeRepository } from '../repositories/chargeTypeRepository';
import { auditService } from './auditService';
import type { ChargeType } from '../types';

export const chargeTypeService = {
  async getChargeTypes(organisationId: string): Promise<ChargeType[]> {
    return chargeTypeRepository.getByOrganisation(organisationId);
  },

  async getChargeTypeById(organisationId: string, id: string): Promise<ChargeType | null> {
    return chargeTypeRepository.getById(organisationId, id);
  },

  async createChargeType(
    organisationId: string,
    data: Omit<ChargeType, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>,
    actorId: string
  ): Promise<ChargeType> {
    if (!data.name?.trim()) {
      throw new Error('Charge type name is required.');
    }

    const created = await chargeTypeRepository.create(organisationId, actorId, {
      ...data,
      name: data.name.trim(),
      currency: data.currency || 'ZAR',
      chargeTypeStatus: data.chargeTypeStatus || 'active'
    } as never);

    await auditService.log(
      organisationId,
      actorId,
      'CREATE_CHARGE_TYPE',
      'chargeType',
      created.id,
      undefined,
      created
    );

    return created;
  },

  async updateChargeType(
    organisationId: string,
    id: string,
    updates: Partial<ChargeType>,
    actorId: string
  ): Promise<void> {
    const existing = await chargeTypeRepository.getById(organisationId, id);
    if (!existing) throw new Error('Charge type not found');

    await chargeTypeRepository.update(organisationId, actorId, id, updates as never);

    await auditService.log(
      organisationId,
      actorId,
      'UPDATE_CHARGE_TYPE',
      'chargeType',
      id,
      existing,
      { ...existing, ...updates }
    );
  },

  async archiveChargeType(organisationId: string, id: string, actorId: string): Promise<void> {
    const existing = await chargeTypeRepository.getById(organisationId, id);
    if (!existing) throw new Error('Charge type not found');

    await chargeTypeRepository.update(organisationId, actorId, id, {
      chargeTypeStatus: 'archived'
    } as never);

    await auditService.log(
      organisationId,
      actorId,
      'ARCHIVE_CHARGE_TYPE',
      'chargeType',
      id,
      existing,
      { ...existing, chargeTypeStatus: 'archived' }
    );
  }
};
