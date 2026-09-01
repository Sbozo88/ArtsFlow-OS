import { BaseRepository } from './BaseRepository';
import type { Choreography } from '../types';

class ChoreographyRepository extends BaseRepository<Choreography> {
  constructor() {
    super('choreography');
  }
}

export const choreographyRepository = new ChoreographyRepository();
