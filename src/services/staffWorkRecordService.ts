import { staffWorkRecordRepository } from '../repositories/staffWorkRecordRepository';
import { staffRepository } from '../repositories/staffRepository';
import { sessionRepository } from '../repositories/sessionRepository';
import { eventRepository } from '../repositories/eventRepository';
import { eventStaffRepository } from '../repositories/eventStaffRepository';
import { staffSubstitutionRepository } from '../repositories/staffSubstitutionRepository';
import { programmeGroupRepository } from '../repositories/programmeGroupRepository';
import { auditService } from './auditService';
import type { 
  StaffWorkRecord, 
  WorkType,
  EventStaff
} from '../types';

export interface CreateManualWorkRecordInput {
  staffId: string;
  workType: WorkType;
  programmeId?: string;
  groupId?: string;
  workDate: string;
  startTime?: string;
  endTime?: string;
  durationMinutes: number;
  notes?: string;
}

export const staffWorkRecordService = {
  /**
   * Creates a manual work record with duration validation and time overlap checking.
   */
  async createManualRecord(
    organisationId: string,
    actorId: string,
    input: CreateManualWorkRecordInput
  ): Promise<{ record: StaffWorkRecord; warnings: string[] }> {
    // 1. Duration validation
    if (!input.durationMinutes || input.durationMinutes <= 0) {
      throw new Error('Work duration must be greater than zero minutes.');
    }

    const warnings: string[] = [];
    if (input.durationMinutes > 720) {
      warnings.push('Duration exceeds 12 hours (720 minutes). Verification required.');
    }

    // 2. Staff existence check
    const staff = await staffRepository.getById(organisationId, input.staffId);
    if (!staff) throw new Error(`Staff member ${input.staffId} not found in this organisation.`);

    // 3. Time overlap detection if start and end times provided
    if (input.startTime && input.endTime) {
      const existingRecords = await staffWorkRecordRepository.getByStaffAndDateRange(
        organisationId,
        input.staffId,
        input.workDate,
        input.workDate
      );

      for (const rec of existingRecords) {
        if (rec.startTime && rec.endTime) {
          // Check for time overlap
          const overlaps = (input.startTime < rec.endTime) && (input.endTime > rec.startTime);
          if (overlaps) {
            warnings.push(
              `Time interval ${input.startTime}-${input.endTime} overlaps with existing work record (${rec.startTime}-${rec.endTime}, ${rec.workType}).`
            );
            break;
          }
        }
      }
    }

    // 4. Create persistent work record
    const record = await staffWorkRecordRepository.create(organisationId, actorId, {
      staffId: input.staffId,
      workType: input.workType,
      programmeId: input.programmeId,
      groupId: input.groupId,
      workDate: input.workDate,
      startTime: input.startTime,
      endTime: input.endTime,
      durationMinutes: input.durationMinutes,
      workStatus: 'recorded',
      sourceType: 'manual',
      notes: input.notes
    });

    // 5. Audit
    await auditService.log(
      organisationId,
      actorId,
      'CREATE_WORK_RECORD',
      'staffWorkRecord',
      record.id,
      undefined,
      {
        staffId: input.staffId,
        workType: input.workType,
        workDate: input.workDate,
        durationMinutes: input.durationMinutes,
        warnings
      }
    );

    return { record, warnings };
  },

  /**
   * Auto-generates draft work records from a completed teaching session.
   * Handles substitution attribution so the substitute teacher receives the work record.
   * Enforces session completion integrity (skips cancelled sessions).
   * Prevents duplicate work records deterministically.
   */
  async generateFromSession(
    organisationId: string,
    sessionId: string,
    actorId: string,
    allowCancelledException = false
  ): Promise<StaffWorkRecord[]> {
    const session = await sessionRepository.getById(organisationId, sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found.`);

    // Session completion integrity guard
    if (session.sessionStatus === 'cancelled' && !allowCancelledException) {
      return [];
    }

    // Determine duration in minutes
    let durationMinutes = 60; // default fallback
    if (session.startTime && session.endTime) {
      const [sh, sm] = session.startTime.split(':').map(Number);
      const [eh, em] = session.endTime.split(':').map(Number);
      const calculated = (eh * 60 + em) - (sh * 60 + sm);
      if (calculated > 0) durationMinutes = calculated;
    }

    // Check if session has a confirmed substitute
    const substitutions = await staffSubstitutionRepository.getBySessionId(organisationId, sessionId);
    const confirmedSub = substitutions.find(s => s.substitutionStatus === 'confirmed' || s.substitutionStatus === 'completed');

    // Determine who actually taught
    const staffIdsToCredit: string[] = [];
    if (confirmedSub) {
      // Attribute work to substitute teacher!
      staffIdsToCredit.push(confirmedSub.substituteStaffId);
    } else {
      // Original teacher(s)
      if (session.teacherIds) {
        for (const tid of session.teacherIds) {
          if (!staffIdsToCredit.includes(tid)) staffIdsToCredit.push(tid);
        }
      }
    }

    // Lookup programmeId via group if available
    let progId: string | undefined;
    if (session.groupId) {
      const grp = await programmeGroupRepository.getById(organisationId, session.groupId);
      progId = grp?.programmeId;
    }

    const createdRecords: StaffWorkRecord[] = [];

    for (const staffId of staffIdsToCredit) {
      // Deduplication check: prevent multiple work records for same staff & session
      const existing = await staffWorkRecordRepository.getBySource(
        organisationId,
        staffId,
        'session',
        sessionId,
        'teaching'
      );

      if (existing) {
        continue; // skip duplicate creation
      }

      const record = await staffWorkRecordRepository.create(organisationId, actorId, {
        staffId,
        workType: 'teaching',
        sessionId,
        programmeId: progId,
        groupId: session.groupId,
        workDate: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        durationMinutes,
        workStatus: 'draft',
        sourceType: 'session',
        sourceRecordId: sessionId,
        notes: confirmedSub ? `Substitute teaching covering for ${confirmedSub.originalStaffId}` : undefined
      });

      await auditService.log(
        organisationId,
        actorId,
        'CREATE_WORK_RECORD',
        'staffWorkRecord',
        record.id,
        undefined,
        { staffId, sessionId, durationMinutes, isSubstitute: !!confirmedSub }
      );

      createdRecords.push(record);
    }

    return createdRecords;
  },

  /**
   * Auto-generates work records from a completed performance or event for confirmed staff.
   */
  async generateFromEvent(
    organisationId: string,
    eventId: string,
    actorId: string,
    defaultDurationMinutes = 180
  ): Promise<StaffWorkRecord[]> {
    const event = await eventRepository.getById(organisationId, eventId);
    if (!event) throw new Error(`Event ${eventId} not found.`);

    if (event.eventStatus === 'cancelled') {
      return [];
    }

    const staffMembers = await eventStaffRepository.getByEvent(organisationId, eventId);
    const confirmedStaff = staffMembers.filter((s: EventStaff) => s.participationStatus === 'confirmed' || s.participationStatus === 'attended');

    const createdRecords: StaffWorkRecord[] = [];
    const eventDate = event.startDate ? event.startDate.split('T')[0] : new Date().toISOString().split('T')[0];

    for (const staffItem of confirmedStaff) {
      const existing = await staffWorkRecordRepository.getBySource(
        organisationId,
        staffItem.staffId,
        'event',
        eventId,
        'event'
      );

      if (existing) continue;

      const record = await staffWorkRecordRepository.create(organisationId, actorId, {
        staffId: staffItem.staffId,
        workType: 'event',
        eventId,
        workDate: eventDate,
        durationMinutes: defaultDurationMinutes,
        workStatus: 'draft',
        sourceType: 'event',
        sourceRecordId: eventId,
        notes: `Event participation: ${event.name} (${staffItem.eventRole})`
      });

      await auditService.log(
        organisationId,
        actorId,
        'CREATE_WORK_RECORD',
        'staffWorkRecord',
        record.id,
        undefined,
        { staffId: staffItem.staffId, eventId, durationMinutes: defaultDurationMinutes }
      );

      createdRecords.push(record);
    }

    return createdRecords;
  },

  /**
   * Verifies an operational work record.
   */
  async verifyRecord(organisationId: string, recordId: string, actorId: string): Promise<void> {
    const original = await staffWorkRecordRepository.getById(organisationId, recordId);
    if (!original) throw new Error(`Work record ${recordId} not found.`);

    const now = new Date().toISOString();
    await staffWorkRecordRepository.updateStatus(organisationId, actorId, recordId, 'verified', {
      verifiedBy: actorId,
      verifiedAt: now
    });

    await auditService.log(
      organisationId,
      actorId,
      'VERIFY_WORK_RECORD',
      'staffWorkRecord',
      recordId,
      original,
      { workStatus: 'verified', verifiedBy: actorId, verifiedAt: now }
    );
  },

  /**
   * Rejects a work record with documented reason.
   */
  async rejectRecord(organisationId: string, recordId: string, actorId: string, reason: string): Promise<void> {
    const original = await staffWorkRecordRepository.getById(organisationId, recordId);
    if (!original) throw new Error(`Work record ${recordId} not found.`);

    await staffWorkRecordRepository.updateStatus(organisationId, actorId, recordId, 'rejected', {
      rejectionReason: reason
    });

    await auditService.log(
      organisationId,
      actorId,
      'REJECT_WORK_RECORD',
      'staffWorkRecord',
      recordId,
      original,
      { workStatus: 'rejected', rejectionReason: reason }
    );
  },

  /**
   * Gets work records for a staff member.
   */
  async getRecordsForStaff(organisationId: string, staffId: string): Promise<StaffWorkRecord[]> {
    return staffWorkRecordRepository.getByStaffId(organisationId, staffId);
  },

  /**
   * Gets unverified work records across the organisation.
   */
  async getUnverifiedRecords(organisationId: string): Promise<StaffWorkRecord[]> {
    return staffWorkRecordRepository.getUnverified(organisationId);
  }
};
