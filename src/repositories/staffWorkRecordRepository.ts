import { BaseRepository } from './BaseRepository';
import type { StaffWorkRecord, WorkStatus } from '../types';

class StaffWorkRecordRepository extends BaseRepository<StaffWorkRecord> {
  constructor() {
    super('staffWorkRecords');
  }

  async getByStaffId(organisationId: string, staffId: string): Promise<StaffWorkRecord[]> {
    const items = await this.getByOrganisation(organisationId);
    return items
      .filter(w => w.staffId === staffId && w.workStatus !== 'cancelled')
      .sort((a, b) => b.workDate.localeCompare(a.workDate));
  }

  async getByStaffAndDateRange(organisationId: string, staffId: string, startDate: string, endDate: string): Promise<StaffWorkRecord[]> {
    const items = await this.getByStaffId(organisationId, staffId);
    return items.filter(w => w.workDate >= startDate && w.workDate <= endDate);
  }

  async getBySource(organisationId: string, staffId: string, sourceType: string, sourceRecordId: string, workType: string): Promise<StaffWorkRecord | null> {
    const items = await this.getByOrganisation(organisationId);
    return items.find(w => 
      w.staffId === staffId && 
      w.sourceType === sourceType && 
      w.sourceRecordId === sourceRecordId &&
      w.workType === workType &&
      w.workStatus !== 'cancelled'
    ) || null;
  }

  async getUnverified(organisationId: string): Promise<StaffWorkRecord[]> {
    const items = await this.getByOrganisation(organisationId);
    return items
      .filter(w => w.workStatus === 'recorded' || w.workStatus === 'draft')
      .sort((a, b) => b.workDate.localeCompare(a.workDate));
  }

  async updateStatus(
    organisationId: string,
    actorId: string,
    id: string,
    workStatus: WorkStatus,
    extra?: Partial<StaffWorkRecord>
  ): Promise<void> {
    await this.update(organisationId, actorId, id, {
      workStatus,
      ...extra
    });
  }
}

export const staffWorkRecordRepository = new StaffWorkRecordRepository();
