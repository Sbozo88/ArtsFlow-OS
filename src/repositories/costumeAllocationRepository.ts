import { BaseRepository } from './BaseRepository';
import type { CostumeAllocation } from '../types';

class CostumeAllocationRepository extends BaseRepository<CostumeAllocation> {
  constructor() {
    super('costumeAllocations');
  }
}

export const costumeAllocationRepository = new CostumeAllocationRepository();
