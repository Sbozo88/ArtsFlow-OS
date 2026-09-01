import { Guardian, LearnerGuardian } from '../types';
import { guardianRepository } from '../repositories/guardianRepository';
import { auditService } from './auditService';

export const guardianService = {
  async createGuardian(
    orgId: string, 
    actorId: string, 
    data: Omit<Guardian, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>
  ): Promise<string> {
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const guardian: Guardian = {
      ...data,
      id: newId,
      organisationId: orgId,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
      status: 'active'
    };

    await guardianRepository.create(guardian);
    
    await auditService.log({
      organisationId: orgId,
      actorId,
      action: 'CREATE',
      entityType: 'guardian',
      entityId: newId,
      after: guardian
    });

    return newId;
  },

  async getGuardians(orgId: string): Promise<Guardian[]> {
    return guardianRepository.getByOrganisation(orgId);
  },

  async linkToLearner(
    orgId: string,
    actorId: string,
    learnerId: string,
    guardianId: string,
    relationshipData: Pick<LearnerGuardian, 'relationshipType' | 'isPrimaryContact' | 'isEmergencyContact' | 'receivesCommunication' | 'isFinancialContact'>
  ): Promise<void> {
    const linkId = `${learnerId}_${guardianId}`;
    const now = new Date().toISOString();

    const link: LearnerGuardian = {
      ...relationshipData,
      id: linkId,
      organisationId: orgId,
      learnerId,
      guardianId,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
      status: 'active'
    };

    await guardianRepository.linkLearner(link);

    await auditService.log({
      organisationId: orgId,
      actorId,
      action: 'CREATE',
      entityType: 'learner_guardian',
      entityId: linkId,
      after: link
    });
  }
};
