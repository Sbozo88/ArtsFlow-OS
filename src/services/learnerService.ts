import { Learner } from '../types';
import { learnerRepository } from '../repositories/learnerRepository';
import { auditService } from './auditService';

export const learnerService = {
  async createLearner(
    orgId: string, 
    actorId: string, 
    data: Omit<Learner, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>
  ): Promise<string> {
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const learner: Learner = {
      ...data,
      id: newId,
      organisationId: orgId,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
      status: 'active'
    };

    await learnerRepository.create(learner);
    
    await auditService.log({
      organisationId: orgId,
      actorId,
      action: 'CREATE',
      entityType: 'learner',
      entityId: newId,
      after: learner
    });

    return newId;
  },

  async getLearners(orgId: string): Promise<Learner[]> {
    return learnerRepository.getByOrganisation(orgId);
  },

  async getLearner(learnerId: string): Promise<Learner | null> {
    return learnerRepository.getById(learnerId);
  }
};
