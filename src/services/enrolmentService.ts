import { Enrolment } from '../types';
import { enrolmentRepository } from '../repositories/enrolmentRepository';
import { auditService } from './auditService';

export const enrolmentService = {
  async enrolLearner(
    orgId: string, 
    actorId: string, 
    learnerId: string,
    groupId: string,
    programmeId: string
  ): Promise<string> {
    
    // Check for existing enrolment
    const existing = await enrolmentRepository.getByLearner(orgId, learnerId);
    if (existing.some(e => e.groupId === groupId && e.enrolmentStatus === 'active')) {
      throw new Error('Learner is already enrolled in this group.');
    }

    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const enrolment: Enrolment = {
      id: newId,
      organisationId: orgId,
      learnerId,
      groupId,
      programmeId,
      startDate: now,
      enrolmentStatus: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
      status: 'active'
    };

    await enrolmentRepository.create(enrolment);
    
    await auditService.log({
      organisationId: orgId,
      actorId,
      action: 'CREATE',
      entityType: 'enrolment',
      entityId: newId,
      after: enrolment
    });

    return newId;
  },

  async getLearnerEnrolments(orgId: string, learnerId: string): Promise<Enrolment[]> {
    return enrolmentRepository.getByLearner(orgId, learnerId);
  },

  async getGroupEnrolments(orgId: string, groupId: string): Promise<Enrolment[]> {
    return enrolmentRepository.getByGroup(orgId, groupId);
  }
};
