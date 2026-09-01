import { programmeGroupRepository } from '../repositories/programmeGroupRepository';
import { auditService } from './auditService';
import type { ProgrammeGroup } from '../types';

export const programmeGroupService = {
  async createGroup(
    orgId: string, 
    actorId: string, 
    data: Omit<ProgrammeGroup, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status' | 'groupStatus'>
  ): Promise<ProgrammeGroup> {
    const group = await programmeGroupRepository.create(orgId, actorId, {
      ...data,
      groupStatus: 'active'
    });
    
    await auditService.log(orgId, actorId, 'CREATE', 'programmeGroup', group.id, undefined, group);
    return group;
  },

  async getGroups(orgId: string): Promise<ProgrammeGroup[]> {
    return programmeGroupRepository.getByOrganisation(orgId);
  },

  async getGroupsByProgramme(orgId: string, programmeId: string): Promise<ProgrammeGroup[]> {
    return programmeGroupRepository.getByProgrammeId(orgId, programmeId);
  },

  async getGroup(orgId: string, id: string): Promise<ProgrammeGroup | null> {
    return programmeGroupRepository.getById(orgId, id);
  },

  async archiveGroup(orgId: string, actorId: string, id: string): Promise<void> {
    const before = await programmeGroupRepository.getById(orgId, id);
    if (!before) throw new Error('Group not found');
    
    await programmeGroupRepository.archive(orgId, actorId, id);
    await auditService.log(orgId, actorId, 'ARCHIVE', 'programmeGroup', id, before, { ...before, status: 'archived' });
  }
};
