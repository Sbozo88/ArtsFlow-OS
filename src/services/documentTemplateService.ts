import { documentTemplateRepository } from '../repositories/documentTemplateRepository';
import { auditService } from './auditService';
import type { DocumentTemplate, DocumentType, DocumentTemplateFormat } from '../types';

export interface CreateDocTemplateInput {
  name: string;
  documentType: DocumentType;
  titleTemplate?: string;
  bodyTemplate?: string;
  templateFormat: DocumentTemplateFormat;
}

export const documentTemplateService = {
  async getTemplates(
    organisationId: string,
    documentType?: DocumentType
  ): Promise<DocumentTemplate[]> {
    const all = await documentTemplateRepository.getByOrganisation(organisationId);
    return all.filter(t => {
      if (t.templateStatus === 'archived') return false;
      if (documentType && t.documentType !== documentType) return false;
      return true;
    });
  },

  async getTemplateById(
    organisationId: string,
    id: string
  ): Promise<DocumentTemplate | null> {
    return documentTemplateRepository.getById(organisationId, id);
  },

  async createTemplate(
    organisationId: string,
    input: CreateDocTemplateInput,
    actorId: string
  ): Promise<DocumentTemplate> {
    if (!input.name?.trim()) throw new Error('Template name is required.');

    const template = await documentTemplateRepository.create(organisationId, actorId, {
      name: input.name.trim(),
      documentType: input.documentType,
      titleTemplate: input.titleTemplate?.trim(),
      bodyTemplate: input.bodyTemplate?.trim() || '',
      templateFormat: input.templateFormat,
      templateStatus: 'active'
    } as never);

    await auditService.log(
      organisationId,
      actorId,
      'CREATE_DOCUMENT_TEMPLATE',
      'documentTemplate',
      template.id,
      undefined,
      template
    );

    return template;
  },

  async updateTemplate(
    organisationId: string,
    id: string,
    updates: Partial<CreateDocTemplateInput>,
    actorId: string
  ): Promise<DocumentTemplate> {
    const existing = await documentTemplateRepository.getById(organisationId, id);
    if (!existing) throw new Error('Document template not found.');

    await documentTemplateRepository.update(organisationId, actorId, id, updates as never);
    const updated = { ...existing, ...updates };

    await auditService.log(
      organisationId,
      actorId,
      'CREATE_DOCUMENT_TEMPLATE',
      'documentTemplate',
      id,
      existing,
      updated
    );

    return updated as DocumentTemplate;
  },

  async archiveTemplate(
    organisationId: string,
    id: string,
    actorId: string
  ): Promise<void> {
    await documentTemplateRepository.update(organisationId, actorId, id, {
      templateStatus: 'archived'
    } as never);
  }
};
