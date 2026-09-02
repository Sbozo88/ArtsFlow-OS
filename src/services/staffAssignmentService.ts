import { staffAssignmentRepository } from '../repositories/staffAssignmentRepository';
import { staffRepository } from '../repositories/staffRepository';
import { programmeRepository } from '../repositories/programmeRepository';
import { programmeGroupRepository } from '../repositories/programmeGroupRepository';
import { eventRepository } from '../repositories/eventRepository';
import { auditService } from './auditService';
import type { 
  StaffAssignment, 
  AssignmentType, 
  AssignmentRole, 
  AssignmentStatus 
} from '../types';

export interface CreateStaffAssignmentInput {
  staffId: string;
  assignmentType: AssignmentType;
  programmeId?: string;
  groupId?: string;
  eventId?: string;
  role: AssignmentRole;
  startDate: string;
  endDate?: string;
  isPrimary?: boolean;
  notes?: string;
}

export const staffAssignmentService = {
  /**
   * Creates a new staff operational assignment with strict tenant isolation and integrity validation.
   */
  async createAssignment(
    organisationId: string,
    actorId: string,
    input: CreateStaffAssignmentInput
  ): Promise<StaffAssignment> {
    // 1. Verify staff exists in organisation
    const staff = await staffRepository.getById(organisationId, input.staffId);
    if (!staff) {
      throw new Error(`Staff member with ID ${input.staffId} not found in this organisation.`);
    }

    // 2. Verify scoped entities if specified
    if (input.programmeId) {
      const prog = await programmeRepository.getById(organisationId, input.programmeId);
      if (!prog) throw new Error(`Programme ${input.programmeId} not found in this organisation.`);
    }

    if (input.groupId) {
      const grp = await programmeGroupRepository.getById(organisationId, input.groupId);
      if (!grp) throw new Error(`Programme group ${input.groupId} not found in this organisation.`);
    }

    if (input.eventId) {
      const evt = await eventRepository.getById(organisationId, input.eventId);
      if (!evt) throw new Error(`Event ${input.eventId} not found in this organisation.`);
    }

    // 3. Create persistent record
    const assignment = await staffAssignmentRepository.create(organisationId, actorId, {
      staffId: input.staffId,
      assignmentType: input.assignmentType,
      programmeId: input.programmeId,
      groupId: input.groupId,
      eventId: input.eventId,
      role: input.role,
      startDate: input.startDate,
      endDate: input.endDate,
      assignmentStatus: 'active',
      isPrimary: input.isPrimary ?? false,
      notes: input.notes
    });

    // 4. Audit evidence
    await auditService.log(
      organisationId,
      actorId,
      'CREATE_STAFF_ASSIGNMENT',
      'staffAssignment',
      assignment.id,
      undefined,
      {
        staffId: input.staffId,
        role: input.role,
        assignmentType: input.assignmentType,
        groupId: input.groupId,
        programmeId: input.programmeId
      }
    );

    return assignment;
  },

  /**
   * Updates an existing staff assignment.
   */
  async updateAssignment(
    organisationId: string,
    assignmentId: string,
    actorId: string,
    updates: Partial<Omit<StaffAssignment, 'id' | 'organisationId' | 'createdAt' | 'createdBy'>>
  ): Promise<void> {
    const original = await staffAssignmentRepository.getById(organisationId, assignmentId);
    if (!original) throw new Error(`Staff assignment ${assignmentId} not found.`);

    await staffAssignmentRepository.update(organisationId, actorId, assignmentId, updates);

    await auditService.log(
      organisationId,
      actorId,
      'UPDATE_STAFF_ASSIGNMENT',
      'staffAssignment',
      assignmentId,
      original,
      updates
    );
  },

  /**
   * Ends or cancels a staff assignment.
   */
  async endAssignment(
    organisationId: string,
    assignmentId: string,
    actorId: string,
    status: 'completed' | 'cancelled' = 'completed'
  ): Promise<void> {
    const original = await staffAssignmentRepository.getById(organisationId, assignmentId);
    if (!original) throw new Error(`Staff assignment ${assignmentId} not found.`);

    const todayStr = new Date().toISOString().split('T')[0];
    await staffAssignmentRepository.update(organisationId, actorId, assignmentId, {
      assignmentStatus: status as AssignmentStatus,
      endDate: original.endDate || todayStr
    });

    await auditService.log(
      organisationId,
      actorId,
      'END_STAFF_ASSIGNMENT',
      'staffAssignment',
      assignmentId,
      original,
      { assignmentStatus: status, endDate: todayStr }
    );
  },

  /**
   * Retrieves all active assignments for a staff member.
   */
  async getAssignmentsForStaff(organisationId: string, staffId: string): Promise<StaffAssignment[]> {
    return staffAssignmentRepository.getByStaffId(organisationId, staffId);
  },

  /**
   * Retrieves all assignments for an organisation.
   */
  async getAllAssignments(organisationId: string): Promise<StaffAssignment[]> {
    return staffAssignmentRepository.getByOrganisation(organisationId);
  }
};
