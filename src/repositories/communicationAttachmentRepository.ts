import { BaseRepository } from './BaseRepository';
import type { CommunicationAttachment } from '../types';

export class CommunicationAttachmentRepository extends BaseRepository<CommunicationAttachment> {
  constructor() {
    super('communicationAttachments');
  }
}

export const communicationAttachmentRepository = new CommunicationAttachmentRepository();
