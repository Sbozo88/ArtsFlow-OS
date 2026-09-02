import { BaseRepository } from './BaseRepository';
import type { CommunicationTemplate } from '../types';

export class CommunicationTemplateRepository extends BaseRepository<CommunicationTemplate> {
  constructor() {
    super('communicationTemplates');
  }
}

export const communicationTemplateRepository = new CommunicationTemplateRepository();
