import { staffSubstitutionRepository } from '../repositories/staffSubstitutionRepository';
import { sessionRepository } from '../repositories/sessionRepository';
import { staffRepository } from '../repositories/staffRepository';
import { staffAvailabilityService } from './staffAvailabilityService';
import { notificationService } from './automation/notificationService';
import { auditService } from './auditService';
import type { StaffSubstitution, SubstitutionStatus } from '../types';

export interface RequestSubstitutionInput {
  sessionId: string;
  originalStaffId: string;
  substituteStaffId: string;
  reason: string;
  notes?: string;
}

export const staffSubstitutionService = {
  /**
   * Creates a substitution request after checking availability of the proposed substitute.
   */
  async requestSubstitution(
    organisationId: string,
    actorId: string,
    input: RequestSubstitutionInput
  ): Promise<{ substitution: StaffSubstitution; availabilityWarning?: string }> {
    const session = await sessionRepository.getById(organisationId, input.sessionId);
    if (!session) throw new Error(`Session ${input.sessionId} not found.`);

    const originalStaff = await staffRepository.getById(organisationId, input.originalStaffId);
    if (!originalStaff) throw new Error(`Staff member ${input.originalStaffId} not found.`);

    const substituteStaff = await staffRepository.getById(organisationId, input.substituteStaffId);
    if (!substituteStaff) throw new Error(`Substitute staff member ${input.substituteStaffId} not found.`);

    // Check substitute availability
    const availCheck = await staffAvailabilityService.checkAvailabilityStatus(
      organisationId,
      input.substituteStaffId,
      session.date,
      session.startTime,
      session.endTime
    );

    let availabilityWarning: string | undefined;
    if (availCheck.status === 'unavailable') {
      availabilityWarning = `Substitute is marked as unavailable on ${session.date}: ${availCheck.reason || 'General unavailability'}`;
    } else if (availCheck.status === 'potential_conflict') {
      availabilityWarning = `Substitute has potential conflict on ${session.date}: ${availCheck.reason}`;
    }

    const substitution = await staffSubstitutionRepository.create(organisationId, actorId, {
      sessionId: input.sessionId,
      originalStaffId: input.originalStaffId,
      substituteStaffId: input.substituteStaffId,
      reason: input.reason,
      substitutionStatus: 'requested',
      requestedAt: new Date().toISOString(),
      notes: input.notes
    });

    await auditService.log(
      organisationId,
      actorId,
      'CREATE_SUBSTITUTION',
      'staffSubstitution',
      substitution.id,
      undefined,
      {
        sessionId: input.sessionId,
        originalStaffId: input.originalStaffId,
        substituteStaffId: input.substituteStaffId,
        warning: availabilityWarning
      }
    );

    return { substitution, availabilityWarning };
  },

  /**
   * Confirms a substitution, updates the session's active teacher, and dispatches in-app notifications.
   */
  async confirmSubstitution(
    organisationId: string,
    substitutionId: string,
    actorId: string
  ): Promise<StaffSubstitution> {
    const original = await staffSubstitutionRepository.getById(organisationId, substitutionId);
    if (!original) throw new Error(`Substitution ${substitutionId} not found.`);

    const session = await sessionRepository.getById(organisationId, original.sessionId);
    if (!session) throw new Error(`Session ${original.sessionId} not found.`);

    const now = new Date().toISOString();

    // 1. Update substitution status
    await staffSubstitutionRepository.updateStatus(organisationId, actorId, substitutionId, 'confirmed', {
      confirmedAt: now
    });

    // 2. Update session teacher to substitute
    await sessionRepository.update(organisationId, actorId, original.sessionId, {
      teacherIds: [original.substituteStaffId]
    });

    // 3. Send in-app notification to substitute teacher
    try {
      await notificationService.createNotification(organisationId, actorId, {
        recipientUserId: original.substituteStaffId,
        notificationType: 'staff_operations',
        title: 'Substitution Confirmed',
        message: `You have been confirmed as substitute teacher for session on ${session.date} (${session.startTime || ''} - ${session.endTime || ''}).`,
        severity: 'attention',
        relatedEntityType: 'session',
        relatedEntityId: original.sessionId
      });

      // Notification to original teacher
      await notificationService.createNotification(organisationId, actorId, {
        recipientUserId: original.originalStaffId,
        notificationType: 'staff_operations',
        title: 'Substitution Arranged',
        message: `A substitute teacher has been confirmed for your session on ${session.date}.`,
        severity: 'info',
        relatedEntityType: 'session',
        relatedEntityId: original.sessionId
      });
    } catch (err) {
      console.warn('Could not dispatch in-app notifications for substitution:', err);
    }

    const updated = {
      ...original,
      substitutionStatus: 'confirmed' as SubstitutionStatus,
      confirmedAt: now
    };

    // 4. Audit
    await auditService.log(
      organisationId,
      actorId,
      'CONFIRM_SUBSTITUTION',
      'staffSubstitution',
      substitutionId,
      original,
      { substitutionStatus: 'confirmed', confirmedAt: now }
    );

    return updated;
  },

  /**
   * Cancels a substitution.
   */
  async cancelSubstitution(
    organisationId: string,
    substitutionId: string,
    actorId: string
  ): Promise<void> {
    const original = await staffSubstitutionRepository.getById(organisationId, substitutionId);
    if (!original) throw new Error(`Substitution ${substitutionId} not found.`);

    await staffSubstitutionRepository.updateStatus(organisationId, actorId, substitutionId, 'cancelled');

    // Restore original teacher on session if it was confirmed
    if (original.substitutionStatus === 'confirmed') {
      await sessionRepository.update(organisationId, actorId, original.sessionId, {
        teacherIds: [original.originalStaffId]
      });
    }

    await auditService.log(
      organisationId,
      actorId,
      'CANCEL_SUBSTITUTION',
      'staffSubstitution',
      substitutionId,
      original,
      { substitutionStatus: 'cancelled' }
    );
  },

  /**
   * Retrieves all substitutions for a session.
   */
  async getSubstitutionsForSession(organisationId: string, sessionId: string): Promise<StaffSubstitution[]> {
    return staffSubstitutionRepository.getBySessionId(organisationId, sessionId);
  },

  /**
   * Retrieves all substitutions for a staff member.
   */
  async getSubstitutionsForStaff(organisationId: string, staffId: string): Promise<StaffSubstitution[]> {
    return staffSubstitutionRepository.getByStaffId(organisationId, staffId);
  }
};
