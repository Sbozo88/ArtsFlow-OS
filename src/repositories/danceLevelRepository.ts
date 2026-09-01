import { BaseRepository } from './BaseRepository';
import type { DanceLevel } from '../types';

class DanceLevelRepository extends BaseRepository<DanceLevel> {
  constructor() {
    super('danceLevels');
  }
}

export const danceLevelRepository = new DanceLevelRepository();
