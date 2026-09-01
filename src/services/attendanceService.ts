import { Attendance, AttendanceStatus } from '../types';
import { attendanceRepository } from '../repositories/attendanceRepository';
import { auditService } from './auditService';

export const attendanceService = {
  async markAttendance(
    orgId: string,
    actorId: string,
    sessionId: string,
    learnerId: string,
    status: AttendanceStatus
  ): Promise<void> {
    const id = `${sessionId}_${learnerId}`;
    const now = new Date().toISOString();
    
    const attendance: Attendance = {
      id,
      organisationId: orgId,
      sessionId,
      learnerId,
      attendanceStatus: status,
      markedBy: actorId,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
      status: 'active'
    };

    await attendanceRepository.upsert(attendance);
    
    await auditService.log({
      organisationId: orgId,
      actorId,
      action: 'UPDATE',
      entityType: 'attendance',
      entityId: id,
      after: attendance
    });
  },

  async getSessionAttendance(orgId: string, sessionId: string): Promise<Attendance[]> {
    return attendanceRepository.getBySession(orgId, sessionId);
  }
};
