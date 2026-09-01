import { BaseRepository } from './BaseRepository';
import type { Guardian } from '../types';

class GuardianRepository extends BaseRepository<Guardian> {
  constructor() {
    super('guardians');
  }
}

export const guardianRepository = new GuardianRepository();
