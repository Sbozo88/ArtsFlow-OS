import { practiceLogRepository } from '../repositories/practiceLogRepository';
import { auditService } from './auditService';
import type { PracticeLog } from '../types';

export const practiceService = {
  async createPracticeLog(orgId: string, actorId: string, data: Omit<PracticeLog, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>): Promise<PracticeLog> {
    const log = await practiceLogRepository.create(orgId, actorId, data);

    await auditService.log(orgId, actorId, 'CREATE', 'practiceLog', log.id, null, log);
    return log;
  },

  async updatePracticeLog(orgId: string, actorId: string, docId: string, data: Partial<Omit<PracticeLog, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>>): Promise<void> {
    const before = await practiceLogRepository.getById(orgId, docId);
    if (!before) throw new Error('Practice log not found');

    await practiceLogRepository.update(orgId, actorId, docId, data);

    const after = await practiceLogRepository.getById(orgId, docId);
    await auditService.log(orgId, actorId, 'UPDATE', 'practiceLog', docId, before, after);
  },

  async deletePracticeLog(orgId: string, actorId: string, docId: string): Promise<void> {
    const before = await practiceLogRepository.getById(orgId, docId);
    if (!before) throw new Error('Practice log not found');

    await practiceLogRepository.softDelete(orgId, actorId, docId);
    await auditService.log(orgId, actorId, 'DELETE', 'practiceLog', docId, before, null);
  },

  async getPracticeLogs(orgId: string): Promise<PracticeLog[]> {
    return practiceLogRepository.getByOrganisation(orgId);
  }
};
