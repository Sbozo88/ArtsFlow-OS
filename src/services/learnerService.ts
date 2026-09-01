import { learnerRepository } from '../repositories/learnerRepository';
import { auditService } from './auditService';
import type { Learner } from '../types';

export const learnerService = {
  async createLearner(
    orgId: string, 
    actorId: string, 
    data: Omit<Learner, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status' | 'learnerStatus'>
  ): Promise<Learner> {
    const learner = await learnerRepository.create(orgId, actorId, {
      ...data,
      learnerStatus: 'active'
    });
    
    await auditService.log(orgId, actorId, 'CREATE', 'learner', learner.id, undefined, learner);
    return learner;
  },

  async getLearners(orgId: string): Promise<Learner[]> {
    return learnerRepository.getByOrganisation(orgId);
  },

  async getLearner(orgId: string, learnerId: string): Promise<Learner | null> {
    return learnerRepository.getById(orgId, learnerId);
  },

  async archiveLearner(orgId: string, actorId: string, id: string): Promise<void> {
    const before = await learnerRepository.getById(orgId, id);
    if (!before) throw new Error('Learner not found');
    
    await learnerRepository.archive(orgId, actorId, id);
    await auditService.log(orgId, actorId, 'ARCHIVE', 'learner', id, before, { ...before, status: 'archived' });
  }
};
