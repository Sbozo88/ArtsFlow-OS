import { danceLevelRepository } from '../repositories/danceLevelRepository';
import { auditService } from './auditService';
import type { DanceLevel } from '../types';

export const danceLevelService = {
  async createDanceLevel(orgId: string, actorId: string, data: Omit<DanceLevel, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>): Promise<DanceLevel> {
    const level = await danceLevelRepository.create(orgId, actorId, {
      ...data,
      levelStatus: data.levelStatus || 'active'
    });

    await auditService.log(orgId, actorId, 'CREATE_DANCE_LEVEL', 'danceLevel', level.id, null, level);
    return level;
  },

  async updateDanceLevel(orgId: string, actorId: string, docId: string, data: Partial<Omit<DanceLevel, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>>): Promise<void> {
    const before = await danceLevelRepository.getById(orgId, docId);
    if (!before) throw new Error('Dance level not found');

    await danceLevelRepository.update(orgId, actorId, docId, data);
    const after = await danceLevelRepository.getById(orgId, docId);

    await auditService.log(orgId, actorId, 'UPDATE_DANCE_LEVEL', 'danceLevel', docId, before, after);
  },

  async archiveDanceLevel(orgId: string, actorId: string, docId: string): Promise<void> {
    const before = await danceLevelRepository.getById(orgId, docId);
    if (!before) throw new Error('Dance level not found');

    await danceLevelRepository.update(orgId, actorId, docId, { levelStatus: 'archived' });
    await danceLevelRepository.archive(orgId, actorId, docId);

    await auditService.log(orgId, actorId, 'ARCHIVE_DANCE_LEVEL', 'danceLevel', docId, before, { ...before, levelStatus: 'archived', status: 'archived' });
  },

  async getDanceLevels(orgId: string): Promise<DanceLevel[]> {
    return danceLevelRepository.getByOrganisation(orgId);
  }
};
