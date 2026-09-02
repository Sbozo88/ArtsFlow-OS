import { BaseRepository } from './BaseRepository';
import type { TimesheetEntry, TimesheetEntryStatus } from '../types';

class TimesheetEntryRepository extends BaseRepository<TimesheetEntry> {
  constructor() {
    super('timesheetEntries');
  }

  async getByTimesheetId(organisationId: string, timesheetId: string): Promise<TimesheetEntry[]> {
    const items = await this.getByOrganisation(organisationId);
    return items
      .filter(e => e.timesheetId === timesheetId)
      .sort((a, b) => a.workDate.localeCompare(b.workDate));
  }

  async getByWorkRecordId(organisationId: string, workRecordId: string): Promise<TimesheetEntry[]> {
    const items = await this.getByOrganisation(organisationId);
    return items.filter(e => e.workRecordId === workRecordId && e.entryStatus !== 'excluded');
  }

  async updateStatus(
    organisationId: string,
    actorId: string,
    id: string,
    entryStatus: TimesheetEntryStatus
  ): Promise<void> {
    await this.update(organisationId, actorId, id, { entryStatus });
  }
}

export const timesheetEntryRepository = new TimesheetEntryRepository();
