import { BaseRepository } from './BaseRepository';
import type { DanceAssessment } from '../types';

class DanceAssessmentRepository extends BaseRepository<DanceAssessment> {
  constructor() {
    super('danceAssessments');
  }
}

export const danceAssessmentRepository = new DanceAssessmentRepository();
