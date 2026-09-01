import { sessionChoreographyRepository } from '../repositories/sessionChoreographyRepository';
import { sessionRepository } from '../repositories/sessionRepository';
import { choreographyRepository } from '../repositories/choreographyRepository';
import { auditService } from './auditService';
import type { SessionChoreography, DanceRehearsalStatus } from '../types';

export const sessionChoreographyService = {
  async linkChoreographyToSession(
    orgId: string,
    actorId: string,
    sessionId: string,
    choreographyId: string,
    rehearsalStatus?: DanceRehearsalStatus,
    notes?: string
  ): Promise<SessionChoreography> {
    const session = await sessionRepository.getById(orgId, sessionId);
    if (!session) throw new Error('Session not found');

    const choreography = await choreographyRepository.getById(orgId, choreographyId);
    if (!choreography) throw new Error('Choreography not found');

    // Prevent duplicate linking in same session
    const allLinks = await sessionChoreographyRepository.getByOrganisation(orgId);
    const existingLinks = allLinks.filter(l => l.sessionId === sessionId);
    if (existingLinks.some(l => l.choreographyId === choreographyId)) {
      throw new Error('Choreography is already linked to this session');
    }

    const link = await sessionChoreographyRepository.create(orgId, actorId, {
      sessionId,
      choreographyId,
      rehearsalStatus,
      notes: notes || ''
    });

    await auditService.log(orgId, actorId, 'LINK_SESSION_CHOREOGRAPHY', 'sessionChoreography', link.id, null, link);
    return link;
  },

  async updateRehearsalStatus(orgId: string, actorId: string, linkId: string, rehearsalStatus: DanceRehearsalStatus, notes?: string): Promise<void> {
    const before = await sessionChoreographyRepository.getById(orgId, linkId);
    if (!before) throw new Error('Session choreography link not found');

    const updateData: Partial<SessionChoreography> = { rehearsalStatus };
    if (notes !== undefined) updateData.notes = notes;

    await sessionChoreographyRepository.update(orgId, actorId, linkId, updateData);
    const after = await sessionChoreographyRepository.getById(orgId, linkId);

    await auditService.log(orgId, actorId, 'UPDATE', 'sessionChoreography', linkId, before, after);
  },
  
  async unlinkChoreographyFromSession(orgId: string, actorId: string, linkId: string): Promise<void> {
    const before = await sessionChoreographyRepository.getById(orgId, linkId);
    if (!before) throw new Error('Session choreography link not found');

    await sessionChoreographyRepository.softDelete(orgId, actorId, linkId);
    await auditService.log(orgId, actorId, 'UNLINK', 'sessionChoreography', linkId, before, null);
  },

  async getSessionChoreography(orgId: string): Promise<SessionChoreography[]> {
    return sessionChoreographyRepository.getByOrganisation(orgId);
  }
};
