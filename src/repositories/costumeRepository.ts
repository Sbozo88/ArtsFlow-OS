import { BaseRepository } from './BaseRepository';
import type { Costume } from '../types';

class CostumeRepository extends BaseRepository<Costume> {
  constructor() {
    super('costumes');
  }
}

export const costumeRepository = new CostumeRepository();
