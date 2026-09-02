import { BaseRepository } from './BaseRepository';
import { EventStaff } from '../types';

class EventStaffRepository extends BaseRepository<EventStaff> {
  constructor() {
    super('eventStaff');
  }

  async getByEvent(organisationId: string, eventId: string): Promise<EventStaff[]> {
    const items = await this.getByOrganisation(organisationId);
    return items.filter(s => s.eventId === eventId);
  }
}

export const eventStaffRepository = new EventStaffRepository();
