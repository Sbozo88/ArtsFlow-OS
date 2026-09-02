import { timesheetRepository } from '../repositories/timesheetRepository';
import { timesheetEntryRepository } from '../repositories/timesheetEntryRepository';
import { staffWorkRecordRepository } from '../repositories/staffWorkRecordRepository';
import { staffRepository } from '../repositories/staffRepository';
import { auditService } from './auditService';
import type { 
  Timesheet, 
  TimesheetEntry, 
  TimesheetStatus, 
  TimesheetHoursSummary 
} from '../types';

export interface CreateTimesheetInput {
  staffId: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
  notes?: string;
}

export const timesheetService = {
  /**
   * Builds a draft timesheet by loading eligible work records within the given period.
   * Compiles timesheet entries and aggregates total minutes.
   */
  async createDraftTimesheet(
    organisationId: string,
    actorId: string,
    input: CreateTimesheetInput
  ): Promise<{ timesheet: Timesheet; entries: TimesheetEntry[] }> {
    // 1. Verify staff exists
    const staff = await staffRepository.getById(organisationId, input.staffId);
    if (!staff) throw new Error(`Staff member ${input.staffId} not found.`);

    if (input.periodEnd < input.periodStart) {
      throw new Error('Period end date cannot be before period start date.');
    }

    // 2. Fetch eligible work records in range (exclude cancelled/rejected)
    const records = await staffWorkRecordRepository.getByStaffAndDateRange(
      organisationId,
      input.staffId,
      input.periodStart,
      input.periodEnd
    );

    const eligibleRecords = records.filter(r => r.workStatus !== 'cancelled' && r.workStatus !== 'rejected');

    // 3. Create parent Timesheet record
    const totalMinutes = eligibleRecords.reduce((sum, r) => sum + (r.durationMinutes || 0), 0);

    const timesheet = await timesheetRepository.create(organisationId, actorId, {
      staffId: input.staffId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      timesheetStatus: 'draft',
      totalMinutes,
      totalEntries: eligibleRecords.length,
      notes: input.notes
    });

    // 4. Create child TimesheetEntry records
    const entries: TimesheetEntry[] = [];
    for (const rec of eligibleRecords) {
      const entry = await timesheetEntryRepository.create(organisationId, actorId, {
        timesheetId: timesheet.id,
        staffId: input.staffId,
        workRecordId: rec.id,
        workDate: rec.workDate,
        workType: rec.workType,
        programmeId: rec.programmeId,
        groupId: rec.groupId,
        sessionId: rec.sessionId,
        eventId: rec.eventId,
        startTime: rec.startTime,
        endTime: rec.endTime,
        durationMinutes: rec.durationMinutes,
        entryStatus: 'included',
        notes: rec.notes
      });
      entries.push(entry);
    }

    // 5. Audit
    await auditService.log(
      organisationId,
      actorId,
      'CREATE_TIMESHEET',
      'timesheet',
      timesheet.id,
      undefined,
      {
        staffId: input.staffId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        totalEntries: entries.length,
        totalMinutes
      }
    );

    return { timesheet, entries };
  },

  /**
   * Submits a timesheet for verification, locking it against regular editing.
   */
  async submitTimesheet(organisationId: string, timesheetId: string, actorId: string): Promise<Timesheet> {
    const original = await timesheetRepository.getById(organisationId, timesheetId);
    if (!original) throw new Error(`Timesheet ${timesheetId} not found.`);

    if (original.timesheetStatus !== 'draft' && original.timesheetStatus !== 'rejected') {
      throw new Error(`Timesheet is in '${original.timesheetStatus}' status and cannot be submitted.`);
    }

    const now = new Date().toISOString();
    await timesheetRepository.updateStatus(organisationId, actorId, timesheetId, 'submitted', {
      submittedAt: now,
      submittedBy: actorId
    });

    const updated = { ...original, timesheetStatus: 'submitted' as TimesheetStatus, submittedAt: now, submittedBy: actorId };

    await auditService.log(
      organisationId,
      actorId,
      'SUBMIT_TIMESHEET',
      'timesheet',
      timesheetId,
      original,
      { timesheetStatus: 'submitted', submittedAt: now, submittedBy: actorId }
    );

    return updated;
  },

  /**
   * Returns a submitted timesheet for correction, returning it to editable draft/under_review status.
   */
  async returnTimesheet(
    organisationId: string,
    timesheetId: string,
    actorId: string,
    reason: string
  ): Promise<void> {
    const original = await timesheetRepository.getById(organisationId, timesheetId);
    if (!original) throw new Error(`Timesheet ${timesheetId} not found.`);

    await timesheetRepository.updateStatus(organisationId, actorId, timesheetId, 'under_review', {
      rejectionReason: reason
    });

    await auditService.log(
      organisationId,
      actorId,
      'RETURN_TIMESHEET',
      'timesheet',
      timesheetId,
      original,
      { timesheetStatus: 'under_review', reason }
    );
  },

  /**
   * Toggles an entry included/excluded from a draft timesheet and recalculates total minutes.
   */
  async toggleEntryIncluded(
    organisationId: string,
    timesheetId: string,
    entryId: string,
    included: boolean,
    actorId: string
  ): Promise<void> {
    const timesheet = await timesheetRepository.getById(organisationId, timesheetId);
    if (!timesheet) throw new Error(`Timesheet ${timesheetId} not found.`);

    // Submission lock guard
    if (timesheet.timesheetStatus !== 'draft') {
      throw new Error('Timesheet entries can only be modified while timesheet is in draft status.');
    }

    await timesheetEntryRepository.updateStatus(
      organisationId,
      actorId,
      entryId,
      included ? 'included' : 'excluded'
    );

    // Recalculate timesheet total minutes
    const entries = await timesheetEntryRepository.getByTimesheetId(organisationId, timesheetId);
    const includedEntries = entries.filter(e => e.entryStatus === 'included');
    const totalMinutes = includedEntries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);

    await timesheetRepository.update(organisationId, actorId, timesheetId, {
      totalMinutes,
      totalEntries: includedEntries.length
    });
  },

  /**
   * Calculates hours breakdown by work type.
   */
  calculateHoursBreakdown(entries: TimesheetEntry[]): TimesheetHoursSummary {
    const included = entries.filter(e => e.entryStatus === 'included' || e.entryStatus === 'verified');
    let teachingMinutes = 0;
    let eventMinutes = 0;
    let adminMinutes = 0;
    let otherMinutes = 0;

    for (const e of included) {
      if (e.workType === 'teaching' || e.workType === 'rehearsal') {
        teachingMinutes += e.durationMinutes;
      } else if (e.workType === 'event' || e.workType === 'performance') {
        eventMinutes += e.durationMinutes;
      } else if (e.workType === 'administration' || e.workType === 'meeting') {
        adminMinutes += e.durationMinutes;
      } else {
        otherMinutes += e.durationMinutes;
      }
    }

    return {
      teachingMinutes,
      eventMinutes,
      adminMinutes,
      otherMinutes,
      totalMinutes: teachingMinutes + eventMinutes + adminMinutes + otherMinutes
    };
  },

  /**
   * Formats duration minutes into human-readable string (e.g. 8h 30m).
   */
  formatDuration(durationMinutes: number): string {
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  },

  /**
   * Retrieves a timesheet by ID with its entries.
   */
  async getTimesheetWithEntries(
    organisationId: string,
    timesheetId: string
  ): Promise<{ timesheet: Timesheet | null; entries: TimesheetEntry[] }> {
    const timesheet = await timesheetRepository.getById(organisationId, timesheetId);
    if (!timesheet) return { timesheet: null, entries: [] };

    const entries = await timesheetEntryRepository.getByTimesheetId(organisationId, timesheetId);
    return { timesheet, entries };
  },

  /**
   * Gets all timesheets for a staff member.
   */
  async getTimesheetsForStaff(organisationId: string, staffId: string): Promise<Timesheet[]> {
    return timesheetRepository.getByStaffId(organisationId, staffId);
  },

  /**
   * Gets timesheets awaiting verification or approval.
   */
  async getTimesheetsPendingReview(organisationId: string): Promise<Timesheet[]> {
    return timesheetRepository.getPendingReview(organisationId);
  }
};
