import { BaseRepository } from './BaseRepository';
import type { Repertoire } from '../types';

class RepertoireRepository extends BaseRepository<Repertoire> {
  constructor() {
    super('repertoire');
  }
}

export const repertoireRepository = new RepertoireRepository();
