import { dancePracticeLogRepository } from '../repositories/dancePracticeLogRepository';
import { auditService } from './auditService';
import type { DancePracticeLog } from '../types';

export const dancePracticeService = {
  async createPracticeLog(orgId: string, actorId: string, data: Omit<DancePracticeLog, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>): Promise<DancePracticeLog> {
    const log = await dancePracticeLogRepository.create(orgId, actorId, data);
    await auditService.log(orgId, actorId, 'CREATE_DANCE_PRACTICE_LOG', 'dancePracticeLog', log.id, null, log);
    return log;
  },

  async updatePracticeLog(orgId: string, actorId: string, docId: string, data: Partial<Omit<DancePracticeLog, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>>): Promise<void> {
    const before = await dancePracticeLogRepository.getById(orgId, docId);
    if (!before) throw new Error('Practice log not found');

    await dancePracticeLogRepository.update(orgId, actorId, docId, data);
    const after = await dancePracticeLogRepository.getById(orgId, docId);

    await auditService.log(orgId, actorId, 'UPDATE_DANCE_PRACTICE_LOG', 'dancePracticeLog', docId, before, after);
  },

  async getPracticeLogs(orgId: string): Promise<DancePracticeLog[]> {
    return dancePracticeLogRepository.getByOrganisation(orgId);
  }
};
