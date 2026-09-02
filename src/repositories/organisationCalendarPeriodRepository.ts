import { query, where, getDocs } from 'firebase/firestore';
import { BaseRepository } from './BaseRepository';
import type { OrganisationCalendarPeriod, CalendarPeriodStatus } from '../types';

export class OrganisationCalendarPeriodRepository extends BaseRepository<OrganisationCalendarPeriod> {
  constructor() {
    super('organisationCalendarPeriods');
  }

  async getByYear(organisationId: string, year: number): Promise<OrganisationCalendarPeriod[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', organisationId),
      where('calendarYear', '==', year)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as OrganisationCalendarPeriod);
  }

  async getActive(organisationId: string): Promise<OrganisationCalendarPeriod[]> {
    const all = await this.getByOrganisation(organisationId);
    return all.filter(p => p.periodStatus === 'active');
  }

  async getForDate(organisationId: string, date: string): Promise<OrganisationCalendarPeriod[]> {
    const all = await this.getByOrganisation(organisationId);
    return all.filter(p => p.startDate <= date && p.endDate >= date && p.periodStatus !== 'archived');
  }

  async updateStatus(
    organisationId: string,
    actorId: string,
    id: string,
    periodStatus: CalendarPeriodStatus
  ): Promise<void> {
    await this.update(organisationId, actorId, id, { periodStatus } as unknown as Partial<Omit<OrganisationCalendarPeriod, keyof import('../types').BaseRecord>>);
  }
}

export const organisationCalendarPeriodRepository = new OrganisationCalendarPeriodRepository();
