import { BaseRepository } from './BaseRepository';
import { EventScheduleItem } from '../types';

class EventScheduleRepository extends BaseRepository<EventScheduleItem> {
  constructor() {
    super('eventScheduleItems');
  }
}

export const eventScheduleRepository = new EventScheduleRepository();
