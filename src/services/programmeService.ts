import { programmeRepository } from '../repositories/programmeRepository';
import { auditService } from './auditService';
import type { Programme } from '../types';

export const programmeService = {
  async createProgramme(
    orgId: string, 
    actorId: string, 
    data: Omit<Programme, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status' | 'programmeStatus'>
  ): Promise<Programme> {
    const programme = await programmeRepository.create(orgId, actorId, {
      ...data,
      programmeStatus: 'active'
    });
    
    await auditService.log(orgId, actorId, 'CREATE', 'programme', programme.id, undefined, programme);
    return programme;
  },

  async getProgrammes(orgId: string): Promise<Programme[]> {
    return programmeRepository.getByOrganisation(orgId);
  },

  async getProgramme(orgId: string, id: string): Promise<Programme | null> {
    return programmeRepository.getById(orgId, id);
  },

  async archiveProgramme(orgId: string, actorId: string, id: string): Promise<void> {
    const before = await programmeRepository.getById(orgId, id);
    if (!before) throw new Error('Programme not found');
    
    await programmeRepository.archive(orgId, actorId, id);
    await auditService.log(orgId, actorId, 'ARCHIVE', 'programme', id, before, { ...before, status: 'archived' });
  }
};
