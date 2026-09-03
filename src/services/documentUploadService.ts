import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { documentRepository } from '../repositories/documentRepository';
import { documentVersionRepository } from '../repositories/documentVersionRepository';
import { documentLinkRepository } from '../repositories/documentLinkRepository';
import { auditService } from './auditService';
import { customerLifecycleService } from './customerLifecycleService';
import { usageMeteringService } from './usageMeteringService';
import type { DocumentRecord, DocumentType } from '../types';

export const MAX_DOCUMENT_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_DOCUMENT_EXTENSIONS = [
  'pdf',
  'docx',
  'xlsx',
  'csv',
  'jpg',
  'jpeg',
  'png',
  'mp3',
  'mp4',
  'txt'
];

export const PROHIBITED_EXTENSIONS = [
  'exe',
  'bat',
  'sh',
  'cmd',
  'msi',
  'scr',
  'vbs',
  'ps1',
  'com',
  'pif'
];

export interface UploadDocumentInput {
  file: File;
  name?: string;
  documentType: DocumentType;
  relatedEntityType?: string;
  relatedEntityId?: string;
  notes?: string;
}

export const documentUploadService = {
  validateFile(file: File): void {
    if (file.size > MAX_DOCUMENT_FILE_SIZE) {
      throw new Error(`File exceeds maximum permitted size of 25MB (File is ${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
    }

    const parts = file.name.split('.');
    const ext = parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';

    if (PROHIBITED_EXTENSIONS.includes(ext)) {
      throw new Error(`Executable file types (.${ext}) are strictly prohibited.`);
    }

    if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(ext)) {
      throw new Error(`File type .${ext} is not supported. Supported: ${ALLOWED_DOCUMENT_EXTENSIONS.join(', ')}.`);
    }
  },

  async uploadDocument(
    organisationId: string,
    input: UploadDocumentInput,
    actorId: string
  ): Promise<DocumentRecord> {
    this.validateFile(input.file);

    const mb = Math.ceil(input.file.size / (1024 * 1024)) || 1;
    try {
      await customerLifecycleService.assertCanMutateOperationalData(organisationId, actorId);
    } catch (err: any) {
      if (err?.name === 'TenantRestrictedError' || err?.message?.includes('suspended')) {
        throw err;
      }
    }

    try {
      await usageMeteringService.assertWithinLimit(organisationId, 'limits.storage_mb', mb);
    } catch (err: any) {
      if (err?.name === 'PlanLimitExceededError') {
        throw err;
      }
    }

    const docName = input.name?.trim() || input.file.name;
    const cleanFileName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const versionNumber = 1;

    // Step 1: Create document record to get ID
    const document = await documentRepository.create(organisationId, actorId, {
      name: docName,
      documentType: input.documentType,
      fileName: cleanFileName,
      mimeType: input.file.type || 'application/octet-stream',
      fileSize: input.file.size,
      documentStatus: 'active',
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      versionNumber,
      uploadedBy: actorId,
      notes: input.notes?.trim()
    } as never);

    // Step 2: Upload bytes to Firebase Storage
    const storagePath = `organisations/${organisationId}/documents/${document.id}/v${versionNumber}/${cleanFileName}`;
    let downloadUrl: string;
    try {
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, input.file);
      downloadUrl = await getDownloadURL(snapshot.ref);
    } catch (storageErr) {
      // Keep the failed metadata record out of normal queries and never invent
      // a download URL for bytes that were not stored.
      await documentRepository.softDelete(organisationId, actorId, document.id);
      throw new Error(
        `Document upload failed; no file was published. ${(storageErr as Error).message || ''}`.trim(),
        { cause: storageErr }
      );
    }

    // Step 3: Update document with storagePath and downloadUrl
    await documentRepository.update(organisationId, actorId, document.id, {
      storagePath,
      downloadUrl
    } as never);

    // Step 4: Record version 1
    await documentVersionRepository.create(organisationId, actorId, {
      documentId: document.id,
      versionNumber: 1,
      fileName: cleanFileName,
      storagePath,
      downloadUrl,
      mimeType: input.file.type || 'application/octet-stream',
      fileSize: input.file.size,
      notes: input.notes?.trim()
    } as never);

    // Step 5: If related entity is specified, create document link
    if (input.relatedEntityType && input.relatedEntityId) {
      await documentLinkRepository.create(organisationId, actorId, {
        documentId: document.id,
        entityType: input.relatedEntityType,
        entityId: input.relatedEntityId
      } as never);
    }

    try {
      await usageMeteringService.recordMeterConsumption(
        organisationId,
        'limits.storage_mb',
        mb,
        actorId
      );
    } catch {
      // Non-blocking in mock environments
    }

    await auditService.log(
      organisationId,
      actorId,
      'UPLOAD_DOCUMENT',
      'document',
      document.id,
      undefined,
      { ...document, storagePath, downloadUrl }
    );

    return { ...document, storagePath, downloadUrl };
  }
};
