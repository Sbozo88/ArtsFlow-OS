import { BaseRepository } from './BaseRepository';
import { EventParticipant } from '../types';

class EventParticipantRepository extends BaseRepository<EventParticipant> {
  constructor() {
    super('eventParticipants');
  }
}

export const eventParticipantRepository = new EventParticipantRepository();
