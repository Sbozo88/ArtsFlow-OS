import { BaseRepository } from './BaseRepository';
import type { MusicAssessment } from '../types';

class MusicAssessmentRepository extends BaseRepository<MusicAssessment> {
  constructor() {
    super('musicAssessments');
  }
}

export const musicAssessmentRepository = new MusicAssessmentRepository();
