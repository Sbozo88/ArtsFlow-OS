import { repertoireRepository } from '../repositories/repertoireRepository';
import { auditService } from './auditService';
import type { Repertoire } from '../types';

export const repertoireService = {
  async createRepertoire(orgId: string, actorId: string, data: Omit<Repertoire, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>): Promise<Repertoire> {
    if (!data.programmeId && !data.groupId) {
      throw new Error('Repertoire must be linked to at least a programme or a group');
    }

    const repertoire = await repertoireRepository.create(orgId, actorId, data);

    await auditService.log(orgId, actorId, 'CREATE', 'repertoire', repertoire.id, null, repertoire);
    return repertoire;
  },

  async updateRepertoire(orgId: string, actorId: string, docId: string, data: Partial<Omit<Repertoire, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>>): Promise<void> {
    const before = await repertoireRepository.getById(orgId, docId);
    if (!before) throw new Error('Repertoire not found');

    await repertoireRepository.update(orgId, actorId, docId, data);

    const after = await repertoireRepository.getById(orgId, docId);
    await auditService.log(orgId, actorId, 'UPDATE', 'repertoire', docId, before, after);
  },

  async archiveRepertoire(orgId: string, actorId: string, docId: string): Promise<void> {
    const before = await repertoireRepository.getById(orgId, docId);
    if (!before) throw new Error('Repertoire not found');

    await repertoireRepository.archive(orgId, actorId, docId);

    await auditService.log(orgId, actorId, 'ARCHIVE', 'repertoire', docId, before, { ...before, status: 'archived' });
  },

  async getRepertoire(orgId: string): Promise<Repertoire[]> {
    return repertoireRepository.getByOrganisation(orgId);
  }
};
