import { BaseRepository } from './BaseRepository';
import type { Organisation } from '../types';

class OrganisationRepository extends BaseRepository<Organisation> {
  constructor() {
    super('organisations');
  }
}

export const organisationRepository = new OrganisationRepository();
