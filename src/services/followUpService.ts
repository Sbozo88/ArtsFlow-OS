import { followUpRepository } from '../repositories/followUpRepository';
import { auditService } from './auditService';
import type { FollowUp, FollowUpCategory, FollowUpPriority, FollowUpStatus } from '../types';

export const followUpService = {
  async createFollowUp(
    orgId: string,
    actorId: string,
    data: {
      learnerId?: string;
      guardianId?: string;
      staffId?: string;
      sessionId?: string;
      groupId?: string;
      category: FollowUpCategory;
      subject: string;
      description: string;
      ownerId: string;
      dueDate?: string;
      priority: FollowUpPriority;
    }
  ): Promise<FollowUp> {
    const followUp = await followUpRepository.create(orgId, actorId, {
      ...data,
      followUpStatus: 'open' as FollowUpStatus,
    });

    await auditService.log(orgId, actorId, 'CREATE', 'followUp', followUp.id, undefined, followUp);
    return followUp;
  },

  async getFollowUps(orgId: string): Promise<FollowUp[]> {
    return followUpRepository.getByOrganisation(orgId);
  },

  async getFollowUpsByLearner(orgId: string, learnerId: string): Promise<FollowUp[]> {
    return followUpRepository.getByLearnerId(orgId, learnerId);
  },

  async getFollowUpsByOwner(orgId: string, ownerId: string): Promise<FollowUp[]> {
    return followUpRepository.getByOwnerId(orgId, ownerId);
  },

  async getFollowUpsByStatus(orgId: string, followUpStatus: string): Promise<FollowUp[]> {
    return followUpRepository.getByStatus(orgId, followUpStatus);
  },

  async updateFollowUp(
    orgId: string,
    actorId: string,
    id: string,
    updates: Partial<Pick<FollowUp, 'subject' | 'description' | 'ownerId' | 'dueDate' | 'priority' | 'followUpStatus' | 'resolution'>>
  ): Promise<void> {
    const before = await followUpRepository.getById(orgId, id);
    if (!before) throw new Error('Follow-up not found');

    await followUpRepository.update(orgId, actorId, id, updates as Partial<Omit<FollowUp, keyof import('../types').BaseRecord>>);
    await auditService.log(orgId, actorId, 'UPDATE', 'followUp', id, before, { ...before, ...updates });
  },

  async completeFollowUp(
    orgId: string,
    actorId: string,
    id: string,
    resolution: string
  ): Promise<void> {
    const before = await followUpRepository.getById(orgId, id);
    if (!before) throw new Error('Follow-up not found');

    await followUpRepository.update(orgId, actorId, id, {
      followUpStatus: 'completed',
      resolution,
      completedAt: new Date().toISOString(),
    } as Partial<Omit<FollowUp, keyof import('../types').BaseRecord>>);

    await auditService.log(orgId, actorId, 'COMPLETE', 'followUp', id, before, {
      ...before,
      followUpStatus: 'completed',
      resolution,
    });
  },
};
