import { learnerGuardianRepository } from '../repositories/learnerGuardianRepository';
import { auditService } from './auditService';
import type { LearnerGuardian } from '../types';

export const learnerGuardianService = {
  async linkGuardian(
    orgId: string,
    actorId: string,
    data: Omit<LearnerGuardian, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>
  ): Promise<LearnerGuardian> {
    // Check for duplicate links
    const existingLinks = await learnerGuardianRepository.getGuardiansForLearner(orgId, data.learnerId);
    if (existingLinks.some(link => link.guardianId === data.guardianId)) {
      throw new Error('Guardian is already linked to this learner');
    }

    const link = await learnerGuardianRepository.create(orgId, actorId, data);
    await auditService.log(orgId, actorId, 'LINK', 'learnerGuardian', link.id, undefined, link);
    return link;
  },

  async getGuardiansForLearner(orgId: string, learnerId: string): Promise<LearnerGuardian[]> {
    return learnerGuardianRepository.getGuardiansForLearner(orgId, learnerId);
  },

  async getLearnersForGuardian(orgId: string, guardianId: string): Promise<LearnerGuardian[]> {
    return learnerGuardianRepository.getLearnersForGuardian(orgId, guardianId);
  },

  async unlinkGuardian(orgId: string, actorId: string, id: string): Promise<void> {
    const link = await learnerGuardianRepository.getById(orgId, id);
    if (!link) throw new Error('Link not found');

    await learnerGuardianRepository.softDelete(orgId, actorId, id);
    await auditService.log(orgId, actorId, 'UNLINK', 'learnerGuardian', id, link, { ...link, status: 'deleted' });
  }
};
