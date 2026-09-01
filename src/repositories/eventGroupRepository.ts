import { BaseRepository } from './BaseRepository';
import { EventGroup } from '../types';

class EventGroupRepository extends BaseRepository<EventGroup> {
  constructor() {
    super('eventGroups');
  }
}

export const eventGroupRepository = new EventGroupRepository();
