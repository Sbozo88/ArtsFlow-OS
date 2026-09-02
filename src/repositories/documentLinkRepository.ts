import { BaseRepository } from './BaseRepository';
import type { DocumentLink } from '../types';

export class DocumentLinkRepository extends BaseRepository<DocumentLink> {
  constructor() {
    super('documentLinks');
  }
}

export const documentLinkRepository = new DocumentLinkRepository();
