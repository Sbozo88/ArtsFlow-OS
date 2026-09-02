import { communicationTemplateRepository } from '../repositories/communicationTemplateRepository';
import { auditService } from './auditService';
import type { CommunicationTemplate, TemplateCategory, CommunicationChannel } from '../types';

export interface CreateTemplateInput {
  name: string;
  category: TemplateCategory;
  defaultChannel?: CommunicationChannel;
  subjectTemplate?: string;
  bodyTemplate: string;
  description?: string;
}

export const communicationTemplateService = {
  async getTemplates(
    organisationId: string,
    category?: TemplateCategory
  ): Promise<CommunicationTemplate[]> {
    const all = await communicationTemplateRepository.getByOrganisation(organisationId);
    return all.filter(t => {
      if (t.templateStatus === 'archived') return false;
      if (category && t.category !== category) return false;
      return true;
    });
  },

  async getTemplateById(
    organisationId: string,
    id: string
  ): Promise<CommunicationTemplate | null> {
    return communicationTemplateRepository.getById(organisationId, id);
  },

  async createTemplate(
    organisationId: string,
    input: CreateTemplateInput,
    actorId: string
  ): Promise<CommunicationTemplate> {
    if (!input.name?.trim()) throw new Error('Template name is required.');
    if (!input.bodyTemplate?.trim()) throw new Error('Body template is required.');

    const template = await communicationTemplateRepository.create(organisationId, actorId, {
      name: input.name.trim(),
      category: input.category,
      defaultChannel: input.defaultChannel,
      subjectTemplate: input.subjectTemplate?.trim(),
      bodyTemplate: input.bodyTemplate.trim(),
      templateStatus: 'active',
      description: input.description?.trim()
    } as never);

    await auditService.log(
      organisationId,
      actorId,
      'CREATE_COMMUNICATION_TEMPLATE',
      'communicationTemplate',
      template.id,
      undefined,
      template
    );

    return template;
  },

  async updateTemplate(
    organisationId: string,
    id: string,
    updates: Partial<CreateTemplateInput>,
    actorId: string
  ): Promise<CommunicationTemplate> {
    const existing = await communicationTemplateRepository.getById(organisationId, id);
    if (!existing) throw new Error('Template not found.');

    await communicationTemplateRepository.update(organisationId, actorId, id, updates as never);
    const updated = { ...existing, ...updates };

    await auditService.log(
      organisationId,
      actorId,
      'UPDATE_COMMUNICATION_TEMPLATE',
      'communicationTemplate',
      id,
      existing,
      updated
    );

    return updated as CommunicationTemplate;
  },

  async archiveTemplate(
    organisationId: string,
    id: string,
    actorId: string
  ): Promise<void> {
    await communicationTemplateRepository.update(organisationId, actorId, id, {
      templateStatus: 'archived'
    } as never);
  },

  /**
   * Replaces merge fields in a template string with actual context values.
   * Identifies any missing or unsupplied variables without failing silently.
   */
  resolveTemplate(
    templateText: string,
    context: Record<string, string>
  ): { resolvedText: string; missingVariables: string[] } {
    if (!templateText) return { resolvedText: '', missingVariables: [] };

    const missingVariables: string[] = [];
    const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;

    const resolvedText = templateText.replace(regex, (match, varName) => {
      const val = context[varName];
      if (val !== undefined && val !== null && val.trim() !== '') {
        return val;
      }
      missingVariables.push(varName);
      return match; // Retain placeholder so user sees what is missing
    });

    return {
      resolvedText,
      missingVariables: Array.from(new Set(missingVariables))
    };
  }
};
