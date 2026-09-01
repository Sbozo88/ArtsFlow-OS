import { attendanceRepository } from '../repositories/attendanceRepository';
import { auditService } from './auditService';
import type { Attendance, AttendanceStatus } from '../types';

export const attendanceService = {
  async markAttendance(
    orgId: string,
    actorId: string,
    data: {
      sessionId: string;
      learnerId: string;
      attendanceStatus: AttendanceStatus;
      arrivalTime?: string;
      notes?: string;
    }
  ): Promise<Attendance> {
    // Prevent duplicate attendance for same session + learner
    const duplicate = await attendanceRepository.getDuplicate(orgId, data.sessionId, data.learnerId);
    if (duplicate) throw new Error('Attendance already recorded for this learner in this session');

    const attendance = await attendanceRepository.create(orgId, actorId, {
      sessionId: data.sessionId,
      learnerId: data.learnerId,
      attendanceStatus: data.attendanceStatus,
      arrivalTime: data.arrivalTime,
      notes: data.notes,
      markedBy: actorId,
    });

    await auditService.log(orgId, actorId, 'MARK_ATTENDANCE', 'attendance', attendance.id, undefined, attendance);
    return attendance;
  },

  async bulkMarkAttendance(
    orgId: string,
    actorId: string,
    sessionId: string,
    records: Array<{ learnerId: string; attendanceStatus: AttendanceStatus; arrivalTime?: string; notes?: string }>
  ): Promise<Attendance[]> {
    const results: Attendance[] = [];

    for (const record of records) {
      // Check for existing attendance — update if exists, create if not
      const existing = await attendanceRepository.getDuplicate(orgId, sessionId, record.learnerId);

      if (existing) {
        // Update existing record
        await attendanceRepository.update(orgId, actorId, existing.id, {
          attendanceStatus: record.attendanceStatus,
          arrivalTime: record.arrivalTime,
          notes: record.notes,
          markedBy: actorId,
        } as Partial<Omit<Attendance, keyof import('../types').BaseRecord>>);

        await auditService.log(orgId, actorId, 'UPDATE', 'attendance', existing.id, existing, {
          ...existing,
          attendanceStatus: record.attendanceStatus,
        });

        results.push({ ...existing, attendanceStatus: record.attendanceStatus });
      } else {
        // Create new record
        const attendance = await attendanceRepository.create(orgId, actorId, {
          sessionId,
          learnerId: record.learnerId,
          attendanceStatus: record.attendanceStatus,
          arrivalTime: record.arrivalTime,
          notes: record.notes,
          markedBy: actorId,
        });

        await auditService.log(orgId, actorId, 'MARK_ATTENDANCE', 'attendance', attendance.id, undefined, attendance);
        results.push(attendance);
      }
    }

    return results;
  },

  async getSessionAttendance(orgId: string, sessionId: string): Promise<Attendance[]> {
    return attendanceRepository.getBySessionId(orgId, sessionId);
  },

  async getLearnerAttendance(orgId: string, learnerId: string): Promise<Attendance[]> {
    return attendanceRepository.getByLearnerId(orgId, learnerId);
  },

  async updateAttendance(
    orgId: string,
    actorId: string,
    id: string,
    updates: Partial<Pick<Attendance, 'attendanceStatus' | 'arrivalTime' | 'departureTime' | 'notes'>>
  ): Promise<void> {
    const before = await attendanceRepository.getById(orgId, id);
    if (!before) throw new Error('Attendance record not found');

    await attendanceRepository.update(orgId, actorId, id, {
      ...updates,
      markedBy: actorId,
    } as Partial<Omit<Attendance, keyof import('../types').BaseRecord>>);

    await auditService.log(orgId, actorId, 'UPDATE', 'attendance', id, before, { ...before, ...updates });
  },
};
