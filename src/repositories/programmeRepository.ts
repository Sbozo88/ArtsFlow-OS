import { BaseRepository } from './BaseRepository';
import type { Programme } from '../types';

class ProgrammeRepository extends BaseRepository<Programme> {
  constructor() {
    super('programmes');
  }
}

export const programmeRepository = new ProgrammeRepository();
