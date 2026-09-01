import { BaseRepository } from './BaseRepository';
import { EventStaff } from '../types';

class EventStaffRepository extends BaseRepository<EventStaff> {
  constructor() {
    super('eventStaff');
  }
}

export const eventStaffRepository = new EventStaffRepository();
