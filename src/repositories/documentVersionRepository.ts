import { BaseRepository } from './BaseRepository';
import type { DocumentVersion } from '../types';

export class DocumentVersionRepository extends BaseRepository<DocumentVersion> {
  constructor() {
    super('documentVersions');
  }
}

export const documentVersionRepository = new DocumentVersionRepository();
