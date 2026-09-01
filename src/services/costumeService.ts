import { costumeRepository } from '../repositories/costumeRepository';
import { auditService } from './auditService';
import type { Costume } from '../types';

export const costumeService = {
  async createCostume(orgId: string, actorId: string, data: Omit<Costume, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>): Promise<Costume> {
    const existing = await costumeRepository.getByOrganisation(orgId);
    if (existing.some(c => c.assetNumber === data.assetNumber)) {
      throw new Error('A costume with this asset number already exists');
    }

    const costume = await costumeRepository.create(orgId, actorId, {
      ...data,
      costumeStatus: data.costumeStatus || 'available'
    });

    await auditService.log(orgId, actorId, 'CREATE_COSTUME', 'costume', costume.id, null, costume);
    return costume;
  },

  async updateCostume(orgId: string, actorId: string, docId: string, data: Partial<Omit<Costume, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>>): Promise<void> {
    const before = await costumeRepository.getById(orgId, docId);
    if (!before) throw new Error('Costume not found');

    if (data.assetNumber && data.assetNumber !== before.assetNumber) {
      const existing = await costumeRepository.getByOrganisation(orgId);
      if (existing.some(c => c.assetNumber === data.assetNumber && c.id !== docId)) {
        throw new Error('A costume with this asset number already exists');
      }
    }

    await costumeRepository.update(orgId, actorId, docId, data);
    const after = await costumeRepository.getById(orgId, docId);

    await auditService.log(orgId, actorId, 'UPDATE_COSTUME', 'costume', docId, before, after);
  },

  async archiveCostume(orgId: string, actorId: string, docId: string): Promise<void> {
    const before = await costumeRepository.getById(orgId, docId);
    if (!before) throw new Error('Costume not found');

    await costumeRepository.update(orgId, actorId, docId, { costumeStatus: 'retired' });
    await costumeRepository.archive(orgId, actorId, docId);

    await auditService.log(orgId, actorId, 'ARCHIVE_COSTUME', 'costume', docId, before, { ...before, costumeStatus: 'retired', status: 'archived' });
  },

  async getCostumes(orgId: string): Promise<Costume[]> {
    return costumeRepository.getByOrganisation(orgId);
  }
};
