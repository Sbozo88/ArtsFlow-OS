import { BaseRepository } from './BaseRepository';
import type { Communication } from '../types';

export class CommunicationRepository extends BaseRepository<Communication> {
  constructor() {
    super('communications');
  }
}

export const communicationRepository = new CommunicationRepository();
