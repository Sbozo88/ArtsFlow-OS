import { BaseRepository } from './BaseRepository';
import { EventPerformanceItem } from '../types';

class EventPerformanceRepository extends BaseRepository<EventPerformanceItem> {
  constructor() {
    super('eventPerformanceItems');
  }
}

export const eventPerformanceRepository = new EventPerformanceRepository();
