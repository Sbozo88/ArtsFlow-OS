import { Group } from '../types';
import { groupRepository } from '../repositories/groupRepository';
import { auditService } from './auditService';

export const groupService = {
  async createGroup(
    orgId: string, 
    actorId: string, 
    data: Omit<Group, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>
  ): Promise<string> {
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const group: Group = {
      ...data,
      id: newId,
      organisationId: orgId,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
      status: 'active'
    };

    await groupRepository.create(group);
    
    await auditService.log({
      organisationId: orgId,
      actorId,
      action: 'CREATE',
      entityType: 'group',
      entityId: newId,
      after: group
    });

    return newId;
  },

  async getGroups(orgId: string): Promise<Group[]> {
    return groupRepository.getByOrganisation(orgId);
  }
};
