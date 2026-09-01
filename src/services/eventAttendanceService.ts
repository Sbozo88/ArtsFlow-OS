import { eventAttendanceRepository } from '../repositories/eventAttendanceRepository';
import { EventAttendance } from '../types';
import { auditService } from './auditService';
import { eventRepository } from '../repositories/eventRepository';
import { learnerRepository } from '../repositories/learnerRepository';

export const eventAttendanceService = {
  async getEventAttendance(organisationId: string, eventId: string): Promise<EventAttendance[]> {
    const attendance = await eventAttendanceRepository.getByOrganisation(organisationId);
    return attendance.filter(a => a.eventId === eventId);
  },

  async markEventAttendance(
    organisationId: string,
    data: Omit<EventAttendance, keyof import('../types').BaseRecord | 'organisationId'>,
    userId: string
  ): Promise<EventAttendance> {
    const event = await eventRepository.getById(organisationId, data.eventId);
    if (!event) throw new Error('Event not found');

    const learner = await learnerRepository.getById(organisationId, data.learnerId);
    if (!learner) throw new Error('Learner not found');

    const existing = await this.getEventAttendance(organisationId, data.eventId);
    const existingRecord = existing.find(a => a.learnerId === data.learnerId);

    if (existingRecord) {
      await eventAttendanceRepository.update(organisationId, userId, existingRecord.id, {
        attendanceStatus: data.attendanceStatus,
        arrivalTime: data.arrivalTime,
        departureTime: data.departureTime,
        notes: data.notes,
        markedBy: data.markedBy
      } as never);
      const updated = await eventAttendanceRepository.getById(organisationId, existingRecord.id);
      await auditService.log(
        organisationId,
        userId,
        'UPDATE_EVENT_ATTENDANCE',
        'eventAttendance',
        existingRecord.id,
        existingRecord,
        updated
      );
      return updated!;
    }

    const newRecord = await eventAttendanceRepository.create(organisationId, userId, data as never);
    await auditService.log(
      organisationId,
      userId,
      'MARK_EVENT_ATTENDANCE',
      'eventAttendance',
      newRecord.id,
      undefined,
      newRecord
    );
    return newRecord;
  }
};