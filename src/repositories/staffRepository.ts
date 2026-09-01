import { BaseRepository } from './BaseRepository';
import type { Staff } from '../types';

class StaffRepository extends BaseRepository<Staff> {
  constructor() {
    super('staff');
  }
}

export const staffRepository = new StaffRepository();
