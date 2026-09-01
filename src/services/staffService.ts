import { staffRepository } from '../repositories/staffRepository';
import { auditService } from './auditService';
import type { Staff } from '../types';

export const staffService = {
  async createStaff(
    orgId: string, 
    actorId: string, 
    data: Omit<Staff, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status' | 'staffStatus'>
  ): Promise<Staff> {
    const staff = await staffRepository.create(orgId, actorId, {
      ...data,
      staffStatus: 'active'
    });
    
    await auditService.log(orgId, actorId, 'CREATE', 'staff', staff.id, undefined, staff);
    return staff;
  },

  async getStaff(orgId: string): Promise<Staff[]> {
    return staffRepository.getByOrganisation(orgId);
  },

  async getStaffById(orgId: string, id: string): Promise<Staff | null> {
    return staffRepository.getById(orgId, id);
  },

  async archiveStaff(orgId: string, actorId: string, id: string): Promise<void> {
    const before = await staffRepository.getById(orgId, id);
    if (!before) throw new Error('Staff not found');
    
    await staffRepository.archive(orgId, actorId, id);
    await auditService.log(orgId, actorId, 'ARCHIVE', 'staff', id, before, { ...before, status: 'archived' });
  }
};
