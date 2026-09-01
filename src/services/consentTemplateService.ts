import { consentTemplateRepository } from '../repositories/consentTemplateRepository';
import { ConsentTemplate } from '../types';
import { auditService } from './auditService';

export const consentTemplateService = {
  async getTemplates(organisationId: string): Promise<ConsentTemplate[]> {
    return consentTemplateRepository.getByOrganisation(organisationId);
  },

  async getTemplate(organisationId: string, id: string): Promise<ConsentTemplate | null> {
    return consentTemplateRepository.getById(organisationId, id);
  },

  async createTemplate(
    organisationId: string,
    data: Omit<ConsentTemplate, keyof import('../types').BaseRecord | 'organisationId'>,
    userId: string
  ): Promise<ConsentTemplate> {
    const template = await consentTemplateRepository.create(organisationId, userId, data as never);
    await auditService.log(
      organisationId,
      userId,
      'CREATE_CONSENT_TEMPLATE',
      'consentTemplates',
      template.id,
      undefined,
      template
    );
    return template;
  },

  async updateTemplate(
    organisationId: string,
    id: string,
    updates: Partial<Omit<ConsentTemplate, keyof import('../types').BaseRecord | 'organisationId'>>,
    userId: string
  ): Promise<void> {
    const existing = await this.getTemplate(organisationId, id);
    if (!existing) throw new Error('Consent template not found');

    await consentTemplateRepository.update(organisationId, userId, id, updates as never);
    const updated = await consentTemplateRepository.getById(organisationId, id);
    await auditService.log(
      organisationId,
      userId,
      'UPDATE_CONSENT_TEMPLATE',
      'consentTemplates',
      id,
      existing,
      updated
    );
  },

  async deleteTemplate(organisationId: string, id: string, userId: string): Promise<void> {
    const existing = await this.getTemplate(organisationId, id);
    if (!existing) throw new Error('Consent template not found');

    await consentTemplateRepository.softDelete(organisationId, userId, id);
    await auditService.log(
      organisationId,
      userId,
      'DELETE' as never,
      'consentTemplates',
      id,
      existing,
      { ...existing, status: 'deleted' }
    );
  }
};
