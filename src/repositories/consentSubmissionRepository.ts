import { BaseRepository } from './BaseRepository';
import { ConsentSubmission } from '../types';

class ConsentSubmissionRepository extends BaseRepository<ConsentSubmission> {
  constructor() {
    super('consentSubmissions');
  }
}

export const consentSubmissionRepository = new ConsentSubmissionRepository();
