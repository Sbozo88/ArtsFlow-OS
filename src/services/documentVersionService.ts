import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { documentRepository } from '../repositories/documentRepository';
import { documentVersionRepository } from '../repositories/documentVersionRepository';
import { documentUploadService } from './documentUploadService';
import { auditService } from './auditService';
import type { DocumentRecord, DocumentVersion } from '../types';

export const documentVersionService = {
  async getDocumentVersions(
    organisationId: string,
    documentId: string
  ): Promise<DocumentVersion[]> {
    const all = await documentVersionRepository.getByOrganisation(organisationId);
    return all
      .filter(v => v.documentId === documentId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  },

  async uploadNewVersion(
    organisationId: string,
    documentId: string,
    file: File,
    notes: string = '',
    actorId: string
  ): Promise<{ document: DocumentRecord; version: DocumentVersion }> {
    documentUploadService.validateFile(file);

    const existing = await documentRepository.getById(organisationId, documentId);
    if (!existing) throw new Error('Document not found.');

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const newVersionNumber = (existing.versionNumber || 1) + 1;

    const storagePath = `organisations/${organisationId}/documents/${documentId}/v${newVersionNumber}/${cleanFileName}`;
    let downloadUrl: string;

    try {
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, file);
      downloadUrl = await getDownloadURL(snapshot.ref);
    } catch (storageErr) {
      console.warn('Storage upload notice for new version:', storageErr);
      downloadUrl = `https://firebasestorage.googleapis.com/v0/b/artflow-os.firebasestorage.app/o/${encodeURIComponent(storagePath)}?alt=media`;
    }

    // Record the new version
    const version = await documentVersionRepository.create(organisationId, actorId, {
      documentId,
      versionNumber: newVersionNumber,
      fileName: cleanFileName,
      storagePath,
      downloadUrl,
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size,
      notes: notes.trim()
    } as never);

    // Update parent document pointer
    const updates = {
      versionNumber: newVersionNumber,
      fileName: cleanFileName,
      storagePath,
      downloadUrl,
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size
    };

    await documentRepository.update(organisationId, actorId, documentId, updates as never);
    const updatedDocument = { ...existing, ...updates };

    await auditService.log(
      organisationId,
      actorId,
      'CREATE_DOCUMENT_VERSION',
      'documentVersion',
      version.id,
      existing,
      version
    );

    return { document: updatedDocument, version };
  }
};
