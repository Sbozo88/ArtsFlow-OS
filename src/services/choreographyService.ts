import { choreographyRepository } from '../repositories/choreographyRepository';
import { auditService } from './auditService';
import type { Choreography } from '../types';

export const choreographyService = {
  async createChoreography(orgId: string, actorId: string, data: Omit<Choreography, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>): Promise<Choreography> {
    const choreography = await choreographyRepository.create(orgId, actorId, {
      ...data,
      choreographyStatus: data.choreographyStatus || 'planned'
    });

    await auditService.log(orgId, actorId, 'CREATE_CHOREOGRAPHY', 'choreography', choreography.id, null, choreography);
    return choreography;
  },

  async updateChoreography(orgId: string, actorId: string, docId: string, data: Partial<Omit<Choreography, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>>): Promise<void> {
    const before = await choreographyRepository.getById(orgId, docId);
    if (!before) throw new Error('Choreography not found');

    await choreographyRepository.update(orgId, actorId, docId, data);
    const after = await choreographyRepository.getById(orgId, docId);

    await auditService.log(orgId, actorId, 'UPDATE_CHOREOGRAPHY', 'choreography', docId, before, after);
  },

  async archiveChoreography(orgId: string, actorId: string, docId: string): Promise<void> {
    const before = await choreographyRepository.getById(orgId, docId);
    if (!before) throw new Error('Choreography not found');

    await choreographyRepository.update(orgId, actorId, docId, { choreographyStatus: 'retired' });
    await choreographyRepository.archive(orgId, actorId, docId);

    await auditService.log(orgId, actorId, 'ARCHIVE_CHOREOGRAPHY', 'choreography', docId, before, { ...before, choreographyStatus: 'retired', status: 'archived' });
  },

  async getChoreography(orgId: string): Promise<Choreography[]> {
    return choreographyRepository.getByOrganisation(orgId);
  }
};
