import { BaseRepository } from './BaseRepository';
import { EventAttendance } from '../types';

class EventAttendanceRepository extends BaseRepository<EventAttendance> {
  constructor() {
    super('eventAttendance');
  }
}

export const eventAttendanceRepository = new EventAttendanceRepository();
