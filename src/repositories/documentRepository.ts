import { BaseRepository } from './BaseRepository';
import type { DocumentRecord } from '../types';

export class DocumentRepository extends BaseRepository<DocumentRecord> {
  constructor() {
    super('documents');
  }
}

export const documentRepository = new DocumentRepository();
