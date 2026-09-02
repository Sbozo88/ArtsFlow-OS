import { describe, it, expect, vi, beforeEach } from 'vitest';
import { staffAssignmentService } from '../staffAssignmentService';
import { staffAvailabilityService } from '../staffAvailabilityService';
import { staffWorkRecordService } from '../staffWorkRecordService';
import { timesheetService } from '../timesheetService';
import { timesheetVerificationService } from '../timesheetVerificationService';
import { staffSubstitutionService } from '../staffSubstitutionService';
import { staffWorkloadService } from '../staffWorkloadService';

import { staffAssignmentRepository } from '../../repositories/staffAssignmentRepository';
import { staffAvailabilityRepository } from '../../repositories/staffAvailabilityRepository';
import { staffWorkRecordRepository } from '../../repositories/staffWorkRecordRepository';
import { timesheetRepository } from '../../repositories/timesheetRepository';
import { timesheetEntryRepository } from '../../repositories/timesheetEntryRepository';
import { staffSubstitutionRepository } from '../../repositories/staffSubstitutionRepository';
import { staffRepository } from '../../repositories/staffRepository';
import { sessionRepository } from '../../repositories/sessionRepository';
import { programmeGroupRepository } from '../../repositories/programmeGroupRepository';
import { notificationService } from '../automation/notificationService';
import { auditService } from '../auditService';

import type { 
  Staff, 
  StaffAssignment, 
  StaffAvailability, 
  StaffWorkRecord, 
  Timesheet, 
  TimesheetEntry, 
  StaffSubstitution,
  Session,
  ProgrammeGroup,
  AppNotification
} from '../../types';

describe('Phase 6A: Staff Operations, Timesheets & Workload Tests', () => {
  const orgId = 'org-test-phase6a';
  const actorId = 'admin-user-1';
  const staff1Id = 'staff-alice-101';
  const staff2Id = 'staff-bob-102';

  const mockStaffAlice: Staff = {
    id: staff1Id,
    organisationId: orgId,
    firstName: 'Alice',
    lastName: 'Venter',
    email: 'alice@artsflow.test',
    role: 'Teacher',
    staffStatus: 'active',
    specialisation: 'Violin, Orchestra',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z',
    createdBy: actorId,
    updatedBy: actorId,
    status: 'active'
  };

  const mockStaffBob: Staff = {
    id: staff2Id,
    organisationId: orgId,
    firstName: 'Bob',
    lastName: 'Khumalo',
    email: 'bob@artsflow.test',
    role: 'Teacher',
    staffStatus: 'active',
    specialisation: 'Cello, Chamber Music',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z',
    createdBy: actorId,
    updatedBy: actorId,
    status: 'active'
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(auditService, 'log').mockResolvedValue(undefined);
    vi.spyOn(notificationService, 'createNotification').mockResolvedValue({} as unknown as AppNotification);

    // Default mock staff retrieval
    vi.spyOn(staffRepository, 'getById').mockImplementation(async (_org, id) => {
      if (id === staff1Id) return mockStaffAlice;
      if (id === staff2Id) return mockStaffBob;
      return null;
    });

    vi.spyOn(staffRepository, 'getByOrganisation').mockResolvedValue([mockStaffAlice, mockStaffBob]);
    vi.spyOn(programmeGroupRepository, 'getById').mockResolvedValue(null);
  });

  describe('1. Staff Assignments Service', () => {
    it('creates an assignment for a valid staff member and group', async () => {
      const mockCreatedAssignment: StaffAssignment = {
        id: 'assign-1',
        organisationId: orgId,
        staffId: staff1Id,
        assignmentType: 'group',
        groupId: 'grp-strings-1',
        role: 'lead_teacher',
        startDate: '2026-09-01',
        assignmentStatus: 'active',
        isPrimary: true,
        createdAt: '2026-09-01T08:00:00Z',
        updatedAt: '2026-09-01T08:00:00Z',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      vi.spyOn(programmeGroupRepository, 'getById').mockResolvedValue({ id: 'grp-strings-1' } as unknown as ProgrammeGroup);
      const createSpy = vi.spyOn(staffAssignmentRepository, 'create').mockResolvedValue(mockCreatedAssignment);

      const result = await staffAssignmentService.createAssignment(orgId, actorId, {
        staffId: staff1Id,
        assignmentType: 'group',
        groupId: 'grp-strings-1',
        role: 'lead_teacher',
        startDate: '2026-09-01',
        isPrimary: true
      });

      expect(result.id).toBe('assign-1');
      expect(result.role).toBe('lead_teacher');
      expect(createSpy).toHaveBeenCalled();
    });

    it('rejects assignment creation if staff does not exist in organisation', async () => {
      await expect(
        staffAssignmentService.createAssignment(orgId, actorId, {
          staffId: 'non-existent-staff',
          assignmentType: 'group',
          role: 'lead_teacher',
          startDate: '2026-09-01'
        })
      ).rejects.toThrow(/not found in this organisation/);
    });

    it('ends an assignment with today date as end date', async () => {
      const existingAssignment: StaffAssignment = {
        id: 'assign-1',
        organisationId: orgId,
        staffId: staff1Id,
        assignmentType: 'group',
        role: 'lead_teacher',
        startDate: '2026-09-01',
        assignmentStatus: 'active',
        isPrimary: true,
        createdAt: '2026-09-01T08:00:00Z',
        updatedAt: '2026-09-01T08:00:00Z',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      vi.spyOn(staffAssignmentRepository, 'getById').mockResolvedValue(existingAssignment);
      const updateSpy = vi.spyOn(staffAssignmentRepository, 'update').mockResolvedValue();

      await staffAssignmentService.endAssignment(orgId, 'assign-1', actorId, 'completed');
      expect(updateSpy).toHaveBeenCalledWith(orgId, actorId, 'assign-1', expect.objectContaining({
        assignmentStatus: 'completed'
      }));
    });
  });

  describe('2. Staff Availability & Conflict Detection', () => {
    it('records availability preference correctly', async () => {
      const mockRecord: StaffAvailability = {
        id: 'avail-1',
        organisationId: orgId,
        staffId: staff1Id,
        availabilityType: 'preferred',
        dayOfWeek: 2, // Tuesday
        startTime: '09:00',
        endTime: '13:00',
        availabilityStatus: 'active',
        createdAt: '2026-09-01T08:00:00Z',
        updatedAt: '2026-09-01T08:00:00Z',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      vi.spyOn(staffAvailabilityRepository, 'create').mockResolvedValue(mockRecord);

      const result = await staffAvailabilityService.setAvailability(orgId, actorId, {
        staffId: staff1Id,
        availabilityType: 'preferred',
        dayOfWeek: 2,
        startTime: '09:00',
        endTime: '13:00'
      });

      expect(result.availabilityType).toBe('preferred');
      expect(result.dayOfWeek).toBe(2);
    });

    it('detects explicit unavailability for a given date', async () => {
      const blackoutRecord: StaffAvailability = {
        id: 'avail-blackout',
        organisationId: orgId,
        staffId: staff1Id,
        availabilityType: 'unavailable',
        date: '2026-09-15',
        reason: 'Orchestra rehearsal out of town',
        availabilityStatus: 'active',
        createdAt: '2026-09-01T08:00:00Z',
        updatedAt: '2026-09-01T08:00:00Z',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      vi.spyOn(staffAvailabilityRepository, 'getForDate').mockResolvedValue([blackoutRecord]);

      const check = await staffAvailabilityService.checkAvailabilityStatus(
        orgId,
        staff1Id,
        '2026-09-15',
        '10:00',
        '11:00'
      );

      expect(check.status).toBe('unavailable');
      expect(check.reason).toContain('Orchestra rehearsal out of town');
    });

    it('detects potential conflict when requested time is outside limited window', async () => {
      const limitedRecord: StaffAvailability = {
        id: 'avail-lim',
        organisationId: orgId,
        staffId: staff1Id,
        availabilityType: 'limited',
        dayOfWeek: 3, // Wednesday
        startTime: '14:00',
        endTime: '17:00',
        availabilityStatus: 'active',
        createdAt: '2026-09-01T08:00:00Z',
        updatedAt: '2026-09-01T08:00:00Z',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      vi.spyOn(staffAvailabilityRepository, 'getForDate').mockResolvedValue([limitedRecord]);

      // Requested session at 09:00 to 10:30 (outside 14:00 - 17:00)
      const check = await staffAvailabilityService.checkAvailabilityStatus(
        orgId,
        staff1Id,
        '2026-09-16', // Wednesday
        '09:00',
        '10:30'
      );

      expect(check.status).toBe('potential_conflict');
      expect(check.reason).toContain('limited availability window is 14:00 - 17:00');
    });
  });

  describe('3. Staff Work Records Service & Integrity Validation', () => {
    it('validates duration > 0 and rejects non-positive duration', async () => {
      await expect(
        staffWorkRecordService.createManualRecord(orgId, actorId, {
          staffId: staff1Id,
          workType: 'teaching',
          workDate: '2026-09-05',
          durationMinutes: 0
        })
      ).rejects.toThrow(/greater than zero minutes/);
    });

    it('flags work records exceeding 12 hours (720 minutes)', async () => {
      const mockRecord: StaffWorkRecord = {
        id: 'rec-long',
        organisationId: orgId,
        staffId: staff1Id,
        workType: 'event',
        workDate: '2026-09-05',
        durationMinutes: 750,
        workStatus: 'recorded',
        sourceType: 'manual',
        createdAt: '2026-09-05T08:00:00Z',
        updatedAt: '2026-09-05T08:00:00Z',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      vi.spyOn(staffWorkRecordRepository, 'getByStaffAndDateRange').mockResolvedValue([]);
      vi.spyOn(staffWorkRecordRepository, 'create').mockResolvedValue(mockRecord);

      const res = await staffWorkRecordService.createManualRecord(orgId, actorId, {
        staffId: staff1Id,
        workType: 'event',
        workDate: '2026-09-05',
        durationMinutes: 750
      });

      expect(res.warnings).toHaveLength(1);
      expect(res.warnings[0]).toContain('Duration exceeds 12 hours');
    });

    it('detects overlapping time intervals on the same date', async () => {
      const existing: StaffWorkRecord = {
        id: 'rec-exist',
        organisationId: orgId,
        staffId: staff1Id,
        workType: 'teaching',
        workDate: '2026-09-05',
        startTime: '09:00',
        endTime: '11:00',
        durationMinutes: 120,
        workStatus: 'recorded',
        sourceType: 'manual',
        createdAt: '2026-09-05T08:00:00Z',
        updatedAt: '2026-09-05T08:00:00Z',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      vi.spyOn(staffWorkRecordRepository, 'getByStaffAndDateRange').mockResolvedValue([existing]);
      vi.spyOn(staffWorkRecordRepository, 'create').mockResolvedValue({} as unknown as StaffWorkRecord);

      // Attempting to create record from 10:00 to 12:00 (overlaps with 09:00 - 11:00)
      const res = await staffWorkRecordService.createManualRecord(orgId, actorId, {
        staffId: staff1Id,
        workType: 'rehearsal',
        workDate: '2026-09-05',
        startTime: '10:00',
        endTime: '12:00',
        durationMinutes: 120
      });

      expect(res.warnings.some(w => w.includes('overlaps with existing work record'))).toBe(true);
    });

    it('auto-generates work record from completed session with duplicate prevention', async () => {
      const mockSession: Session = {
        id: 'sess-100',
        organisationId: orgId,
        groupId: 'grp-violin-1',
        sessionType: 'rehearsal',
        date: '2026-09-02',
        startTime: '09:00',
        endTime: '10:30',
        teacherIds: [staff1Id],
        sessionStatus: 'completed',
        createdAt: '2026-09-01T08:00:00Z',
        updatedAt: '2026-09-01T08:00:00Z',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      vi.spyOn(sessionRepository, 'getById').mockResolvedValue(mockSession);
      vi.spyOn(staffSubstitutionRepository, 'getBySessionId').mockResolvedValue([]);
      vi.spyOn(staffWorkRecordRepository, 'getBySource').mockResolvedValue(null);

      const createSpy = vi.spyOn(staffWorkRecordRepository, 'create').mockResolvedValue({
        id: 'rec-sess-100',
        staffId: staff1Id,
        durationMinutes: 90
      } as unknown as StaffWorkRecord);

      const generated = await staffWorkRecordService.generateFromSession(orgId, 'sess-100', actorId);
      expect(generated).toHaveLength(1);
      expect(createSpy).toHaveBeenCalledWith(orgId, actorId, expect.objectContaining({
        staffId: staff1Id,
        sessionId: 'sess-100',
        durationMinutes: 90,
        workType: 'teaching'
      }));

      // Test duplicate prevention: when getBySource returns existing record
      vi.spyOn(staffWorkRecordRepository, 'getBySource').mockResolvedValue({ id: 'rec-existing' } as unknown as StaffWorkRecord);
      const secondRun = await staffWorkRecordService.generateFromSession(orgId, 'sess-100', actorId);
      expect(secondRun).toHaveLength(0);
    });

    it('attributes work to substitute teacher when a confirmed substitution exists', async () => {
      const mockSession: Session = {
        id: 'sess-subbed',
        organisationId: orgId,
        groupId: 'grp-violin-1',
        sessionType: 'rehearsal',
        date: '2026-09-02',
        startTime: '09:00',
        endTime: '10:30',
        teacherIds: [staff2Id],
        sessionStatus: 'completed',
        createdAt: '2026-09-01T08:00:00Z',
        updatedAt: '2026-09-01T08:00:00Z',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      const mockSub: StaffSubstitution = {
        id: 'sub-1',
        organisationId: orgId,
        sessionId: 'sess-subbed',
        originalStaffId: staff1Id,
        substituteStaffId: staff2Id, // Bob is covering for Alice
        reason: 'Alice ill',
        substitutionStatus: 'confirmed',
        requestedAt: '2026-09-01T08:00:00Z',
        createdAt: '2026-09-01T08:00:00Z',
        updatedAt: '2026-09-01T08:00:00Z',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      vi.spyOn(sessionRepository, 'getById').mockResolvedValue(mockSession);
      vi.spyOn(staffSubstitutionRepository, 'getBySessionId').mockResolvedValue([mockSub]);
      vi.spyOn(staffWorkRecordRepository, 'getBySource').mockResolvedValue(null);

      const createSpy = vi.spyOn(staffWorkRecordRepository, 'create').mockResolvedValue({
        id: 'rec-sub-bob',
        staffId: staff2Id
      } as unknown as StaffWorkRecord);

      const result = await staffWorkRecordService.generateFromSession(orgId, 'sess-subbed', actorId);
      expect(result).toHaveLength(1);
      // Work record attributed to Bob (staff2Id), NOT Alice (staff1Id)!
      expect(createSpy).toHaveBeenCalledWith(orgId, actorId, expect.objectContaining({
        staffId: staff2Id
      }));
    });
  });

  describe('4. Timesheet Compilation & Submission Workflow', () => {
    it('compiles draft timesheet from eligible work records and calculates hours breakdown', async () => {
      const records: StaffWorkRecord[] = [
        {
          id: 'w-1',
          organisationId: orgId,
          staffId: staff1Id,
          workType: 'teaching',
          workDate: '2026-09-05',
          durationMinutes: 90,
          workStatus: 'recorded',
          sourceType: 'session',
          createdAt: '2026-09-05T08:00:00Z',
          updatedAt: '2026-09-05T08:00:00Z',
          createdBy: actorId,
          updatedBy: actorId,
          status: 'active'
        },
        {
          id: 'w-2',
          organisationId: orgId,
          staffId: staff1Id,
          workType: 'event',
          workDate: '2026-09-08',
          durationMinutes: 180,
          workStatus: 'recorded',
          sourceType: 'event',
          createdAt: '2026-09-08T08:00:00Z',
          updatedAt: '2026-09-08T08:00:00Z',
          createdBy: actorId,
          updatedBy: actorId,
          status: 'active'
        },
        {
          id: 'w-3',
          organisationId: orgId,
          staffId: staff1Id,
          workType: 'administration',
          workDate: '2026-09-10',
          durationMinutes: 60,
          workStatus: 'recorded',
          sourceType: 'manual',
          createdAt: '2026-09-10T08:00:00Z',
          updatedAt: '2026-09-10T08:00:00Z',
          createdBy: actorId,
          updatedBy: actorId,
          status: 'active'
        }
      ];

      vi.spyOn(staffWorkRecordRepository, 'getByStaffAndDateRange').mockResolvedValue(records);
      vi.spyOn(timesheetRepository, 'create').mockImplementation(async (_org, _act, data) => ({
        id: 'ts-new-1',
        ...data,
        organisationId: orgId,
        createdAt: '2026-09-15T08:00:00Z',
        updatedAt: '2026-09-15T08:00:00Z',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      }));

      vi.spyOn(timesheetEntryRepository, 'create').mockImplementation(async (_org, _act, data) => ({
        id: `entry-${data.workRecordId}`,
        ...data,
        organisationId: orgId,
        createdAt: '2026-09-15T08:00:00Z',
        updatedAt: '2026-09-15T08:00:00Z',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      }));

      const res = await timesheetService.createDraftTimesheet(orgId, actorId, {
        staffId: staff1Id,
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30'
      });

      expect(res.timesheet.totalMinutes).toBe(330); // 90 + 180 + 60
      expect(res.entries).toHaveLength(3);

      // Verify breakdown calculation
      const breakdown = timesheetService.calculateHoursBreakdown(res.entries);
      expect(breakdown.teachingMinutes).toBe(90);
      expect(breakdown.eventMinutes).toBe(180);
      expect(breakdown.adminMinutes).toBe(60);
      expect(breakdown.totalMinutes).toBe(330);

      // Duration formatting
      expect(timesheetService.formatDuration(330)).toBe('5h 30m');
      expect(timesheetService.formatDuration(60)).toBe('1h');
      expect(timesheetService.formatDuration(45)).toBe('45m');
    });

    it('submits a draft timesheet and locks it against modifications', async () => {
      const draftTimesheet: Timesheet = {
        id: 'ts-draft',
        organisationId: orgId,
        staffId: staff1Id,
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30',
        timesheetStatus: 'draft',
        totalMinutes: 300,
        totalEntries: 2,
        createdAt: '2026-09-15T08:00:00Z',
        updatedAt: '2026-09-15T08:00:00Z',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      vi.spyOn(timesheetRepository, 'getById').mockResolvedValue(draftTimesheet);
      const updateSpy = vi.spyOn(timesheetRepository, 'updateStatus').mockResolvedValue();

      const submitted = await timesheetService.submitTimesheet(orgId, 'ts-draft', actorId);
      expect(submitted.timesheetStatus).toBe('submitted');
      expect(updateSpy).toHaveBeenCalledWith(orgId, actorId, 'ts-draft', 'submitted', expect.objectContaining({
        submittedBy: actorId
      }));

      // Submission lock: attempt to toggle entry on submitted timesheet should fail
      const submittedTimesheet = { ...draftTimesheet, timesheetStatus: 'submitted' as const };
      vi.spyOn(timesheetRepository, 'getById').mockResolvedValue(submittedTimesheet);

      await expect(
        timesheetService.toggleEntryIncluded(orgId, 'ts-draft', 'entry-1', false, actorId)
      ).rejects.toThrow(/draft status/);
    });
  });

  describe('5. Verification & Separate Approval (Self-Approval Protection)', () => {
    it('verifies a submitted timesheet and marks included entries verified', async () => {
      const submittedTimesheet: Timesheet = {
        id: 'ts-sub',
        organisationId: orgId,
        staffId: staff1Id,
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30',
        timesheetStatus: 'submitted',
        totalMinutes: 120,
        totalEntries: 1,
        submittedBy: staff1Id,
        createdAt: '2026-09-15T08:00:00Z',
        updatedAt: '2026-09-15T08:00:00Z',
        createdBy: staff1Id,
        updatedBy: staff1Id,
        status: 'active'
      };

      const entry: TimesheetEntry = {
        id: 'entry-1',
        organisationId: orgId,
        timesheetId: 'ts-sub',
        staffId: staff1Id,
        workRecordId: 'work-1',
        workDate: '2026-09-10',
        workType: 'teaching',
        durationMinutes: 120,
        entryStatus: 'included',
        createdAt: '2026-09-15T08:00:00Z',
        updatedAt: '2026-09-15T08:00:00Z',
        createdBy: staff1Id,
        updatedBy: staff1Id,
        status: 'active'
      };

      vi.spyOn(timesheetRepository, 'getById').mockResolvedValue(submittedTimesheet);
      vi.spyOn(timesheetEntryRepository, 'getByTimesheetId').mockResolvedValue([entry]);
      const entryStatusSpy = vi.spyOn(timesheetEntryRepository, 'updateStatus').mockResolvedValue();
      const workStatusSpy = vi.spyOn(staffWorkRecordRepository, 'updateStatus').mockResolvedValue();
      const tsStatusSpy = vi.spyOn(timesheetRepository, 'updateStatus').mockResolvedValue();

      const verifierId = 'verifier-supervisor-4';
      const verified = await timesheetVerificationService.verifyTimesheet(orgId, 'ts-sub', verifierId);

      expect(verified.timesheetStatus).toBe('verified');
      expect(entryStatusSpy).toHaveBeenCalledWith(orgId, verifierId, 'entry-1', 'verified');
      expect(workStatusSpy).toHaveBeenCalledWith(orgId, verifierId, 'work-1', 'verified', expect.anything());
      expect(tsStatusSpy).toHaveBeenCalledWith(orgId, verifierId, 'ts-sub', 'verified', expect.anything());
    });

    it('enforces SELF-APPROVAL PROTECTION: fails when submittedBy === actorId', async () => {
      const verifiedTimesheet: Timesheet = {
        id: 'ts-ver',
        organisationId: orgId,
        staffId: staff1Id,
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30',
        timesheetStatus: 'verified',
        totalMinutes: 120,
        totalEntries: 1,
        submittedBy: actorId, // Submitted by current actor
        createdAt: '2026-09-15T08:00:00Z',
        updatedAt: '2026-09-15T08:00:00Z',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      vi.spyOn(timesheetRepository, 'getById').mockResolvedValue(verifiedTimesheet);

      // Current actor tries to approve their own timesheet
      await expect(
        timesheetVerificationService.approveTimesheet(orgId, 'ts-ver', actorId)
      ).rejects.toThrow(/Self-approval not permitted/);
    });

    it('successfully approves verified timesheet when approved by an independent verifier', async () => {
      const verifiedTimesheet: Timesheet = {
        id: 'ts-ver',
        organisationId: orgId,
        staffId: staff1Id,
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30',
        timesheetStatus: 'verified',
        totalMinutes: 120,
        totalEntries: 1,
        submittedBy: staff1Id, // Submitted by Alice
        createdAt: '2026-09-15T08:00:00Z',
        updatedAt: '2026-09-15T08:00:00Z',
        createdBy: staff1Id,
        updatedBy: staff1Id,
        status: 'active'
      };

      vi.spyOn(timesheetRepository, 'getById').mockResolvedValue(verifiedTimesheet);
      const approveSpy = vi.spyOn(timesheetRepository, 'updateStatus').mockResolvedValue();

      const directorId = 'director-independent-9';
      const approved = await timesheetVerificationService.approveTimesheet(orgId, 'ts-ver', directorId);

      expect(approved.timesheetStatus).toBe('approved');
      expect(approveSpy).toHaveBeenCalledWith(orgId, directorId, 'ts-ver', 'approved', expect.objectContaining({
        approvedBy: directorId
      }));
    });
  });

  describe('6. Staff Substitution Workflow', () => {
    it('requests substitution and warns if proposed substitute is unavailable', async () => {
      const mockSession: Session = {
        id: 'sess-300',
        organisationId: orgId,
        groupId: 'grp-1',
        sessionType: 'rehearsal',
        date: '2026-09-20',
        startTime: '10:00',
        endTime: '11:00',
        teacherIds: [staff1Id],
        sessionStatus: 'scheduled',
        createdAt: '2026-09-01T08:00:00Z',
        updatedAt: '2026-09-01T08:00:00Z',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      vi.spyOn(sessionRepository, 'getById').mockResolvedValue(mockSession);
      vi.spyOn(staffAvailabilityService, 'checkAvailabilityStatus').mockResolvedValue({
        status: 'unavailable',
        reason: 'Out of town conference'
      });

      const createSpy = vi.spyOn(staffSubstitutionRepository, 'create').mockResolvedValue({
        id: 'sub-new-1',
        sessionId: 'sess-300',
        originalStaffId: staff1Id,
        substituteStaffId: staff2Id,
        substitutionStatus: 'requested'
      } as unknown as StaffSubstitution);

      const res = await staffSubstitutionService.requestSubstitution(orgId, actorId, {
        sessionId: 'sess-300',
        originalStaffId: staff1Id,
        substituteStaffId: staff2Id,
        reason: 'Medical appointment'
      });

      expect(res.substitution.id).toBe('sub-new-1');
      expect(res.availabilityWarning).toContain('Substitute is marked as unavailable');
      expect(createSpy).toHaveBeenCalled();
    });

    it('confirms substitution, updates session teacher, and sends notifications', async () => {
      const mockSub: StaffSubstitution = {
        id: 'sub-req',
        organisationId: orgId,
        sessionId: 'sess-300',
        originalStaffId: staff1Id,
        substituteStaffId: staff2Id,
        reason: 'Medical',
        substitutionStatus: 'requested',
        requestedAt: '2026-09-01T08:00:00Z',
        createdAt: '2026-09-01T08:00:00Z',
        updatedAt: '2026-09-01T08:00:00Z',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      const mockSession: Session = {
        id: 'sess-300',
        organisationId: orgId,
        groupId: 'grp-1',
        sessionType: 'rehearsal',
        date: '2026-09-20',
        startTime: '10:00',
        endTime: '11:00',
        teacherIds: [staff1Id],
        sessionStatus: 'scheduled',
        createdAt: '2026-09-01T08:00:00Z',
        updatedAt: '2026-09-01T08:00:00Z',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      vi.spyOn(staffSubstitutionRepository, 'getById').mockResolvedValue(mockSub);
      vi.spyOn(sessionRepository, 'getById').mockResolvedValue(mockSession);
      const subUpdateSpy = vi.spyOn(staffSubstitutionRepository, 'updateStatus').mockResolvedValue();
      const sessionUpdateSpy = vi.spyOn(sessionRepository, 'update').mockResolvedValue();
      const notifSpy = vi.spyOn(notificationService, 'createNotification').mockResolvedValue({} as unknown as AppNotification);

      const confirmed = await staffSubstitutionService.confirmSubstitution(orgId, 'sub-req', actorId);

      expect(confirmed.substitutionStatus).toBe('confirmed');
      expect(subUpdateSpy).toHaveBeenCalledWith(orgId, actorId, 'sub-req', 'confirmed', expect.anything());
      // Session teacher updated to Bob (staff2Id)
      expect(sessionUpdateSpy).toHaveBeenCalledWith(orgId, actorId, 'sess-300', {
        teacherIds: [staff2Id]
      });
      // In-app notifications dispatched
      expect(notifSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('7. Workload & Capacity Analytics', () => {
    it('computes transparent operational flags correctly', async () => {
      // Bob has 2500 minutes of work (> 40 hours) -> high workload flag
      const bobRecords: StaffWorkRecord[] = [
        {
          id: 'w-bob-1',
          organisationId: orgId,
          staffId: staff2Id,
          workType: 'teaching',
          workDate: '2026-09-10',
          durationMinutes: 2500,
          workStatus: 'recorded',
          sourceType: 'session',
          createdAt: '2026-09-10T08:00:00Z',
          updatedAt: '2026-09-10T08:00:00Z',
          createdBy: actorId,
          updatedBy: actorId,
          status: 'active'
        }
      ];

      vi.spyOn(staffAssignmentRepository, 'getByOrganisation').mockResolvedValue([]);
      vi.spyOn(sessionRepository, 'getByOrganisation').mockResolvedValue([]);
      vi.spyOn(staffWorkRecordRepository, 'getByOrganisation').mockResolvedValue(bobRecords);
      vi.spyOn(timesheetRepository, 'getByOrganisation').mockResolvedValue([]);
      vi.spyOn(staffSubstitutionRepository, 'getByOrganisation').mockResolvedValue([]);

      const summaries = await staffWorkloadService.getStaffWorkloadSummaries(
        orgId,
        '2026-09-01',
        '2026-09-30'
      );

      const bobSummary = summaries.find(s => s.staffId === staff2Id);
      expect(bobSummary).toBeDefined();
      expect(bobSummary?.totalWorkMinutes).toBe(2500);
      expect(bobSummary?.flags.highWorkload).toBe(true);

      const aliceSummary = summaries.find(s => s.staffId === staff1Id);
      expect(aliceSummary).toBeDefined();
      expect(aliceSummary?.flags.noActiveAssignment).toBe(true);
    });

    it('identifies unassigned groups in group staff coverage', async () => {
      const mockGroups: ProgrammeGroup[] = [
        {
          id: 'grp-unassigned',
          organisationId: orgId,
          programmeId: 'prog-1',
          name: 'Junior Choir',
          groupType: 'choir',
          groupStatus: 'active',
          createdAt: '2026-09-01T08:00:00Z',
          updatedAt: '2026-09-01T08:00:00Z',
          createdBy: actorId,
          updatedBy: actorId,
          status: 'active'
        }
      ];

      vi.spyOn(programmeGroupRepository, 'getByOrganisation').mockResolvedValue(mockGroups);
      vi.spyOn(staffAssignmentRepository, 'getByOrganisation').mockResolvedValue([]);
      vi.spyOn(sessionRepository, 'getByOrganisation').mockResolvedValue([]);

      const coverage = await staffWorkloadService.getGroupStaffCoverage(orgId);
      expect(coverage).toHaveLength(1);
      expect(coverage[0].coverageStatus).toBe('unassigned');
    });
  });
});
