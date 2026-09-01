import { Programme } from '../types';
import { programmeRepository } from '../repositories/programmeRepository';
import { auditService } from './auditService';

export const programmeService = {
  async createProgramme(
    orgId: string, 
    actorId: string, 
    data: Omit<Programme, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>
  ): Promise<string> {
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const programme: Programme = {
      ...data,
      id: newId,
      organisationId: orgId,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
      status: 'active'
    };

    await programmeRepository.create(programme);
    
    await auditService.log({
      organisationId: orgId,
      actorId,
      action: 'CREATE',
      entityType: 'programme',
      entityId: newId,
      after: programme
    });

    return newId;
  },

  async getProgrammes(orgId: string): Promise<Programme[]> {
    return programmeRepository.getByOrganisation(orgId);
  }
};
