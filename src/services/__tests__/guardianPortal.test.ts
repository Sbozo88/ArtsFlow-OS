import { describe, it, expect, vi, beforeEach } from 'vitest';
import { guardianAccessService } from '../guardianAccessService';
import { guardianInvitationService } from '../guardianInvitationService';
import { guardianPortalService } from '../guardianPortalService';
import { guardianPortalAccessRepository } from '../../repositories/guardianPortalAccessRepository';
import { guardianInvitationRepository } from '../../repositories/guardianInvitationRepository';
import { guardianRepository } from '../../repositories/guardianRepository';
import { learnerGuardianRepository } from '../../repositories/learnerGuardianRepository';
import { learnerRepository } from '../../repositories/learnerRepository';
import { organisationRepository } from '../../repositories/organisationRepository';
import { organisationSettingsService } from '../organisationSettingsService';
import { enrolmentRepository } from '../../repositories/enrolmentRepository';
import { programmeRepository } from '../../repositories/programmeRepository';
import { programmeGroupRepository } from '../../repositories/programmeGroupRepository';
import { sessionRepository } from '../../repositories/sessionRepository';
import { attendanceRepository } from '../../repositories/attendanceRepository';
import { eventRepository } from '../../repositories/eventRepository';
import { eventParticipantRepository } from '../../repositories/eventParticipantRepository';
import { consentRequestRepository } from '../../repositories/consentRequestRepository';
import { consentSubmissionService } from '../consentSubmissionService';
import { transportPassengerRepository } from '../../repositories/transportPassengerRepository';
import { eventTransportPlanRepository } from '../../repositories/eventTransportPlanRepository';
import { invoiceRepository } from '../../repositories/invoiceRepository';
import { invoiceLineItemRepository } from '../../repositories/invoiceLineItemRepository';
import { paymentRepository } from '../../repositories/paymentRepository';
import { paymentAllocationRepository } from '../../repositories/paymentAllocationRepository';
import { documentRepository } from '../../repositories/documentRepository';
import { documentLinkRepository } from '../../repositories/documentLinkRepository';
import { communicationRepository } from '../../repositories/communicationRepository';
import { communicationRecipientRepository } from '../../repositories/communicationRecipientRepository';
import { portalChangeRequestRepository } from '../../repositories/portalChangeRequestRepository';
import { auditService } from '../auditService';

vi.mock('../auditService', () => ({
  auditService: {
    log: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('Phase 7A: Guardian Portal & External Access Tests', () => {
  const orgId = 'org-test-123';
  const userId = 'user-guardian-1';
  const guardianId = 'guardian-1';
  const learnerId1 = 'learner-1';
  const unrelatedLearnerId = 'learner-unrelated-999';

  const mockGuardian = {
    id: guardianId,
    organisationId: orgId,
    firstName: 'Zodwa',
    lastName: 'Khumalo',
    email: 'zodwa@example.com',
    mobileNumber: '+27821112233',
    address: '12 Arts Way, Johannesburg',
    status: 'active' as const,
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'admin-1',
    updatedAt: '2026-01-01T00:00:00Z',
    updatedBy: 'admin-1'
  };

  const mockPortalAccess = {
    id: 'access-1',
    organisationId: orgId,
    userId,
    guardianId,
    accessStatus: 'active' as const,
    status: 'active' as const,
    invitedAt: '2026-02-01T00:00:00Z',
    acceptedAt: '2026-02-01T01:00:00Z',
    createdAt: '2026-02-01T00:00:00Z',
    createdBy: 'admin-1',
    updatedAt: '2026-02-01T01:00:00Z',
    updatedBy: userId
  };

  const mockLearner1 = {
    id: learnerId1,
    organisationId: orgId,
    firstName: 'Sipho',
    lastName: 'Khumalo',
    preferredName: 'Sipho',
    dateOfBirth: '2012-05-10',
    status: 'active' as const,
    learnerStatus: 'active' as const,
    notes: 'CONFIDENTIAL TEACHER NOTE',
    medicalNotes: 'CONFIDENTIAL INTERNAL MEDICAL NOTE',
    emergencyInformation: 'SECRET CONTACT',
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'admin-1',
    updatedAt: '2026-01-01T00:00:00Z',
    updatedBy: 'admin-1'
  };

  const mockRelationship1 = {
    id: 'rel-1',
    organisationId: orgId,
    guardianId,
    learnerId: learnerId1,
    relationshipType: 'Mother',
    financialContact: true,
    emergencyContact: true,
    primaryContact: true,
    receivesCommunication: true,
    status: 'active' as const,
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'admin-1',
    updatedAt: '2026-01-01T00:00:00Z',
    updatedBy: 'admin-1'
  };

  const defaultPortalSettings = {
    guardianPortalEnabled: true,
    showAttendance: true,
    showFinance: true,
    showPayments: true,
    showEvents: true,
    showTransport: true,
    showDocuments: true,
    showTeacherNames: true,
    allowContactUpdates: true,
    allowDirectProfileEdit: true,
    financeRequiresFinancialContact: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(organisationSettingsService, 'getSettings').mockResolvedValue({
      profile: { name: 'Arts Academy', timezone: 'Africa/Johannesburg' },
      attendance: { lateCountsAsPresent: true, excusedCountsInDenominator: false },
      finance: { defaultCurrency: 'ZAR', receiptPrefix: 'REC-' },
      portal: defaultPortalSettings
    } as never);
  });

  // =========================================================================
  // 1. Guardian Access Service (Relationship-Based Isolation & Filtering)
  // =========================================================================
  describe('guardianAccessService', () => {
    it('successfully resolves guardian context for active guardian', async () => {
      vi.spyOn(guardianPortalAccessRepository, 'getByUserId').mockResolvedValue(mockPortalAccess);
      vi.spyOn(guardianRepository, 'getById').mockResolvedValue(mockGuardian);
      vi.spyOn(learnerGuardianRepository, 'getLearnersForGuardian').mockResolvedValue([mockRelationship1]);
      vi.spyOn(learnerRepository, 'getById').mockResolvedValue(mockLearner1);

      const ctx = await guardianAccessService.resolveGuardianContext(orgId, userId);

      expect(ctx.guardian.id).toBe(guardianId);
      expect(ctx.portalAccess.accessStatus).toBe('active');
      expect(ctx.linkedLearners).toHaveLength(1);
      // Verify sensitive teacher/medical notes are stripped
      expect((ctx.linkedLearners[0] as unknown as { notes?: string }).notes).toBeUndefined();
      expect((ctx.linkedLearners[0] as unknown as { medicalNotes?: string }).medicalNotes).toBeUndefined();
    });

    it('rejects access if guardian portal record is not found', async () => {
      vi.spyOn(guardianPortalAccessRepository, 'getByUserId').mockResolvedValue(null);

      await expect(guardianAccessService.resolveGuardianContext(orgId, 'unknown-user'))
        .rejects.toThrow(/ACCESS_NOT_FOUND/);
    });

    it('rejects access immediately if portal access is revoked', async () => {
      vi.spyOn(guardianPortalAccessRepository, 'getByUserId').mockResolvedValue({
        ...mockPortalAccess,
        accessStatus: 'revoked'
      });

      await expect(guardianAccessService.resolveGuardianContext(orgId, userId))
        .rejects.toThrow(/ACCESS_REVOKED/);
    });

    it('rejects access if guardian portal access is disabled', async () => {
      vi.spyOn(guardianPortalAccessRepository, 'getByUserId').mockResolvedValue({
        ...mockPortalAccess,
        accessStatus: 'disabled'
      });

      await expect(guardianAccessService.resolveGuardianContext(orgId, userId))
        .rejects.toThrow(/ACCESS_DISABLED/);
    });

    it('blocks access if organisation master portal toggle is disabled', async () => {
      vi.spyOn(guardianPortalAccessRepository, 'getByUserId').mockResolvedValue(mockPortalAccess);
      vi.spyOn(guardianRepository, 'getById').mockResolvedValue(mockGuardian);
      vi.spyOn(organisationSettingsService, 'getSettings').mockResolvedValue({
        portal: { ...defaultPortalSettings, guardianPortalEnabled: false }
      } as never);

      await expect(guardianAccessService.resolveGuardianContext(orgId, userId))
        .rejects.toThrow(/PORTAL_DISABLED/);
    });

    it('allows access to linked learner and denies access to unrelated learner', async () => {
      vi.spyOn(learnerGuardianRepository, 'getLearnersForGuardian').mockResolvedValue([mockRelationship1]);
      vi.spyOn(learnerRepository, 'getById').mockImplementation(async (_org, lid) => {
        if (lid === learnerId1) return mockLearner1;
        return null;
      });

      // Permitted
      const access = await guardianAccessService.assertLearnerAccess(orgId, guardianId, learnerId1);
      expect(access.learner.id).toBe(learnerId1);

      // Denied for unrelated learner
      await expect(guardianAccessService.assertLearnerAccess(orgId, guardianId, unrelatedLearnerId))
        .rejects.toThrow(/FORBIDDEN_LEARNER/);
    });

    it('enforces financialContact rule when financeRequiresFinancialContact is enabled', async () => {
      const nonFinancialRel = { ...mockRelationship1, financialContact: false };
      vi.spyOn(learnerGuardianRepository, 'getLearnersForGuardian').mockResolvedValue([nonFinancialRel]);
      vi.spyOn(learnerRepository, 'getById').mockResolvedValue(mockLearner1);

      await expect(guardianAccessService.assertFinancialAccess(orgId, guardianId, learnerId1))
        .rejects.toThrow(/FINANCIAL_CONTACT_REQUIRED/);
    });
  });

  // =========================================================================
  // 2. Guardian Invitation Service (Token Lifecycle & Security)
  // =========================================================================
  describe('guardianInvitationService', () => {
    it('creates secure invitation and revokes previous pending invitations', async () => {
      vi.spyOn(guardianRepository, 'getById').mockResolvedValue(mockGuardian);
      vi.spyOn(guardianInvitationRepository, 'getByGuardianId').mockResolvedValue([
        { id: 'inv-old', invitationStatus: 'pending' } as never
      ]);
      const updateStatusSpy = vi.spyOn(guardianInvitationRepository, 'updateStatus').mockResolvedValue();
      const createInviteSpy = vi.spyOn(guardianInvitationRepository, 'create').mockResolvedValue({
        id: 'inv-new',
        organisationId: orgId,
        token: 'g_testtoken123',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        invitationStatus: 'pending'
      } as never);
      vi.spyOn(guardianPortalAccessRepository, 'getByGuardianId').mockResolvedValue(null);
      vi.spyOn(guardianPortalAccessRepository, 'create').mockResolvedValue({
        id: 'access-new',
        accessStatus: 'invited'
      } as never);

      const res = await guardianInvitationService.inviteGuardian(orgId, guardianId, 'admin-1');

      expect(updateStatusSpy).toHaveBeenCalledWith(orgId, 'admin-1', 'inv-old', 'revoked');
      expect(createInviteSpy).toHaveBeenCalled();
      expect(res.invitationLink).toContain('/portal/invite/');
      expect(auditService.log).toHaveBeenCalledWith(
        orgId,
        'admin-1',
        'INVITE_GUARDIAN_PORTAL',
        'guardianInvitations',
        'inv-new',
        null,
        expect.any(Object)
      );
    });

    it('rejects invitation creation if guardian has no email address', async () => {
      vi.spyOn(guardianRepository, 'getById').mockResolvedValue({
        ...mockGuardian,
        email: ''
      });

      await expect(guardianInvitationService.inviteGuardian(orgId, guardianId, 'admin-1'))
        .rejects.toThrow(/valid email/);
    });

    it('validates a valid invitation token', async () => {
      const futureDate = new Date(Date.now() + 500000).toISOString();
      vi.spyOn(guardianInvitationRepository, 'getByToken').mockResolvedValue({
        id: 'inv-1',
        organisationId: orgId,
        guardianId,
        email: 'zodwa@example.com',
        expiresAt: futureDate,
        invitationStatus: 'pending'
      } as never);
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue({ name: 'Arts Academy' } as never);
      vi.spyOn(guardianRepository, 'getById').mockResolvedValue(mockGuardian);

      const val = await guardianInvitationService.validateInvitationToken('valid_token');
      expect(val.valid).toBe(true);
      expect(val.organisationName).toBe('Arts Academy');
      expect(val.guardianName).toContain('Zodwa Khumalo');
    });

    it('rejects expired invitation tokens', async () => {
      const pastDate = new Date(Date.now() - 500000).toISOString();
      vi.spyOn(guardianInvitationRepository, 'getByToken').mockResolvedValue({
        id: 'inv-1',
        organisationId: orgId,
        guardianId,
        expiresAt: pastDate,
        invitationStatus: 'pending'
      } as never);

      const val = await guardianInvitationService.validateInvitationToken('expired_token');
      expect(val.valid).toBe(false);
      expect(val.error).toContain('expired');
    });

    it('accepts invitation, transitions portal access to active, and audits', async () => {
      const futureDate = new Date(Date.now() + 500000).toISOString();
      vi.spyOn(guardianInvitationRepository, 'getByToken').mockResolvedValue({
        id: 'inv-1',
        organisationId: orgId,
        guardianId,
        email: 'zodwa@example.com',
        expiresAt: futureDate,
        invitationStatus: 'pending'
      } as never);
      vi.spyOn(organisationRepository, 'getById').mockResolvedValue({ name: 'Arts Academy' } as never);
      vi.spyOn(guardianRepository, 'getById').mockResolvedValue(mockGuardian);
      vi.spyOn(guardianInvitationRepository, 'updateStatus').mockResolvedValue();
      vi.spyOn(guardianPortalAccessRepository, 'getByGuardianId').mockResolvedValue(mockPortalAccess);
      vi.spyOn(guardianPortalAccessRepository, 'updateAccessStatus').mockResolvedValue();
      vi.spyOn(guardianPortalAccessRepository, 'getById').mockResolvedValue({
        ...mockPortalAccess,
        accessStatus: 'active'
      });

      const access = await guardianInvitationService.acceptInvitation('valid_token', 'user-new-123');

      expect(access.accessStatus).toBe('active');
      expect(guardianInvitationRepository.updateStatus).toHaveBeenCalledWith(
        orgId,
        'user-new-123',
        'inv-1',
        'accepted',
        expect.any(Object)
      );
      expect(auditService.log).toHaveBeenCalledWith(
        orgId,
        'user-new-123',
        'ACTIVATE_GUARDIAN_PORTAL',
        'guardianPortalAccess',
        mockPortalAccess.id,
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('revokes portal access and audits', async () => {
      vi.spyOn(guardianPortalAccessRepository, 'getByGuardianId').mockResolvedValue(mockPortalAccess);
      vi.spyOn(guardianPortalAccessRepository, 'updateAccessStatus').mockResolvedValue();

      await guardianInvitationService.revokePortalAccess(orgId, guardianId, 'admin-1', 'Custody order');

      expect(guardianPortalAccessRepository.updateAccessStatus).toHaveBeenCalledWith(
        orgId,
        'admin-1',
        mockPortalAccess.id,
        'revoked',
        expect.objectContaining({ revocationReason: 'Custody order' })
      );
      expect(auditService.log).toHaveBeenCalledWith(
        orgId,
        'admin-1',
        'REVOKE_GUARDIAN_PORTAL',
        'guardianPortalAccess',
        mockPortalAccess.id,
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  // =========================================================================
  // 3. Guardian Portal Service Queries & DTO Projections
  // =========================================================================
  describe('guardianPortalService', () => {
    beforeEach(() => {
      vi.spyOn(guardianPortalAccessRepository, 'getByUserId').mockResolvedValue(mockPortalAccess);
      vi.spyOn(guardianRepository, 'getById').mockResolvedValue(mockGuardian);
      vi.spyOn(learnerGuardianRepository, 'getLearnersForGuardian').mockResolvedValue([mockRelationship1]);
      vi.spyOn(learnerRepository, 'getById').mockResolvedValue(mockLearner1);
    });

    it('getLearners returns safe summaries with attendance compliance and balance', async () => {
      vi.spyOn(enrolmentRepository, 'getByLearner').mockResolvedValue([
        { programmeId: 'prog-1', groupId: 'grp-1', enrolmentStatus: 'active' } as never
      ]);
      vi.spyOn(programmeRepository, 'getById').mockResolvedValue({ id: 'prog-1', name: 'Violin Beginner' } as never);
      vi.spyOn(programmeGroupRepository, 'getById').mockResolvedValue({ id: 'grp-1', name: 'Group A' } as never);
      vi.spyOn(attendanceRepository, 'getByLearner').mockResolvedValue([
        { attendanceStatus: 'present' },
        { attendanceStatus: 'present' },
        { attendanceStatus: 'late' }
      ] as never);
      vi.spyOn(invoiceRepository, 'getByLearner').mockResolvedValue([
        { invoiceStatus: 'issued', balance: 45000 } as never
      ]);

      const learners = await guardianPortalService.getLearners(orgId, userId);

      expect(learners).toHaveLength(1);
      expect(learners[0].firstName).toBe('Sipho');
      expect(learners[0].attendanceRate).toBe(100); // lateCountsAsPresent is true
      expect(learners[0].balanceDueCents).toBe(45000);
      expect(learners[0].programmes[0].name).toBe('Violin Beginner');
    });

    it('getAttendance returns breakdown counts and respects late policy', async () => {
      vi.spyOn(attendanceRepository, 'getByLearner').mockResolvedValue([
        { sessionId: 's1', attendanceStatus: 'present', createdAt: '2026-02-01T00:00:00Z' },
        { sessionId: 's2', attendanceStatus: 'late', createdAt: '2026-02-02T00:00:00Z' },
        { sessionId: 's3', attendanceStatus: 'absent', createdAt: '2026-02-03T00:00:00Z' }
      ] as never);
      vi.spyOn(sessionRepository, 'getById').mockResolvedValue({
        sessionDate: '2026-02-01',
        sessionType: 'rehearsal',
        startTime: '10:00'
      } as never);

      const att = await guardianPortalService.getAttendance(orgId, userId, learnerId1);

      expect(att.presentCount).toBe(1);
      expect(att.lateCount).toBe(1);
      expect(att.absentCount).toBe(1);
      expect(att.totalEvaluatedSessions).toBe(3);
      // (1 present + 1 late) / 3 = 66.67%
      expect(att.attendanceRate).toBeCloseTo(66.67, 1);
    });

    it('getEvents returns events linked to learner and hides unrelated ones', async () => {
      vi.spyOn(eventParticipantRepository, 'getByOrganisation').mockResolvedValue([
        { eventId: 'event-1', learnerId: learnerId1, participantStatus: 'registered' } as never,
        { eventId: 'event-other', learnerId: 'learner-unrelated', participantStatus: 'registered' } as never
      ]);
      vi.spyOn(eventRepository, 'getById').mockImplementation(async (_org, eid) => {
        if (eid === 'event-1') {
          return {
            id: 'event-1',
            name: 'Gala Night',
            eventType: 'concert',
            startDate: '2026-10-15',
            venue: 'Civic Hall'
          } as never;
        }
        return null;
      });
      vi.spyOn(consentRequestRepository, 'getByOrganisation').mockResolvedValue([]);
      vi.spyOn(transportPassengerRepository, 'getByOrganisation').mockResolvedValue([]);

      const events = await guardianPortalService.getEvents(orgId, userId, learnerId1);

      expect(events).toHaveLength(1);
      expect(events[0].id).toBe('event-1');
      expect(events[0].name).toBe('Gala Night');
    });

    it('submitConsent calls consentSubmissionService and audits GUARDIAN_SUBMIT_CONSENT', async () => {
      vi.spyOn(consentRequestRepository, 'getById').mockResolvedValue({
        id: 'req-1',
        eventId: 'event-1',
        learnerId: learnerId1
      } as never);

      const submitSpy = vi.spyOn(consentSubmissionService, 'submitConsent').mockResolvedValue({
        id: 'sub-1',
        submissionStatus: 'submitted'
      } as never);

      await guardianPortalService.submitConsent(orgId, userId, 'req-1', {
        participationApproved: true,
        transportApproved: true,
        indemnityAccepted: true
      });

      expect(submitSpy).toHaveBeenCalledWith(
        orgId,
        expect.objectContaining({
          consentRequestId: 'req-1',
          learnerId: learnerId1,
          guardianId,
          participationApproved: true
        }),
        userId
      );

      expect(auditService.log).toHaveBeenCalledWith(
        orgId,
        userId,
        'GUARDIAN_SUBMIT_CONSENT',
        'consentSubmissions',
        'sub-1',
        null,
        expect.any(Object)
      );
    });

    it('getTransportPlans displays learner boarding and return without manifest leakage', async () => {
      vi.spyOn(transportPassengerRepository, 'getByOrganisation').mockResolvedValue([
        {
          id: 'pass-1',
          eventTransportPlanId: 'plan-1',
          learnerId: learnerId1,
          boardingStatus: 'boarded',
          returnStatus: 'planned'
        } as never
      ]);
      vi.spyOn(eventTransportPlanRepository, 'getById').mockResolvedValue({
        id: 'plan-1',
        eventId: 'event-1',
        planName: 'Bus Alpha',
        pickupLocation: 'Main Campus',
        destination: 'Symphony Hall',
        departureDate: '2026-06-10',
        departureTime: '08:00',
        returnTime: '18:00'
      } as never);
      vi.spyOn(eventRepository, 'getById').mockResolvedValue({ name: 'Winter Tour' } as never);

      const plans = await guardianPortalService.getTransportPlans(orgId, userId, learnerId1);

      expect(plans).toHaveLength(1);
      expect(plans[0].planName).toBe('Bus Alpha');
      expect(plans[0].boardingStatus).toBe('boarded');
      expect(plans[0].pickupLocation).toBe('Main Campus');
    });

    it('getFinance returns invoice and payment history with banking details', async () => {
      vi.spyOn(invoiceRepository, 'getByLearner').mockResolvedValue([
        {
          id: 'inv-1',
          invoiceNumber: 'INV-2026-001',
          learnerId: learnerId1,
          total: 50000,
          amountPaid: 20000,
          balance: 30000,
          invoiceStatus: 'issued',
          dueDate: '2026-03-31'
        } as never
      ]);
      vi.spyOn(invoiceLineItemRepository, 'getByInvoice').mockResolvedValue([
        { description: 'Term 1 Tuition', quantity: 1, unitAmount: 50000, lineTotal: 50000 } as never
      ]);
      vi.spyOn(paymentRepository, 'getByLearner').mockResolvedValue([
        {
          id: 'pay-1',
          amount: 20000,
          paymentMethod: 'eft',
          paymentStatus: 'success',
          createdAt: '2026-02-15T00:00:00Z'
        } as never
      ]);
      vi.spyOn(paymentAllocationRepository, 'getByOrganisation').mockResolvedValue([]);

      const fin = await guardianPortalService.getFinance(orgId, userId, learnerId1);

      expect(fin.totalInvoicedCents).toBe(50000);
      expect(fin.totalPaidCents).toBe(20000);
      expect(fin.outstandingBalanceCents).toBe(30000);
      expect(fin.invoices).toHaveLength(1);
      expect(fin.invoices[0].lineItems).toHaveLength(1);
      expect(fin.recentPayments).toHaveLength(1);
    });

    it('getDocuments filters out internal-only documents and presents portalVisible documents', async () => {
      vi.spyOn(documentRepository, 'getByOrganisation').mockResolvedValue([
        {
          id: 'doc-internal',
          name: 'Staff Confidential Notes',
          documentStatus: 'active',
          portalVisibility: 'internal'
        } as never,
        {
          id: 'doc-guardian',
          name: 'Parent Handbook 2026',
          documentStatus: 'active',
          portalVisibility: 'guardian',
          downloadUrl: 'https://example.com/handbook.pdf'
        } as never
      ]);
      vi.spyOn(documentLinkRepository, 'getByOrganisation').mockResolvedValue([]);

      const docs = await guardianPortalService.getDocuments(orgId, userId);

      expect(docs).toHaveLength(1);
      expect(docs[0].name).toBe('Parent Handbook 2026');
      expect(docs.some(d => d.name.includes('Confidential'))).toBe(false);
    });

    it('getMessages shows only communications sent to this guardian without exposing other recipients', async () => {
      vi.spyOn(communicationRecipientRepository, 'getByOrganisation').mockResolvedValue([
        { communicationId: 'comm-1', guardianId, recipientEmail: 'zodwa@example.com' } as never,
        { communicationId: 'comm-other', guardianId: 'other-guardian' } as never
      ]);
      vi.spyOn(communicationRepository, 'getById').mockImplementation(async (_org, cid) => {
        if (cid === 'comm-1') {
          return {
            id: 'comm-1',
            communicationType: 'notice',
            channel: 'email',
            subject: 'Rehearsal Venue Change',
            body: 'Please note the auditorium change.',
            communicationStatus: 'sent',
            sentAt: '2026-03-01T12:00:00Z'
          } as never;
        }
        return null;
      });

      const msgs = await guardianPortalService.getMessages(orgId, userId);

      expect(msgs).toHaveLength(1);
      expect(msgs[0].subject).toBe('Rehearsal Venue Change');
    });

    it('updateProfile directly updates contact info when allowDirectProfileEdit is true', async () => {
      const updateSpy = vi.spyOn(guardianRepository, 'update').mockResolvedValue({} as never);

      const res = await guardianPortalService.updateProfile(orgId, userId, {
        mobileNumber: '+27829998877',
        address: '99 New Street'
      });

      expect(res.updatedDirectly).toBe(true);
      expect(updateSpy).toHaveBeenCalledWith(
        orgId,
        userId,
        guardianId,
        expect.objectContaining({
          mobileNumber: '+27829998877',
          address: '99 New Street'
        })
      );
      expect(auditService.log).toHaveBeenCalledWith(
        orgId,
        userId,
        'GUARDIAN_UPDATE_CONTACT',
        'guardians',
        guardianId,
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('updateProfile creates a change request when allowDirectProfileEdit is false', async () => {
      vi.spyOn(organisationSettingsService, 'getSettings').mockResolvedValue({
        portal: { ...defaultPortalSettings, allowDirectProfileEdit: false }
      } as never);

      const createReqSpy = vi.spyOn(portalChangeRequestRepository, 'create').mockResolvedValue({
        id: 'cr-1',
        requestStatus: 'pending'
      } as never);

      const res = await guardianPortalService.updateProfile(orgId, userId, {
        mobileNumber: '+27829998877'
      });

      expect(res.updatedDirectly).toBe(false);
      expect(res.changeRequestId).toBe('cr-1');
      expect(createReqSpy).toHaveBeenCalledWith(
        orgId,
        userId,
        expect.objectContaining({
          guardianId,
          requestType: 'contact_details',
          requestStatus: 'pending'
        })
      );
    });
  });
});
