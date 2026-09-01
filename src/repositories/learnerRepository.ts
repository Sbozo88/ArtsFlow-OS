import { BaseRepository } from './BaseRepository';
import type { Learner } from '../types';

class LearnerRepository extends BaseRepository<Learner> {
  constructor() {
    super('learners');
  }
}

export const learnerRepository = new LearnerRepository();
