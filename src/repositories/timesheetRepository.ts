import { BaseRepository } from './BaseRepository';
import type { Timesheet, TimesheetStatus } from '../types';

class TimesheetRepository extends BaseRepository<Timesheet> {
  constructor() {
    super('timesheets');
  }

  async getByStaffId(organisationId: string, staffId: string): Promise<Timesheet[]> {
    const items = await this.getByOrganisation(organisationId);
    return items
      .filter(t => t.staffId === staffId)
      .sort((a, b) => b.periodStart.localeCompare(a.periodStart));
  }

  async getPendingReview(organisationId: string): Promise<Timesheet[]> {
    const items = await this.getByOrganisation(organisationId);
    return items
      .filter(t => t.timesheetStatus === 'submitted' || t.timesheetStatus === 'under_review' || t.timesheetStatus === 'verified')
      .sort((a, b) => (b.submittedAt || b.createdAt).localeCompare(a.submittedAt || a.createdAt));
  }

  async updateStatus(
    organisationId: string,
    actorId: string,
    id: string,
    timesheetStatus: TimesheetStatus,
    updates?: Partial<Timesheet>
  ): Promise<void> {
    await this.update(organisationId, actorId, id, {
      timesheetStatus,
      ...updates
    });
  }
}

export const timesheetRepository = new TimesheetRepository();
