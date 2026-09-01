import { BaseRepository } from './BaseRepository';
import type { DancePracticeLog } from '../types';

class DancePracticeLogRepository extends BaseRepository<DancePracticeLog> {
  constructor() {
    super('dancePracticeLogs');
  }
}

export const dancePracticeLogRepository = new DancePracticeLogRepository();
