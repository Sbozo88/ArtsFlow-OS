import { BaseRepository } from './BaseRepository';
import type { PracticeLog } from '../types';

class PracticeLogRepository extends BaseRepository<PracticeLog> {
  constructor() {
    super('practiceLogs');
  }
}

export const practiceLogRepository = new PracticeLogRepository();
