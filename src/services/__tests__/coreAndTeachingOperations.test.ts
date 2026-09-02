import { describe, it, expect, vi, beforeEach } from 'vitest';
import { learnerGuardianService } from '../learnerGuardianService';
import { enrolmentService } from '../enrolmentService';
import { attendanceService } from '../attendanceService';
import { followUpService } from '../followUpService';
import { instrumentAllocationService } from '../instrumentAllocationService';
import { costumeAllocationService } from '../costumeAllocationService';
import { eventService } from '../eventService';
import { eventParticipantService } from '../eventParticipantService';

import { learnerGuardianRepository } from '../../repositories/learnerGuardianRepository';
import { learnerRepository } from '../../repositories/learnerRepository';
import { programmeGroupRepository } from '../../repositories/programmeGroupRepository';
import { enrolmentRepository } from '../../repositories/enrolmentRepository';
import { attendanceRepository } from '../../repositories/attendanceRepository';
import { followUpRepository } from '../../repositories/followUpRepository';
import { instrumentRepository } from '../../repositories/instrumentRepository';
import { instrumentAllocationRepository } from '../../repositories/instrumentAllocationRepository';
import { costumeRepository } from '../../repositories/costumeRepository';
import { costumeAllocationRepository } from '../../repositories/costumeAllocationRepository';
import { eventRepository } from '../../repositories/eventRepository';
import { eventParticipantRepository } from '../../repositories/eventParticipantRepository';
import { auditService } from '../auditService';

import type {
  LearnerGuardian,
  Enrolment,
  Attendance,
  FollowUp,
  InstrumentAllocation,
  CostumeAllocation,
  Event,
  EventParticipant,
  Learner,
  ProgrammeGroup,
  Instrument,
  Costume
} from '../../types';

describe('Core & Teaching Operations Test Suite (Phases 1A, 1B, 2A, 2B, 3A)', () => {
  const orgId = 'org-arts-100';
  const actorId = 'user-admin-100';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(auditService, 'log').mockResolvedValue();
  });

  // ─── 1. Phase 1A: Learner & Guardian Linking ──────────────────────
  describe('Phase 1A: Learner-Guardian Linking', () => {
    it('successfully links a guardian to a learner', async () => {
      vi.spyOn(learnerGuardianRepository, 'getGuardiansForLearner').mockResolvedValue([]);
      const mockLink: LearnerGuardian = {
        id: 'link-1',
        organisationId: orgId,
        learnerId: 'learner-1',
        guardianId: 'guardian-1',
        relationshipType: 'parent',
        primaryContact: true,
        emergencyContact: true,
        receivesCommunication: true,
        financialContact: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };
      vi.spyOn(learnerGuardianRepository, 'create').mockResolvedValue(mockLink);

      const res = await learnerGuardianService.linkGuardian(orgId, actorId, {
        learnerId: 'learner-1',
        guardianId: 'guardian-1',
        relationshipType: 'parent',
        primaryContact: true,
        emergencyContact: true,
        receivesCommunication: true,
        financialContact: true
      });

      expect(res.id).toBe('link-1');
      expect(auditService.log).toHaveBeenCalledWith(
        orgId,
        actorId,
        'LINK',
        'learnerGuardian',
        'link-1',
        undefined,
        mockLink
      );
    });

    it('rejects duplicate links for the same guardian and learner', async () => {
      vi.spyOn(learnerGuardianRepository, 'getGuardiansForLearner').mockResolvedValue([
        {
          id: 'link-existing',
          organisationId: orgId,
          learnerId: 'learner-1',
          guardianId: 'guardian-1',
          relationshipType: 'parent',
          primaryContact: true,
          emergencyContact: true,
          receivesCommunication: true,
          financialContact: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: actorId,
          updatedBy: actorId,
          status: 'active'
        }
      ]);

      await expect(
        learnerGuardianService.linkGuardian(orgId, actorId, {
          learnerId: 'learner-1',
          guardianId: 'guardian-1',
          relationshipType: 'parent',
          primaryContact: true,
          emergencyContact: true,
          receivesCommunication: true,
          financialContact: true
        })
      ).rejects.toThrow('Guardian is already linked to this learner');
    });

    it('unlinks a guardian via soft delete and audits the action', async () => {
      const mockLink: LearnerGuardian = {
        id: 'link-1',
        organisationId: orgId,
        learnerId: 'learner-1',
        guardianId: 'guardian-1',
        relationshipType: 'parent',
        primaryContact: true,
        emergencyContact: true,
        receivesCommunication: true,
        financialContact: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };
      vi.spyOn(learnerGuardianRepository, 'getById').mockResolvedValue(mockLink);
      vi.spyOn(learnerGuardianRepository, 'softDelete').mockResolvedValue();

      await learnerGuardianService.unlinkGuardian(orgId, actorId, 'link-1');

      expect(learnerGuardianRepository.softDelete).toHaveBeenCalledWith(orgId, actorId, 'link-1');
      expect(auditService.log).toHaveBeenCalledWith(
        orgId,
        actorId,
        'UNLINK',
        'learnerGuardian',
        'link-1',
        mockLink,
        expect.objectContaining({ status: 'deleted' })
      );
    });
  });

  // ─── 2. Phase 1B: Teaching Operations (Enrolments & Attendance) ───
  describe('Phase 1B: Enrolments & Attendance', () => {
    it('creates an active enrolment when learner and group exist without duplicate', async () => {
      const mockLearner = { id: 'learner-1', organisationId: orgId } as Learner;
      const mockGroup = { id: 'group-1', organisationId: orgId, programmeId: 'prog-1' } as ProgrammeGroup;
      vi.spyOn(learnerRepository, 'getById').mockResolvedValue(mockLearner);
      vi.spyOn(programmeGroupRepository, 'getById').mockResolvedValue(mockGroup);
      vi.spyOn(enrolmentRepository, 'getActiveDuplicate').mockResolvedValue(null);

      const mockEnrolment: Enrolment = {
        id: 'enrol-1',
        organisationId: orgId,
        learnerId: 'learner-1',
        groupId: 'group-1',
        programmeId: 'prog-1',
        startDate: '2026-09-01',
        enrolmentStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };
      vi.spyOn(enrolmentRepository, 'create').mockResolvedValue(mockEnrolment);

      const res = await enrolmentService.createEnrolment(orgId, actorId, {
        learnerId: 'learner-1',
        groupId: 'group-1',
        startDate: '2026-09-01'
      });

      expect(res.id).toBe('enrol-1');
      expect(res.programmeId).toBe('prog-1');
      expect(auditService.log).toHaveBeenCalledWith(
        orgId,
        actorId,
        'CREATE',
        'enrolment',
        'enrol-1',
        undefined,
        mockEnrolment
      );
    });

    it('rejects duplicate active enrolments in the same group', async () => {
      const mockLearner = { id: 'learner-1', organisationId: orgId } as Learner;
      const mockGroup = { id: 'group-1', organisationId: orgId, programmeId: 'prog-1' } as ProgrammeGroup;
      vi.spyOn(learnerRepository, 'getById').mockResolvedValue(mockLearner);
      vi.spyOn(programmeGroupRepository, 'getById').mockResolvedValue(mockGroup);
      vi.spyOn(enrolmentRepository, 'getActiveDuplicate').mockResolvedValue({ id: 'existing-enrol' } as Enrolment);

      await expect(
        enrolmentService.createEnrolment(orgId, actorId, {
          learnerId: 'learner-1',
          groupId: 'group-1',
          startDate: '2026-09-01'
        })
      ).rejects.toThrow('Learner is already actively enrolled in this group');
    });

    it('records attendance and prevents duplicate submission for same session and learner', async () => {
      vi.spyOn(attendanceRepository, 'getDuplicate').mockResolvedValue(null);
      const mockAtt: Attendance = {
        id: 'att-1',
        organisationId: orgId,
        sessionId: 'session-1',
        learnerId: 'learner-1',
        attendanceStatus: 'present',
        markedBy: actorId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };
      vi.spyOn(attendanceRepository, 'create').mockResolvedValue(mockAtt);

      const res = await attendanceService.markAttendance(orgId, actorId, {
        sessionId: 'session-1',
        learnerId: 'learner-1',
        attendanceStatus: 'present'
      });

      expect(res.id).toBe('att-1');
      expect(res.attendanceStatus).toBe('present');

      // Attempting second time throws duplicate error
      vi.spyOn(attendanceRepository, 'getDuplicate').mockResolvedValue(mockAtt);
      await expect(
        attendanceService.markAttendance(orgId, actorId, {
          sessionId: 'session-1',
          learnerId: 'learner-1',
          attendanceStatus: 'present'
        })
      ).rejects.toThrow('Attendance already recorded for this learner in this session');
    });

    it('bulk marks attendance updating existing and creating new records', async () => {
      const existingAtt: Attendance = {
        id: 'att-existing',
        organisationId: orgId,
        sessionId: 'session-1',
        learnerId: 'learner-1',
        attendanceStatus: 'absent',
        markedBy: actorId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };
      vi.spyOn(attendanceRepository, 'getDuplicate')
        .mockResolvedValueOnce(existingAtt)
        .mockResolvedValueOnce(null);

      vi.spyOn(attendanceRepository, 'update').mockResolvedValue();
      const newAtt: Attendance = {
        id: 'att-new',
        organisationId: orgId,
        sessionId: 'session-1',
        learnerId: 'learner-2',
        attendanceStatus: 'present',
        markedBy: actorId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };
      vi.spyOn(attendanceRepository, 'create').mockResolvedValue(newAtt);

      const results = await attendanceService.bulkMarkAttendance(orgId, actorId, 'session-1', [
        { learnerId: 'learner-1', attendanceStatus: 'late', arrivalTime: '14:15' },
        { learnerId: 'learner-2', attendanceStatus: 'present' }
      ]);

      expect(results.length).toBe(2);
      expect(attendanceRepository.update).toHaveBeenCalledWith(
        orgId,
        actorId,
        'att-existing',
        expect.objectContaining({ attendanceStatus: 'late', arrivalTime: '14:15' })
      );
      expect(attendanceRepository.create).toHaveBeenCalledWith(
        orgId,
        actorId,
        expect.objectContaining({ learnerId: 'learner-2', attendanceStatus: 'present' })
      );
    });

    it('creates follow-up tasks and supports status transitions', async () => {
      const mockFollowUp: FollowUp = {
        id: 'fu-10',
        organisationId: orgId,
        subject: 'Call guardian regarding attendance',
        description: 'Learner was absent 2 days in a row',
        category: 'attendance',
        priority: 'high',
        followUpStatus: 'open',
        dueDate: '2026-09-10',
        ownerId: 'staff-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };
      vi.spyOn(followUpRepository, 'create').mockResolvedValue(mockFollowUp);
      vi.spyOn(followUpRepository, 'getById').mockResolvedValue(mockFollowUp);
      vi.spyOn(followUpRepository, 'update').mockResolvedValue();

      const created = await followUpService.createFollowUp(orgId, actorId, {
        subject: 'Call guardian regarding attendance',
        description: 'Learner was absent 2 days in a row',
        category: 'attendance',
        priority: 'high',
        dueDate: '2026-09-10',
        ownerId: 'staff-1'
      });

      expect(created.id).toBe('fu-10');
      expect(created.followUpStatus).toBe('open');

      await followUpService.updateFollowUp(orgId, actorId, 'fu-10', { followUpStatus: 'completed' });
      expect(followUpRepository.update).toHaveBeenCalledWith(
        orgId,
        actorId,
        'fu-10',
        expect.objectContaining({ followUpStatus: 'completed' })
      );
    });
  });

  // ─── 3. Phase 2A & 2B: Music and Dance Operations ──────────────────
  describe('Phase 2A & 2B: Instrument & Costume Asset Allocation', () => {
    it('allocates an instrument and transitions instrument status to allocated', async () => {
      const mockInst: Instrument = {
        id: 'inst-1',
        organisationId: orgId,
        assetNumber: 'INST-001',
        instrumentType: 'Violin',
        serialNumber: 'VN-101',
        ownershipType: 'organisation_owned',
        instrumentStatus: 'available',
        condition: 'good',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };
      vi.spyOn(instrumentRepository, 'getById').mockResolvedValue(mockInst);
      vi.spyOn(learnerRepository, 'getById').mockResolvedValue({ id: 'learner-1', organisationId: orgId } as Learner);
      vi.spyOn(instrumentAllocationRepository, 'getActiveByInstrumentId').mockResolvedValue(null);

      const mockAlloc: InstrumentAllocation = {
        id: 'alloc-1',
        organisationId: orgId,
        instrumentId: 'inst-1',
        learnerId: 'learner-1',
        allocatedDate: '2026-09-01',
        conditionOut: 'good',
        allocationStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };
      vi.spyOn(instrumentAllocationRepository, 'create').mockResolvedValue(mockAlloc);
      vi.spyOn(instrumentRepository, 'update').mockResolvedValue();

      const alloc = await instrumentAllocationService.allocateInstrument(
        orgId,
        actorId,
        'inst-1',
        'learner-1',
        'good',
        '2026-09-01'
      );

      expect(alloc.id).toBe('alloc-1');
      expect(instrumentRepository.update).toHaveBeenCalledWith(orgId, actorId, 'inst-1', {
        instrumentStatus: 'allocated'
      });
    });

    it('returns an allocated instrument and sets status to maintenance if repairs needed', async () => {
      const mockAlloc: InstrumentAllocation = {
        id: 'alloc-1',
        organisationId: orgId,
        instrumentId: 'inst-1',
        learnerId: 'learner-1',
        allocatedDate: '2026-09-01',
        conditionOut: 'good',
        allocationStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };
      vi.spyOn(instrumentAllocationRepository, 'getById').mockResolvedValue(mockAlloc);
      vi.spyOn(instrumentRepository, 'getById').mockResolvedValue({
        id: 'inst-1',
        organisationId: orgId,
        assetNumber: 'INST-001',
        instrumentType: 'Violin',
        ownershipType: 'organisation_owned',
        condition: 'good',
        instrumentStatus: 'allocated'
      } as Instrument);
      vi.spyOn(instrumentAllocationRepository, 'update').mockResolvedValue();
      vi.spyOn(instrumentRepository, 'update').mockResolvedValue();

      await instrumentAllocationService.returnInstrument(
        orgId,
        actorId,
        'alloc-1',
        '2026-09-15',
        'fair',
        true, // needsRepair = true
        'Bow needs rehairing'
      );

      expect(instrumentRepository.update).toHaveBeenCalledWith(orgId, actorId, 'inst-1', {
        instrumentStatus: 'repair',
        condition: 'fair'
      });
      expect(instrumentAllocationRepository.update).toHaveBeenCalledWith(
        orgId,
        actorId,
        'alloc-1',
        expect.objectContaining({
          allocationStatus: 'returned',
          conditionReturned: 'fair',
          returnedDate: '2026-09-15'
        })
      );
    });

    it('allocates and returns dance costumes updating inventory status', async () => {
      const mockCostume: Costume = {
        id: 'costume-1',
        organisationId: orgId,
        assetNumber: 'SL-01',
        costumeType: 'Swan Lake Tutu',
        costumeStatus: 'available',
        condition: 'good',
        quantity: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };
      vi.spyOn(costumeRepository, 'getById').mockResolvedValue(mockCostume);
      vi.spyOn(learnerRepository, 'getById').mockResolvedValue({ id: 'learner-1', organisationId: orgId } as Learner);
      vi.spyOn(costumeAllocationRepository, 'getByOrganisation').mockResolvedValue([]);

      const mockAlloc: CostumeAllocation = {
        id: 'costume-alloc-1',
        organisationId: orgId,
        costumeId: 'costume-1',
        learnerId: 'learner-1',
        allocatedDate: '2026-09-01',
        conditionOut: 'good',
        allocationStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };
      vi.spyOn(costumeAllocationRepository, 'create').mockResolvedValue(mockAlloc);
      vi.spyOn(costumeRepository, 'update').mockResolvedValue();

      const alloc = await costumeAllocationService.allocateCostume(
        orgId,
        actorId,
        'costume-1',
        'learner-1',
        'good'
      );

      expect(alloc.id).toBe('costume-alloc-1');
      expect(costumeRepository.update).toHaveBeenCalledWith(orgId, actorId, 'costume-1', {
        costumeStatus: 'allocated'
      });
    });
  });

  // ─── 4. Phase 3A: Events & Performance Operations ──────────────────
  describe('Phase 3A: Events & Event Participants', () => {
    it('creates an event with organization scoping', async () => {
      const mockEvent: Event = {
        id: 'event-1',
        organisationId: orgId,
        name: 'Spring Concert 2026',
        eventType: 'concert',
        eventStatus: 'draft',
        startDate: '2026-10-15T18:00:00Z',
        endDate: '2026-10-15T21:00:00Z',
        venue: 'City Hall',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };
      vi.spyOn(eventRepository, 'create').mockResolvedValue(mockEvent);

      const created = await eventService.createEvent(
        orgId,
        {
          name: 'Spring Concert 2026',
          eventType: 'concert',
          eventStatus: 'draft',
          startDate: '2026-10-15T18:00:00Z',
          endDate: '2026-10-15T21:00:00Z',
          venue: 'City Hall'
        },
        actorId
      );

      expect(created.id).toBe('event-1');
      expect(created.eventStatus).toBe('draft');
      expect(auditService.log).toHaveBeenCalledWith(
        orgId,
        actorId,
        'CREATE_EVENT',
        'events',
        'event-1',
        undefined,
        mockEvent
      );
    });

    it('adds an event participant and prevents duplicates', async () => {
      const mockParticipant: EventParticipant = {
        id: 'ep-1',
        organisationId: orgId,
        eventId: 'event-1',
        learnerId: 'learner-1',
        participationStatus: 'planned',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };
      vi.spyOn(eventRepository, 'getById').mockResolvedValue({ id: 'event-1', organisationId: orgId } as Event);
      vi.spyOn(learnerRepository, 'getById').mockResolvedValue({ id: 'learner-1', organisationId: orgId } as Learner);
      vi.spyOn(eventParticipantRepository, 'getByOrganisation').mockResolvedValue([]);
      vi.spyOn(eventParticipantRepository, 'create').mockResolvedValue(mockParticipant);

      const res = await eventParticipantService.addEventParticipant(
        orgId,
        {
          eventId: 'event-1',
          learnerId: 'learner-1',
          participationStatus: 'planned'
        },
        actorId
      );

      expect(res.id).toBe('ep-1');
      expect(res.participationStatus).toBe('planned');

      // Duplicate check
      vi.spyOn(eventParticipantRepository, 'getByOrganisation').mockResolvedValue([mockParticipant]);
      await expect(
        eventParticipantService.addEventParticipant(
          orgId,
          {
            eventId: 'event-1',
            learnerId: 'learner-1',
            participationStatus: 'planned'
          },
          actorId
        )
      ).rejects.toThrow('Learner is already a participant in this event');
    });
  });
});
