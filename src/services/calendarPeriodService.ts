import { organisationCalendarPeriodRepository } from '../repositories/organisationCalendarPeriodRepository';
import { auditService } from './auditService';
import type { 
  OrganisationCalendarPeriod, 
  CalendarPeriodType, 
  CalendarPeriodStatus 
} from '../types';

export interface CreateCalendarPeriodInput {
  name: string;
  periodType: CalendarPeriodType;
  startDate: string;
  endDate: string;
  calendarYear?: number;
  periodStatus?: CalendarPeriodStatus;
  notes?: string;
}

export const calendarPeriodService = {
  /**
   * Creates an academic/operational calendar period with range validation and overlap detection.
   */
  async createPeriod(
    organisationId: string,
    actorId: string,
    input: CreateCalendarPeriodInput
  ): Promise<{ period: OrganisationCalendarPeriod; overlapWarning?: string }> {
    if (!input.name?.trim()) {
      throw new Error('Period name is required.');
    }
    if (!input.startDate || !input.endDate) {
      throw new Error('Start date and end date are required.');
    }
    if (input.endDate < input.startDate) {
      throw new Error(`End date (${input.endDate}) cannot be earlier than start date (${input.startDate}).`);
    }

    const year = input.calendarYear || parseInt(input.startDate.split('-')[0], 10) || new Date().getFullYear();

    // Check for potential period overlaps
    const existing = await organisationCalendarPeriodRepository.getByYear(organisationId, year);
    const activeSameType = existing.filter(
      p => p.periodType === input.periodType && p.periodStatus !== 'archived'
    );

    let overlapWarning: string | undefined;
    for (const p of activeSameType) {
      const overlaps = (input.startDate <= p.endDate) && (input.endDate >= p.startDate);
      if (overlaps) {
        overlapWarning = `Notice: Period dates overlap with existing ${p.periodType} "${p.name}" (${p.startDate} to ${p.endDate}).`;
        break;
      }
    }

    const period = await organisationCalendarPeriodRepository.create(organisationId, actorId, {
      name: input.name.trim(),
      periodType: input.periodType,
      startDate: input.startDate,
      endDate: input.endDate,
      calendarYear: year,
      periodStatus: input.periodStatus || 'active',
      notes: input.notes?.trim() || undefined
    });

    await auditService.log(
      organisationId,
      actorId,
      'CREATE_CALENDAR_PERIOD',
      'organisationCalendarPeriod',
      period.id,
      undefined,
      period
    );

    return { period, overlapWarning };
  },

  async updatePeriod(
    organisationId: string,
    actorId: string,
    id: string,
    updates: Partial<CreateCalendarPeriodInput>
  ): Promise<void> {
    const existing = await organisationCalendarPeriodRepository.getById(organisationId, id);
    if (!existing) throw new Error(`Calendar period ${id} not found.`);

    const start = updates.startDate || existing.startDate;
    const end = updates.endDate || existing.endDate;

    if (end < start) {
      throw new Error(`End date (${end}) cannot be earlier than start date (${start}).`);
    }

    const year = updates.calendarYear || parseInt(start.split('-')[0], 10) || existing.calendarYear;

    await organisationCalendarPeriodRepository.update(organisationId, actorId, id, {
      ...updates,
      calendarYear: year
    } as unknown as Partial<Omit<OrganisationCalendarPeriod, keyof import('../types').BaseRecord>>);

    await auditService.log(
      organisationId,
      actorId,
      'UPDATE_CALENDAR_PERIOD',
      'organisationCalendarPeriod',
      id,
      existing,
      updates
    );
  },

  async archivePeriod(organisationId: string, actorId: string, id: string): Promise<void> {
    const existing = await organisationCalendarPeriodRepository.getById(organisationId, id);
    if (!existing) throw new Error(`Calendar period ${id} not found.`);

    await organisationCalendarPeriodRepository.updateStatus(organisationId, actorId, id, 'archived');

    await auditService.log(
      organisationId,
      actorId,
      'ARCHIVE_CALENDAR_PERIOD',
      'organisationCalendarPeriod',
      id,
      existing,
      { periodStatus: 'archived' }
    );
  },

  async getPeriods(organisationId: string, year?: number): Promise<OrganisationCalendarPeriod[]> {
    if (year) {
      return organisationCalendarPeriodRepository.getByYear(organisationId, year);
    }
    const all = await organisationCalendarPeriodRepository.getByOrganisation(organisationId);
    return all.filter(p => p.periodStatus !== 'archived').sort((a, b) => a.startDate.localeCompare(b.startDate));
  },

  /**
   * Resolves currently active operational period (e.g. "Term 1" or "Cycle 2") for a specific date.
   */
  async getActivePeriodForDate(organisationId: string, dateStr?: string): Promise<OrganisationCalendarPeriod | null> {
    const today = dateStr || new Date().toISOString().split('T')[0];
    const matching = await organisationCalendarPeriodRepository.getForDate(organisationId, today);
    const active = matching.find(p => p.periodStatus === 'active');
    return active || matching[0] || null;
  }
};
