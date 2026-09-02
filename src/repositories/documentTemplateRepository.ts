import { BaseRepository } from './BaseRepository';
import type { DocumentTemplate } from '../types';

export class DocumentTemplateRepository extends BaseRepository<DocumentTemplate> {
  constructor() {
    super('documentTemplates');
  }
}

export const documentTemplateRepository = new DocumentTemplateRepository();
