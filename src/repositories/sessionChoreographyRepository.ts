import { BaseRepository } from './BaseRepository';
import type { SessionChoreography } from '../types';

class SessionChoreographyRepository extends BaseRepository<SessionChoreography> {
  constructor() {
    super('sessionChoreography');
  }
}

export const sessionChoreographyRepository = new SessionChoreographyRepository();
