import { communicationRepository } from '../repositories/communicationRepository';
import { communicationRecipientRepository } from '../repositories/communicationRecipientRepository';
import { communicationAttachmentRepository } from '../repositories/communicationAttachmentRepository';
import { documentRepository } from '../repositories/documentRepository';
import { communicationDeliveryService } from './communicationDeliveryService';
import { communicationTemplateService } from './communicationTemplateService';
import { auditService } from './auditService';
import { customerLifecycleService } from './customerLifecycleService';
import { usageMeteringService } from './usageMeteringService';
import type { 
  Communication, 
  CommunicationRecipient, 
  CommunicationType, 
  CommunicationChannel, 
  CommunicationStatus,
  DocumentRecord
} from '../types';
import type { RecipientDraft } from './recipientResolverService';

export interface CreateCommunicationInput {
  communicationType: CommunicationType;
  channel: CommunicationChannel;
  subject?: string;
  body: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  templateId?: string;
  notes?: string;
  documentIds?: string[];
  recipients: RecipientDraft[];
  mergeContexts?: Record<string, Record<string, string>>;
}

export const communicationService = {
  async getCommunications(
    organisationId: string,
    filters?: {
      communicationType?: CommunicationType;
      communicationStatus?: CommunicationStatus;
      channel?: CommunicationChannel;
      relatedEntityType?: string;
      relatedEntityId?: string;
    }
  ): Promise<Communication[]> {
    const all = await communicationRepository.getByOrganisation(organisationId);
    return all.filter(c => {
      if (c.status === 'deleted') return false;
      if (filters?.communicationType && c.communicationType !== filters.communicationType) return false;
      if (filters?.communicationStatus && c.communicationStatus !== filters.communicationStatus) return false;
      if (filters?.channel && c.channel !== filters.channel) return false;
      if (filters?.relatedEntityType && c.relatedEntityType !== filters.relatedEntityType) return false;
      if (filters?.relatedEntityId && c.relatedEntityId !== filters.relatedEntityId) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getCommunicationById(
    organisationId: string,
    id: string
  ): Promise<Communication | null> {
    return communicationRepository.getById(organisationId, id);
  },

  async getRecipientsForCommunication(
    organisationId: string,
    communicationId: string
  ): Promise<CommunicationRecipient[]> {
    const all = await communicationRecipientRepository.getByOrganisation(organisationId);
    return all.filter(r => r.communicationId === communicationId);
  },

  async getAttachmentsForCommunication(
    organisationId: string,
    communicationId: string
  ): Promise<DocumentRecord[]> {
    const links = await communicationAttachmentRepository.getByOrganisation(organisationId);
    const commLinks = links.filter(l => l.communicationId === communicationId);
    if (commLinks.length === 0) return [];

    const allDocs = await documentRepository.getByOrganisation(organisationId);
    const docMap = new Map(allDocs.map(d => [d.id, d]));
    return commLinks
      .map(l => docMap.get(l.documentId))
      .filter((d): d is DocumentRecord => Boolean(d));
  },

  /**
   * Creates a communication record, populates recipients snapshot, and attaches documents.
   */
  async createCommunication(
    organisationId: string,
    input: CreateCommunicationInput,
    actorId: string
  ): Promise<{ communication: Communication; recipients: CommunicationRecipient[] }> {
    if (!input.body?.trim()) throw new Error('Message body is required.');
    if (!input.recipients || input.recipients.length === 0) {
      throw new Error('At least one recipient is required.');
    }

    const communication = await communicationRepository.create(organisationId, actorId, {
      communicationType: input.communicationType,
      channel: input.channel,
      subject: input.subject?.trim(),
      body: input.body.trim(),
      communicationStatus: 'draft',
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      templateId: input.templateId,
      notes: input.notes?.trim()
    } as never);

    // Create recipients
    const createdRecipients: CommunicationRecipient[] = [];
    for (const r of input.recipients) {
      const rec = await communicationRecipientRepository.create(organisationId, actorId, {
        communicationId: communication.id,
        recipientType: r.recipientType,
        learnerId: r.learnerId,
        guardianId: r.guardianId,
        staffId: r.staffId,
        recipientName: r.recipientName,
        recipientEmail: r.recipientEmail,
        recipientPhone: r.recipientPhone,
        deliveryStatus: 'pending',
        deliveryChannel: input.channel
      } as never);
      createdRecipients.push(rec);
    }

    // Attach documents if provided
    if (input.documentIds && input.documentIds.length > 0) {
      for (const docId of input.documentIds) {
        await communicationAttachmentRepository.create(organisationId, actorId, {
          communicationId: communication.id,
          documentId: docId
        } as never);
      }
    }

    await auditService.log(
      organisationId,
      actorId,
      'CREATE_COMMUNICATION',
      'communication',
      communication.id,
      undefined,
      communication
    );

    return { communication, recipients: createdRecipients };
  },

  /**
   * Dispatches or prepares a communication across its recipients.
   */
  async sendCommunication(
    organisationId: string,
    communicationId: string,
    mergeContexts: Record<string, Record<string, string>> = {},
    actorId: string
  ): Promise<Communication> {
    const communication = await communicationRepository.getById(organisationId, communicationId);
    if (!communication) throw new Error('Communication not found.');

    if (communication.communicationStatus === 'cancelled') {
      throw new Error('Cannot send a cancelled communication.');
    }

    try {
      await customerLifecycleService.assertCanMutateOperationalData(organisationId, actorId);
    } catch (err: any) {
      if (err?.name === 'TenantRestrictedError' || err?.message?.includes('suspended')) {
        throw err;
      }
    }

    const recipients = await this.getRecipientsForCommunication(organisationId, communicationId);

    try {
      await usageMeteringService.assertWithinLimit(
        organisationId,
        'limits.monthly_communications',
        recipients.length || 1
      );
    } catch (err: any) {
      if (err?.name === 'PlanLimitExceededError') {
        throw err;
      }
    }

    const attachments = await this.getAttachmentsForCommunication(organisationId, communicationId);

    const now = new Date().toISOString();
    let sentCount = 0;
    let preparedCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      // Resolve personalized merge context
      const contextKey = recipient.guardianId 
        ? `${recipient.guardianId}_${recipient.learnerId || 'none'}`
        : recipient.staffId || recipient.learnerId || recipient.id;
      
      const context = mergeContexts[contextKey] || {};

      // Personalized body and subject
      const resolvedBody = communicationTemplateService.resolveTemplate(communication.body, context).resolvedText;
      const resolvedSubject = communication.subject
        ? communicationTemplateService.resolveTemplate(communication.subject, context).resolvedText
        : undefined;

      const result = await communicationDeliveryService.deliver({
        recipient,
        subject: resolvedSubject,
        body: resolvedBody,
        attachments: attachments.map(a => ({ fileName: a.fileName || a.name, downloadUrl: a.downloadUrl }))
      });

      if (result.deliveryStatus === 'sent' || result.deliveryStatus === 'delivered') {
        sentCount++;
      } else if (result.deliveryStatus === 'prepared') {
        preparedCount++;
      } else if (result.deliveryStatus === 'failed') {
        failedCount++;
      }

      await communicationRecipientRepository.update(organisationId, actorId, recipient.id, {
        deliveryStatus: result.deliveryStatus,
        sentAt: result.deliveredAt || now,
        deliveredAt: result.deliveredAt,
        failureReason: result.failureReason,
        metadata: result.metadata
      } as never);
    }

    // Determine aggregate communication status
    let finalStatus: CommunicationStatus;
    if (failedCount === recipients.length) {
      finalStatus = 'failed';
    } else if (preparedCount === recipients.length) {
      finalStatus = 'ready';
    } else if (sentCount === recipients.length) {
      finalStatus = 'sent';
    } else if (sentCount > 0 && failedCount > 0) {
      finalStatus = 'partially_sent';
    } else {
      finalStatus = 'completed';
    }

    const updates = {
      communicationStatus: finalStatus,
      sentAt: now,
      completedAt: now
    };

    await communicationRepository.update(organisationId, actorId, communicationId, updates as never);
    const updated = { ...communication, ...updates };

    if (sentCount > 0) {
      try {
        await usageMeteringService.recordMeterConsumption(
          organisationId,
          'limits.monthly_communications',
          sentCount,
          actorId
        );
      } catch {
        // Non-blocking in mock environments
      }
    }

    await auditService.log(
      organisationId,
      actorId,
      'SEND_COMMUNICATION',
      'communication',
      communicationId,
      communication,
      updated
    );

    return updated;
  },

  async cancelCommunication(
    organisationId: string,
    communicationId: string,
    actorId: string
  ): Promise<Communication> {
    const existing = await communicationRepository.getById(organisationId, communicationId);
    if (!existing) throw new Error('Communication not found.');

    const updates = { communicationStatus: 'cancelled' as const };
    await communicationRepository.update(organisationId, actorId, communicationId, updates as never);
    const updated = { ...existing, ...updates };

    await auditService.log(
      organisationId,
      actorId,
      'CANCEL_COMMUNICATION',
      'communication',
      communicationId,
      existing,
      updated
    );

    return updated;
  }
};
