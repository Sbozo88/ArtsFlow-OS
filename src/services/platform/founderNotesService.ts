import { founderNotesRepository } from '../../repositories/founderNotesRepository';
import { auditService } from '../auditService';
import type { FounderCustomerNote, FounderNoteCategory } from '../../types';

export class FounderNotesService {
  /**
   * Lists all active internal founder notes for an organisation (Platform Super Admin only).
   */
  async listNotes(organisationId: string): Promise<FounderCustomerNote[]> {
    return founderNotesRepository.getByOrganisation(organisationId);
  }

  /**
   * Adds a private founder note to an organisation record.
   */
  async addNote(
    actorId: string,
    actorName: string,
    organisationId: string,
    content: string,
    category: FounderNoteCategory = 'general'
  ): Promise<FounderCustomerNote> {
    if (!content || content.trim() === '') {
      throw new Error('Note content cannot be empty.');
    }

    const now = new Date().toISOString();
    const id = `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const note: FounderCustomerNote = {
      id,
      organisationId,
      authorId: actorId,
      authorName: actorName,
      content: content.trim(),
      category,
      createdAt: now,
      updatedAt: now,
      status: 'active'
    };

    await founderNotesRepository.save(note);

    await auditService.log({
      organisationId: 'platform',
      actorId,
      action: 'PLATFORM_CREATE_FOUNDER_NOTE',
      entityType: 'platformCustomerNote',
      entityId: id,
      scopeType: 'platform',
      reason: `Added founder internal note under category '${category}' for organisation ${organisationId}`,
      after: { organisationId, category }
    });

    return note;
  }

  /**
   * Archives a founder note.
   */
  async archiveNote(actorId: string, noteId: string): Promise<void> {
    const note = await founderNotesRepository.getById(noteId);
    if (!note) {
      throw new Error(`Note '${noteId}' not found.`);
    }

    const updated: FounderCustomerNote = {
      ...note,
      status: 'archived',
      updatedAt: new Date().toISOString()
    };

    await founderNotesRepository.save(updated);

    await auditService.log({
      organisationId: 'platform',
      actorId,
      action: 'PLATFORM_ARCHIVE_FOUNDER_NOTE',
      entityType: 'platformCustomerNote',
      entityId: noteId,
      scopeType: 'platform'
    });
  }
}

export const founderNotesService = new FounderNotesService();
