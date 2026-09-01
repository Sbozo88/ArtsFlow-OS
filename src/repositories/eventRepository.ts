import { BaseRepository } from './BaseRepository';
import { Event } from '../types';

class EventRepository extends BaseRepository<Event> {
  constructor() {
    super('events');
  }
}

export const eventRepository = new EventRepository();
