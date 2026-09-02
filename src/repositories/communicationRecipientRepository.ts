import { BaseRepository } from './BaseRepository';
import type { CommunicationRecipient } from '../types';

export class CommunicationRecipientRepository extends BaseRepository<CommunicationRecipient> {
  constructor() {
    super('communicationRecipients');
  }
}

export const communicationRecipientRepository = new CommunicationRecipientRepository();
