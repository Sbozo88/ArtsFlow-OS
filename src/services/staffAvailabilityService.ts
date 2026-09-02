import { staffAvailabilityRepository } from '../repositories/staffAvailabilityRepository';
import { staffRepository } from '../repositories/staffRepository';
import { auditService } from './auditService';
import type { 
  StaffAvailability, 
  AvailabilityType, 
  AvailabilityStatus 
} from '../types';

export interface SetStaffAvailabilityInput {
  staffId: string;
  availabilityType: AvailabilityType;
  date?: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  reason?: string;
  notes?: string;
}

export const staffAvailabilityService = {
  /**
   * Sets or updates availability preferences for a staff member.
   */
  async setAvailability(
    organisationId: string,
    actorId: string,
    input: SetStaffAvailabilityInput
  ): Promise<StaffAvailability> {
    const staff = await staffRepository.getById(organisationId, input.staffId);
    if (!staff) throw new Error(`Staff member ${input.staffId} not found in this organisation.`);

    const record = await staffAvailabilityRepository.create(organisationId, actorId, {
      staffId: input.staffId,
      availabilityType: input.availabilityType,
      date: input.date,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      reason: input.reason,
      notes: input.notes,
      availabilityStatus: 'active'
    });

    await auditService.log(
      organisationId,
      actorId,
      'UPDATE_STAFF_AVAILABILITY',
      'staffAvailability',
      record.id,
      undefined,
      { staffId: input.staffId, availabilityType: input.availabilityType, date: input.date, dayOfWeek: input.dayOfWeek }
    );

    return record;
  },

  /**
   * Retrieves availability records for a staff member.
   */
  async getAvailabilityForStaff(organisationId: string, staffId: string): Promise<StaffAvailability[]> {
    return staffAvailabilityRepository.getByStaffId(organisationId, staffId);
  },

  /**
   * Archives or removes an availability entry.
   */
  async removeAvailability(organisationId: string, availabilityId: string, actorId: string): Promise<void> {
    await staffAvailabilityRepository.updateStatus(organisationId, actorId, availabilityId, 'archived' as AvailabilityStatus);
  },

  /**
   * Evaluates if a staff member is available or has potential conflicts for a given date and time range.
   */
  async checkAvailabilityStatus(
    organisationId: string,
    staffId: string,
    date: string,
    startTime?: string,
    endTime?: string
  ): Promise<{
    status: 'available' | 'potential_conflict' | 'unavailable';
    reason?: string;
  }> {
    const d = new Date(date);
    const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat

    const matchingAvailabilities = await staffAvailabilityRepository.getForDate(
      organisationId,
      staffId,
      date,
      dayOfWeek
    );

    // If explicit unavailable on date
    const unavailable = matchingAvailabilities.find(a => a.availabilityType === 'unavailable');
    if (unavailable) {
      return {
        status: 'unavailable',
        reason: unavailable.reason || 'Staff marked as unavailable on this date.'
      };
    }

    // Check time range conflicts if provided
    if (startTime && endTime) {
      for (const a of matchingAvailabilities) {
        if (a.availabilityType === 'limited' && a.startTime && a.endTime) {
          // If requested time is outside limited available window
          if (startTime < a.startTime || endTime > a.endTime) {
            return {
              status: 'potential_conflict',
              reason: `Staff limited availability window is ${a.startTime} - ${a.endTime}.`
            };
          }
        }
      }
    }

    const preferred = matchingAvailabilities.find(a => a.availabilityType === 'preferred' || a.availabilityType === 'available');
    if (preferred) {
      return { status: 'available' };
    }

    return { status: 'available' };
  }
};
