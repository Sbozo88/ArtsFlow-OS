import { sessionRepertoireRepository } from '../repositories/sessionRepertoireRepository';
import { sessionRepository } from '../repositories/sessionRepository';
import { repertoireRepository } from '../repositories/repertoireRepository';
import { auditService } from './auditService';
import type { SessionRepertoire, RehearsalStatus } from '../types';

export const sessionRepertoireService = {
  async linkRepertoireToSession(
    orgId: string,
    actorId: string,
    sessionId: string,
    repertoireId: string,
    rehearsalStatus?: RehearsalStatus,
    notes?: string
  ): Promise<SessionRepertoire> {
    const session = await sessionRepository.getById(orgId, sessionId);
    if (!session) throw new Error('Session not found');

    const repertoire = await repertoireRepository.getById(orgId, repertoireId);
    if (!repertoire) throw new Error('Repertoire not found');

    // Prevent duplicate linking in same session
    const existingLinks = await sessionRepertoireRepository.getBySessionId(orgId, sessionId);
    if (existingLinks.some(l => l.repertoireId === repertoireId)) {
      throw new Error('Repertoire is already linked to this session');
    }

    const link = await sessionRepertoireRepository.create(orgId, actorId, {
      sessionId,
      repertoireId,
      rehearsalStatus,
      notes: notes || ''
    });

    await auditService.log(orgId, actorId, 'LINK_SESSION_REPERTOIRE', 'sessionRepertoire', link.id, null, link);
    return link;
  },

  async updateRehearsalStatus(orgId: string, actorId: string, linkId: string, rehearsalStatus: RehearsalStatus, notes?: string): Promise<void> {
    const before = await sessionRepertoireRepository.getById(orgId, linkId);
    if (!before) throw new Error('Session repertoire link not found');

    const updateData: Partial<SessionRepertoire> = {
      rehearsalStatus,
      updatedBy: actorId,
      updatedAt: new Date().toISOString()
    };
    if (notes !== undefined) updateData.notes = notes;

    await sessionRepertoireRepository.update(orgId, actorId, linkId, updateData);
    const after = await sessionRepertoireRepository.getById(orgId, linkId);

    await auditService.log(orgId, actorId, 'UPDATE', 'sessionRepertoire', linkId, before, after);
  },
  
  async unlinkRepertoireFromSession(orgId: string, actorId: string, linkId: string): Promise<void> {
    const before = await sessionRepertoireRepository.getById(orgId, linkId);
    if (!before) throw new Error('Session repertoire link not found');

    await sessionRepertoireRepository.softDelete(orgId, actorId, linkId);
    await auditService.log(orgId, actorId, 'UNLINK', 'sessionRepertoire', linkId, before, null);
  },

  async getSessionRepertoire(orgId: string): Promise<SessionRepertoire[]> {
    return sessionRepertoireRepository.getByOrganisation(orgId);
  }
};
