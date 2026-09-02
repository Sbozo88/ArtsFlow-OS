import { documentRepository } from '../repositories/documentRepository';
import { documentLinkRepository } from '../repositories/documentLinkRepository';
import { auditService } from './auditService';
import type { DocumentRecord, DocumentType, DocumentStatus, DocumentLink } from '../types';

export const documentService = {
  async getDocuments(
    organisationId: string,
    filters?: {
      documentType?: DocumentType;
      documentStatus?: DocumentStatus;
      relatedEntityType?: string;
      relatedEntityId?: string;
      search?: string;
    }
  ): Promise<DocumentRecord[]> {
    const all = await documentRepository.getByOrganisation(organisationId);
    return all.filter(doc => {
      if (doc.status === 'deleted') return false;
      if (filters?.documentType && doc.documentType !== filters.documentType) return false;
      if (filters?.documentStatus && doc.documentStatus !== filters.documentStatus) return false;
      if (filters?.relatedEntityType && doc.relatedEntityType !== filters.relatedEntityType) return false;
      if (filters?.relatedEntityId && doc.relatedEntityId !== filters.relatedEntityId) return false;
      if (filters?.search?.trim()) {
        const q = filters.search.trim().toLowerCase();
        const matchesName = doc.name.toLowerCase().includes(q);
        const matchesFile = doc.fileName?.toLowerCase().includes(q);
        const matchesNotes = doc.notes?.toLowerCase().includes(q);
        if (!matchesName && !matchesFile && !matchesNotes) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getDocumentById(
    organisationId: string,
    id: string
  ): Promise<DocumentRecord | null> {
    return documentRepository.getById(organisationId, id);
  },

  async updateDocument(
    organisationId: string,
    id: string,
    updates: Partial<Pick<DocumentRecord, 'name' | 'documentType' | 'notes' | 'documentStatus'>>,
    actorId: string
  ): Promise<DocumentRecord> {
    const existing = await documentRepository.getById(organisationId, id);
    if (!existing) throw new Error('Document not found.');

    await documentRepository.update(organisationId, actorId, id, updates as never);
    const updated = { ...existing, ...updates };

    await auditService.log(
      organisationId,
      actorId,
      'UPDATE_DOCUMENT',
      'document',
      id,
      existing,
      updated
    );

    return updated;
  },

  async archiveDocument(
    organisationId: string,
    id: string,
    actorId: string
  ): Promise<void> {
    const existing = await documentRepository.getById(organisationId, id);
    if (!existing) throw new Error('Document not found.');

    await documentRepository.update(organisationId, actorId, id, {
      documentStatus: 'archived'
    } as never);

    await auditService.log(
      organisationId,
      actorId,
      'ARCHIVE_DOCUMENT',
      'document',
      id,
      existing,
      { ...existing, documentStatus: 'archived' }
    );
  },

  async linkDocument(
    organisationId: string,
    documentId: string,
    entityType: string,
    entityId: string,
    actorId: string
  ): Promise<DocumentLink> {
    const link = await documentLinkRepository.create(organisationId, actorId, {
      documentId,
      entityType,
      entityId
    } as never);

    await auditService.log(
      organisationId,
      actorId,
      'LINK_DOCUMENT',
      'documentLink',
      link.id,
      undefined,
      link
    );

    return link;
  },

  async unlinkDocument(
    organisationId: string,
    linkId: string,
    actorId: string
  ): Promise<void> {
    const existing = await documentLinkRepository.getById(organisationId, linkId);
    if (!existing) throw new Error('Document link not found.');

    await documentLinkRepository.softDelete(organisationId, actorId, linkId);

    await auditService.log(
      organisationId,
      actorId,
      'UNLINK_DOCUMENT',
      'documentLink',
      linkId,
      existing,
      undefined
    );
  },

  async getDocumentLinks(
    organisationId: string,
    documentId: string
  ): Promise<DocumentLink[]> {
    const all = await documentLinkRepository.getByOrganisation(organisationId);
    return all.filter(l => l.documentId === documentId);
  },

  async getEntityDocuments(
    organisationId: string,
    entityType: string,
    entityId: string
  ): Promise<DocumentRecord[]> {
    const [allDocs, allLinks] = await Promise.all([
      documentRepository.getByOrganisation(organisationId),
      documentLinkRepository.getByOrganisation(organisationId)
    ]);

    const linkedDocIds = new Set(
      allLinks
        .filter(l => l.entityType === entityType && l.entityId === entityId)
        .map(l => l.documentId)
    );

    return allDocs.filter(
      d =>
        (d.relatedEntityType === entityType && d.relatedEntityId === entityId) ||
        linkedDocIds.has(d.id)
    );
  }
};
