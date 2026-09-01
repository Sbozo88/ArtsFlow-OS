import { instrumentRepository } from '../repositories/instrumentRepository';
import { auditService } from './auditService';
import type { Instrument } from '../types';

export const instrumentService = {
  async createInstrument(orgId: string, actorId: string, data: Omit<Instrument, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>): Promise<Instrument> {
    // Check for duplicate active asset number
    const existing = await instrumentRepository.getByAssetNumber(orgId, data.assetNumber);
    if (existing) {
      throw new Error(`Instrument with asset number ${data.assetNumber} already exists.`);
    }

    const instrument = await instrumentRepository.create(orgId, actorId, data);

    await auditService.log(orgId, actorId, 'CREATE', 'instrument', instrument.id, null, instrument);
    return instrument;
  },

  async updateInstrument(orgId: string, actorId: string, docId: string, data: Partial<Omit<Instrument, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>>): Promise<void> {
    const before = await instrumentRepository.getById(orgId, docId);
    if (!before) throw new Error('Instrument not found');

    if (data.assetNumber && data.assetNumber !== before.assetNumber) {
      const existing = await instrumentRepository.getByAssetNumber(orgId, data.assetNumber);
      if (existing) {
        throw new Error(`Instrument with asset number ${data.assetNumber} already exists.`);
      }
    }

    await instrumentRepository.update(orgId, actorId, docId, data);

    const after = await instrumentRepository.getById(orgId, docId);
    await auditService.log(orgId, actorId, 'UPDATE', 'instrument', docId, before, after);
  },

  async archiveInstrument(orgId: string, actorId: string, docId: string): Promise<void> {
    const before = await instrumentRepository.getById(orgId, docId);
    if (!before) throw new Error('Instrument not found');

    await instrumentRepository.archive(orgId, actorId, docId);

    await auditService.log(orgId, actorId, 'ARCHIVE', 'instrument', docId, before, { ...before, status: 'archived' });
  },

  async getInstruments(orgId: string): Promise<Instrument[]> {
    return instrumentRepository.getByOrganisation(orgId);
  }
};
