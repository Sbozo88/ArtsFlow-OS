import { describe, it, expect, vi, beforeEach } from 'vitest';
import { consentRequestService } from '../consentRequestService';
import { consentSubmissionService } from '../consentSubmissionService';
import { transportVehicleService } from '../transportVehicleService';
import { transportPassengerService } from '../transportPassengerService';
import { consentRequestRepository } from '../../repositories/consentRequestRepository';
import { consentSubmissionRepository } from '../../repositories/consentSubmissionRepository';
import { eventRepository } from '../../repositories/eventRepository';
import { learnerRepository } from '../../repositories/learnerRepository';
import { consentTemplateRepository } from '../../repositories/consentTemplateRepository';
import { eventTransportPlanRepository } from '../../repositories/eventTransportPlanRepository';
import { transportPassengerRepository } from '../../repositories/transportPassengerRepository';

vi.mock('../auditService', () => ({
  auditService: {
    log: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('Phase 3B: Consent & Transport Integrity Tests', () => {
  const orgId = 'org-123';
    const actorId = 'user-admin';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Consent Request & Submission Rules', () => {
    it('prevents duplicate active consent requests for same event, learner, and template', async () => {
      vi.spyOn(eventRepository, 'getById').mockResolvedValue({
        id: 'event-1',
        organisationId: orgId,
        name: 'Annual Concert'
      } as never);

      vi.spyOn(learnerRepository, 'getById').mockResolvedValue({
        id: 'learner-1',
        organisationId: orgId,
        firstName: 'Thabo',
        lastName: 'Molefe'
      } as never);

      vi.spyOn(consentTemplateRepository, 'getById').mockResolvedValue({
        id: 'template-1',
        organisationId: orgId,
        name: 'General Consent'
      } as never);

      vi.spyOn(consentRequestRepository, 'getByOrganisation').mockResolvedValue([
        {
          id: 'req-existing',
          organisationId: orgId,
          eventId: 'event-1',
          learnerId: 'learner-1',
          templateId: 'template-1',
          requestStatus: 'pending'
        } as never
      ]);

      await expect(
        consentRequestService.createConsentRequest(orgId, {
          eventId: 'event-1',
          learnerId: 'learner-1',
          templateId: 'template-1',
          requestedAt: new Date().toISOString(),
          requestStatus: 'pending'
        }, actorId)
      ).rejects.toThrow(/already exists/);
    });

    it('rejects cross-organisation event or learner when creating consent request', async () => {
      vi.spyOn(eventRepository, 'getById').mockResolvedValue(null); // cross-org lookup returns null

      await expect(
        consentRequestService.createConsentRequest(orgId, {
          eventId: 'event-other',
          learnerId: 'learner-1',
          templateId: 'template-1',
          requestedAt: new Date().toISOString(),
          requestStatus: 'pending'
        }, actorId)
      ).rejects.toThrow(/Event not found/);
    });

    it('preserves historical consent submissions by superseding instead of overwriting', async () => {
      vi.spyOn(consentRequestRepository, 'getById').mockResolvedValue({
        id: 'req-1',
        organisationId: orgId,
        eventId: 'event-1',
        learnerId: 'learner-1'
      } as never);

      const oldSubmission = {
        id: 'sub-old',
        organisationId: orgId,
        consentRequestId: 'req-1',
        eventId: 'event-1',
        learnerId: 'learner-1',
        participationApproved: true,
        transportApproved: false,
        submissionStatus: 'submitted'
      };

      vi.spyOn(consentSubmissionRepository, 'getByOrganisation').mockResolvedValue([oldSubmission as never]);
      vi.spyOn(consentRequestRepository, 'update').mockResolvedValue(undefined);
      const updateSpy = vi.spyOn(consentSubmissionRepository, 'update').mockResolvedValue(undefined);
      const createSpy = vi.spyOn(consentSubmissionRepository, 'create').mockResolvedValue({
        id: 'sub-new',
        organisationId: orgId,
        consentRequestId: 'req-1',
        submissionStatus: 'submitted'
      } as never);

      await consentSubmissionService.submitConsent(orgId, {
        consentRequestId: 'req-1',
        eventId: 'event-1',
        learnerId: 'learner-1',
        participationApproved: true,
        transportApproved: true,
        indemnityAccepted: true,
        guardianName: 'Mrs Molefe'
      }, actorId);

      // Verify old submission was superseded, not overwritten
      expect(updateSpy).toHaveBeenCalledWith(
        orgId,
        actorId,
        'sub-old',
        expect.objectContaining({ submissionStatus: 'superseded' })
      );

      // Verify new submission was created
      expect(createSpy).toHaveBeenCalled();
    });
  });

  describe('Transport Fleet & Passenger Capacity Rules', () => {
    it('enforces positive integer vehicle capacity', async () => {
      await expect(
        transportVehicleService.createVehicle(orgId, {
          vehicleName: 'Mini Bus',
          vehicleType: 'minibus',
          capacity: 0,
          vehicleStatus: 'available'
        }, actorId)
      ).rejects.toThrow(/capacity must be a positive integer/);

      await expect(
        transportVehicleService.createVehicle(orgId, {
          vehicleName: 'Mini Bus',
          vehicleType: 'minibus',
          capacity: -10,
          vehicleStatus: 'available'
        }, actorId)
      ).rejects.toThrow(/capacity must be a positive integer/);
    });

    it('prevents assigning passengers when vehicle is at capacity', async () => {
      vi.spyOn(eventTransportPlanRepository, 'getById').mockResolvedValue({
        id: 'plan-1',
        organisationId: orgId,
        eventId: 'event-1',
        vehicleCapacity: 2
      } as never);

      vi.spyOn(transportPassengerRepository, 'getByOrganisation').mockResolvedValue([
        { id: 'p1', eventTransportPlanId: 'plan-1', learnerId: 'l1', passengerType: 'learner' },
        { id: 'p2', eventTransportPlanId: 'plan-1', learnerId: 'l2', passengerType: 'learner' }
      ] as never);

      await expect(
        transportPassengerService.addPassenger(orgId, {
          eventTransportPlanId: 'plan-1',
          eventId: 'event-1',
          passengerType: 'staff',
          staffId: 'staff-1',
          boardingStatus: 'planned'
        }, actorId)
      ).rejects.toThrow(/full capacity/);
    });

    it('prevents duplicate passenger assignment to same transport plan', async () => {
      vi.spyOn(eventTransportPlanRepository, 'getById').mockResolvedValue({
        id: 'plan-1',
        organisationId: orgId,
        eventId: 'event-1',
        vehicleCapacity: 50
      } as never);

      vi.spyOn(transportPassengerRepository, 'getByOrganisation').mockResolvedValue([
        { id: 'p1', eventTransportPlanId: 'plan-1', learnerId: 'learner-1', passengerType: 'learner' }
      ] as never);

      await expect(
        transportPassengerService.addPassenger(orgId, {
          eventTransportPlanId: 'plan-1',
          eventId: 'event-1',
          passengerType: 'learner',
          learnerId: 'learner-1',
          boardingStatus: 'planned'
        }, actorId)
      ).rejects.toThrow(/already assigned/);
    });

    it('blocks learner transport assignment if transport consent is not approved, unless overridden', async () => {
      vi.spyOn(eventTransportPlanRepository, 'getById').mockResolvedValue({
        id: 'plan-1',
        organisationId: orgId,
        eventId: 'event-1',
        vehicleCapacity: 50
      } as never);

      vi.spyOn(transportPassengerRepository, 'getByOrganisation').mockResolvedValue([]);
      // No approved consent
      vi.spyOn(consentSubmissionRepository, 'getByOrganisation').mockResolvedValue([]);

      // 1. Fails without override
      await expect(
        transportPassengerService.addPassenger(orgId, {
          eventTransportPlanId: 'plan-1',
          eventId: 'event-1',
          passengerType: 'learner',
          learnerId: 'learner-no-consent',
          boardingStatus: 'planned'
        }, actorId, false)
      ).rejects.toThrow(/Approved transport consent is required/);

      // 2. Succeeds with explicit override
      vi.spyOn(transportPassengerRepository, 'create').mockResolvedValue({
        id: 'p-override',
        eventTransportPlanId: 'plan-1',
        learnerId: 'learner-no-consent'
      } as never);

      const passenger = await transportPassengerService.addPassenger(orgId, {
        eventTransportPlanId: 'plan-1',
        eventId: 'event-1',
        passengerType: 'learner',
        learnerId: 'learner-no-consent',
        boardingStatus: 'planned'
      }, actorId, true);

      expect(passenger).toBeDefined();
    });

    it('performs departure and return boarding state transitions', async () => {
      const existingPassenger = {
        id: 'pass-1',
        organisationId: orgId,
        eventTransportPlanId: 'plan-1',
        boardingStatus: 'planned',
        returnStatus: 'pending'
      };

      vi.spyOn(transportPassengerRepository, 'getByOrganisation').mockResolvedValue([existingPassenger as never]);
      const updateSpy = vi.spyOn(transportPassengerRepository, 'update').mockResolvedValue(undefined);

      // Board
      await transportPassengerService.markBoarded(orgId, 'pass-1', actorId);
      expect(updateSpy).toHaveBeenCalledWith(orgId, actorId, 'pass-1', { boardingStatus: 'boarded' });

      // Absent
      await transportPassengerService.markAbsent(orgId, 'pass-1', actorId, 'Did not show up');
      expect(updateSpy).toHaveBeenCalledWith(orgId, actorId, 'pass-1', {
        boardingStatus: 'absent',
        notes: 'Did not show up'
      });

      // Returned
      await transportPassengerService.markReturned(orgId, 'pass-1', actorId);
      expect(updateSpy).toHaveBeenCalledWith(orgId, actorId, 'pass-1', { returnStatus: 'returned' });
    });
  });
});
