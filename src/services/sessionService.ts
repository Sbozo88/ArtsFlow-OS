import { sessionRepository } from '../repositories/sessionRepository';
import { programmeGroupRepository } from '../repositories/programmeGroupRepository';
import { auditService } from './auditService';
import type { Session, SessionType, SessionStatus } from '../types';

export const sessionService = {
  async createSession(
    orgId: string,
    actorId: string,
    data: {
      groupId: string;
      date: string;
      startTime: string;
      endTime: string;
      venue?: string;
      teacherIds: string[];
      sessionType: SessionType;
      notes?: string;
    }
  ): Promise<Session> {
    // Validate group exists and belongs to org
    const group = await programmeGroupRepository.getById(orgId, data.groupId);
    if (!group) throw new Error('Group not found in this organisation');

    const session = await sessionRepository.create(orgId, actorId, {
      groupId: data.groupId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      venue: data.venue,
      teacherIds: data.teacherIds,
      sessionType: data.sessionType as SessionType,
      sessionStatus: 'scheduled' as SessionStatus,
      notes: data.notes,
    });

    await auditService.log(orgId, actorId, 'CREATE', 'session', session.id, undefined, session);
    return session;
  },

  async getSessions(orgId: string): Promise<Session[]> {
    return sessionRepository.getByOrganisation(orgId);
  },

  async getSessionsByGroup(orgId: string, groupId: string): Promise<Session[]> {
    return sessionRepository.getByGroupId(orgId, groupId);
  },

  async getSessionsByDate(orgId: string, date: string): Promise<Session[]> {
    return sessionRepository.getByDate(orgId, date);
  },

  async getSessionsByDateRange(orgId: string, startDate: string, endDate: string): Promise<Session[]> {
    return sessionRepository.getByDateRange(orgId, startDate, endDate);
  },

  async getSession(orgId: string, id: string): Promise<Session | null> {
    return sessionRepository.getById(orgId, id);
  },

  async updateSessionStatus(
    orgId: string,
    actorId: string,
    id: string,
    newStatus: SessionStatus
  ): Promise<void> {
    const before = await sessionRepository.getById(orgId, id);
    if (!before) throw new Error('Session not found');

    const auditAction = newStatus === 'cancelled' ? 'CANCEL' : newStatus === 'completed' ? 'COMPLETE' : 'UPDATE';

    await sessionRepository.update(orgId, actorId, id, {
      sessionStatus: newStatus,
    } as Partial<Omit<Session, keyof import('../types').BaseRecord>>);

    await auditService.log(orgId, actorId, auditAction, 'session', id, before, { ...before, sessionStatus: newStatus });
  },

  async updateSession(
    orgId: string,
    actorId: string,
    id: string,
    updates: Partial<Pick<Session, 'date' | 'startTime' | 'endTime' | 'venue' | 'teacherIds' | 'sessionType' | 'notes'>>
  ): Promise<void> {
    const before = await sessionRepository.getById(orgId, id);
    if (!before) throw new Error('Session not found');

    await sessionRepository.update(orgId, actorId, id, updates as Partial<Omit<Session, keyof import('../types').BaseRecord>>);
    await auditService.log(orgId, actorId, 'UPDATE', 'session', id, before, { ...before, ...updates });
  },
};
