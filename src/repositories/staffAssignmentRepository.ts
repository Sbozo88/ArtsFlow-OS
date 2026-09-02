import { BaseRepository } from './BaseRepository';
import type { StaffAssignment, AssignmentStatus } from '../types';

class StaffAssignmentRepository extends BaseRepository<StaffAssignment> {
  constructor() {
    super('staffAssignments');
  }

  async getByStaffId(organisationId: string, staffId: string): Promise<StaffAssignment[]> {
    const items = await this.getByOrganisation(organisationId);
    return items.filter(a => a.staffId === staffId && a.assignmentStatus !== 'cancelled');
  }

  async getActiveByStaffId(organisationId: string, staffId: string): Promise<StaffAssignment[]> {
    const items = await this.getByOrganisation(organisationId);
    return items.filter(a => a.staffId === staffId && a.assignmentStatus === 'active');
  }

  async getByGroupId(organisationId: string, groupId: string): Promise<StaffAssignment[]> {
    const items = await this.getByOrganisation(organisationId);
    return items.filter(a => a.groupId === groupId && a.assignmentStatus === 'active');
  }

  async getByProgrammeId(organisationId: string, programmeId: string): Promise<StaffAssignment[]> {
    const items = await this.getByOrganisation(organisationId);
    return items.filter(a => a.programmeId === programmeId && a.assignmentStatus === 'active');
  }

  async getByEventId(organisationId: string, eventId: string): Promise<StaffAssignment[]> {
    const items = await this.getByOrganisation(organisationId);
    return items.filter(a => a.eventId === eventId && a.assignmentStatus === 'active');
  }

  async updateStatus(organisationId: string, actorId: string, id: string, assignmentStatus: AssignmentStatus): Promise<void> {
    await this.update(organisationId, actorId, id, { assignmentStatus });
  }
}

export const staffAssignmentRepository = new StaffAssignmentRepository();
