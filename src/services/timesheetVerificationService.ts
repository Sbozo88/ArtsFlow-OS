import { timesheetRepository } from '../repositories/timesheetRepository';
import { timesheetEntryRepository } from '../repositories/timesheetEntryRepository';
import { staffWorkRecordRepository } from '../repositories/staffWorkRecordRepository';
import { auditService } from './auditService';
import type { Timesheet, TimesheetStatus } from '../types';

export const timesheetVerificationService = {
  /**
   * Verifies an operational timesheet and its underlying entries.
   * Confirms: "Did this work actually occur?"
   */
  async verifyTimesheet(
    organisationId: string,
    timesheetId: string,
    actorId: string,
    entryDecisions?: { entryId: string; verified: boolean }[]
  ): Promise<Timesheet> {
    const original = await timesheetRepository.getById(organisationId, timesheetId);
    if (!original) throw new Error(`Timesheet ${timesheetId} not found.`);

    if (original.timesheetStatus !== 'submitted' && original.timesheetStatus !== 'under_review') {
      throw new Error(`Timesheet cannot be verified while in '${original.timesheetStatus}' status.`);
    }

    const now = new Date().toISOString();

    // 1. Process entry-level verification if specific decisions provided
    if (entryDecisions && entryDecisions.length > 0) {
      for (const d of entryDecisions) {
        await timesheetEntryRepository.updateStatus(
          organisationId,
          actorId,
          d.entryId,
          d.verified ? 'verified' : 'rejected'
        );
      }
    } else {
      // Default: mark all included entries as verified
      const entries = await timesheetEntryRepository.getByTimesheetId(organisationId, timesheetId);
      for (const e of entries) {
        if (e.entryStatus === 'included') {
          await timesheetEntryRepository.updateStatus(organisationId, actorId, e.id, 'verified');
          if (e.workRecordId) {
            await staffWorkRecordRepository.updateStatus(organisationId, actorId, e.workRecordId, 'verified', {
              verifiedBy: actorId,
              verifiedAt: now
            });
          }
        }
      }
    }

    // 2. Update timesheet to verified
    await timesheetRepository.updateStatus(organisationId, actorId, timesheetId, 'verified', {
      verifiedAt: now,
      verifiedBy: actorId
    });

    const updated = {
      ...original,
      timesheetStatus: 'verified' as TimesheetStatus,
      verifiedAt: now,
      verifiedBy: actorId
    };

    // 3. Audit
    await auditService.log(
      organisationId,
      actorId,
      'VERIFY_TIMESHEET',
      'timesheet',
      timesheetId,
      original,
      { timesheetStatus: 'verified', verifiedBy: actorId, verifiedAt: now }
    );

    return updated;
  },

  /**
   * Approves a verified timesheet.
   * Enforces Self-Approval Protection: A staff member cannot approve their own timesheet.
   */
  async approveTimesheet(
    organisationId: string,
    timesheetId: string,
    actorId: string
  ): Promise<Timesheet> {
    const original = await timesheetRepository.getById(organisationId, timesheetId);
    if (!original) throw new Error(`Timesheet ${timesheetId} not found.`);

    // Self-approval protection guard
    if (original.submittedBy === actorId) {
      throw new Error('Self-approval not permitted. An independent verifier or administrator must approve this timesheet.');
    }

    if (original.timesheetStatus !== 'verified') {
      throw new Error(`Timesheet must be verified before approval. Current status: ${original.timesheetStatus}`);
    }

    const now = new Date().toISOString();
    await timesheetRepository.updateStatus(organisationId, actorId, timesheetId, 'approved', {
      approvedAt: now,
      approvedBy: actorId
    });

    const updated = {
      ...original,
      timesheetStatus: 'approved' as TimesheetStatus,
      approvedAt: now,
      approvedBy: actorId
    };

    await auditService.log(
      organisationId,
      actorId,
      'APPROVE_TIMESHEET',
      'timesheet',
      timesheetId,
      original,
      { timesheetStatus: 'approved', approvedBy: actorId, approvedAt: now }
    );

    return updated;
  },

  /**
   * Rejects a timesheet with a mandatory reason, returning it to rejected status for correction.
   */
  async rejectTimesheet(
    organisationId: string,
    timesheetId: string,
    actorId: string,
    rejectionReason: string
  ): Promise<Timesheet> {
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new Error('Rejection reason is required to reject a timesheet.');
    }

    const original = await timesheetRepository.getById(organisationId, timesheetId);
    if (!original) throw new Error(`Timesheet ${timesheetId} not found.`);

    const now = new Date().toISOString();
    await timesheetRepository.updateStatus(organisationId, actorId, timesheetId, 'rejected', {
      rejectedAt: now,
      rejectedBy: actorId,
      rejectionReason: rejectionReason.trim()
    });

    const updated = {
      ...original,
      timesheetStatus: 'rejected' as TimesheetStatus,
      rejectedAt: now,
      rejectedBy: actorId,
      rejectionReason: rejectionReason.trim()
    };

    await auditService.log(
      organisationId,
      actorId,
      'REJECT_TIMESHEET',
      'timesheet',
      timesheetId,
      original,
      { timesheetStatus: 'rejected', rejectedBy: actorId, rejectionReason }
    );

    return updated;
  }
};
