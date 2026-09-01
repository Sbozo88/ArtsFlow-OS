import { guardianRepository } from '../repositories/guardianRepository';
import { auditService } from './auditService';
import type { Guardian } from '../types';

export const guardianService = {
  async createGuardian(
    orgId: string, 
    actorId: string, 
    data: Omit<Guardian, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>
  ): Promise<Guardian> {
    const guardian = await guardianRepository.create(orgId, actorId, data);
    await auditService.log(orgId, actorId, 'CREATE', 'guardian', guardian.id, undefined, guardian);
    return guardian;
  },

  async getGuardians(orgId: string): Promise<Guardian[]> {
    return guardianRepository.getByOrganisation(orgId);
  },

  async getGuardian(orgId: string, id: string): Promise<Guardian | null> {
    return guardianRepository.getById(orgId, id);
  },

  async archiveGuardian(orgId: string, actorId: string, id: string): Promise<void> {
    const before = await guardianRepository.getById(orgId, id);
    if (!before) throw new Error('Guardian not found');
    
    await guardianRepository.archive(orgId, actorId, id);
    await auditService.log(orgId, actorId, 'ARCHIVE', 'guardian', id, before, { ...before, status: 'archived' });
  }
};
