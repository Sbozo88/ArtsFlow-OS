import { BaseRepository } from './BaseRepository';
import { ConsentTemplate } from '../types';

class ConsentTemplateRepository extends BaseRepository<ConsentTemplate> {
  constructor() {
    super('consentTemplates');
  }
}

export const consentTemplateRepository = new ConsentTemplateRepository();
