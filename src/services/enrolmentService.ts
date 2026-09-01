import { enrolmentRepository } from '../repositories/enrolmentRepository';
import { programmeGroupRepository } from '../repositories/programmeGroupRepository';
import { learnerRepository } from '../repositories/learnerRepository';
import { auditService } from './auditService';
import type { Enrolment, EnrolmentStatus } from '../types';

export const enrolmentService = {
  async createEnrolment(
    orgId: string,
    actorId: string,
    data: { learnerId: string; groupId: string; startDate: string; notes?: string }
  ): Promise<Enrolment> {
    // Validate learner exists and belongs to org
    const learner = await learnerRepository.getById(orgId, data.learnerId);
    if (!learner) throw new Error('Learner not found in this organisation');

    // Validate group exists and belongs to org
    const group = await programmeGroupRepository.getById(orgId, data.groupId);
    if (!group) throw new Error('Group not found in this organisation');

    // Prevent duplicate active enrolment
    const duplicate = await enrolmentRepository.getActiveDuplicate(orgId, data.learnerId, data.groupId);
    if (duplicate) throw new Error('Learner is already actively enrolled in this group');

    const enrolment = await enrolmentRepository.create(orgId, actorId, {
      learnerId: data.learnerId,
      groupId: data.groupId,
      programmeId: group.programmeId, // auto-populate from group
      startDate: data.startDate,
      enrolmentStatus: 'active' as EnrolmentStatus,
      notes: data.notes,
    });

    await auditService.log(orgId, actorId, 'CREATE', 'enrolment', enrolment.id, undefined, enrolment);
    return enrolment;
  },

  async getEnrolments(orgId: string): Promise<Enrolment[]> {
    return enrolmentRepository.getByOrganisation(orgId);
  },

  async getEnrolmentsByLearner(orgId: string, learnerId: string): Promise<Enrolment[]> {
    return enrolmentRepository.getByLearnerId(orgId, learnerId);
  },

  async getEnrolmentsByGroup(orgId: string, groupId: string): Promise<Enrolment[]> {
    return enrolmentRepository.getByGroupId(orgId, groupId);
  },

  async getActiveEnrolmentsByGroup(orgId: string, groupId: string): Promise<Enrolment[]> {
    return enrolmentRepository.getActiveByGroupId(orgId, groupId);
  },

  async updateEnrolmentStatus(
    orgId: string,
    actorId: string,
    id: string,
    newStatus: EnrolmentStatus
  ): Promise<void> {
    const before = await enrolmentRepository.getById(orgId, id);
    if (!before) throw new Error('Enrolment not found');

    const auditAction = newStatus === 'withdrawn' ? 'WITHDRAW' : newStatus === 'completed' ? 'COMPLETE' : 'UPDATE';

    await enrolmentRepository.update(orgId, actorId, id, {
      enrolmentStatus: newStatus,
      ...(newStatus === 'completed' || newStatus === 'withdrawn' ? { endDate: new Date().toISOString().split('T')[0] } : {}),
    } as Partial<Omit<Enrolment, keyof import('../types').BaseRecord>>);

    await auditService.log(orgId, actorId, auditAction, 'enrolment', id, before, { ...before, enrolmentStatus: newStatus });
  },
};
