import { Session, SessionType } from '../types';
import { sessionRepository } from '../repositories/sessionRepository';
import { auditService } from './auditService';

export const sessionService = {
  async createSession(
    orgId: string, 
    actorId: string, 
    data: {
      groupId: string;
      date: string;
      startTime: string;
      endTime: string;
      sessionType: SessionType;
      teacherIds: string[];
    }
  ): Promise<string> {
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const session: Session = {
      ...data,
      id: newId,
      organisationId: orgId,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
      status: 'active'
    };

    await sessionRepository.create(session);
    
    await auditService.log({
      organisationId: orgId,
      actorId,
      action: 'CREATE',
      entityType: 'session',
      entityId: newId,
      after: session
    });

    return newId;
  },

  async getGroupSessions(orgId: string, groupId: string): Promise<Session[]> {
    return sessionRepository.getByGroup(orgId, groupId);
  }
};
