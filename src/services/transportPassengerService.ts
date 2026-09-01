import { transportPassengerRepository } from '../repositories/transportPassengerRepository';
import { eventTransportPlanRepository } from '../repositories/eventTransportPlanRepository';
import { consentSubmissionRepository } from '../repositories/consentSubmissionRepository';
import { TransportPassenger } from '../types';
import { auditService } from './auditService';

export const transportPassengerService = {
  async getPassengers(organisationId: string, eventTransportPlanId: string): Promise<TransportPassenger[]> {
    const all = await transportPassengerRepository.getByOrganisation(organisationId);
    return all.filter(p => p.eventTransportPlanId === eventTransportPlanId);
  },

  async getPassengersForEvent(organisationId: string, eventId: string): Promise<TransportPassenger[]> {
    const all = await transportPassengerRepository.getByOrganisation(organisationId);
    return all.filter(p => p.eventId === eventId);
  },

  async addPassenger(
    organisationId: string,
    data: Omit<TransportPassenger, keyof import('../types').BaseRecord | 'organisationId'>,
    userId: string,
    allowConsentOverride: boolean = false
  ): Promise<TransportPassenger> {
    const plan = await eventTransportPlanRepository.getById(organisationId, data.eventTransportPlanId);
    if (!plan) throw new Error('Event transport plan not found');

    const existingPassengers = await this.getPassengers(organisationId, data.eventTransportPlanId);

    // 1. Duplicate Prevention
    const isDuplicate = existingPassengers.some(p => {
      if (data.passengerType === 'learner' && data.learnerId && p.learnerId === data.learnerId) return true;
      if (data.passengerType === 'staff' && data.staffId && p.staffId === data.staffId) return true;
      return false;
    });

    if (isDuplicate) {
      throw new Error('This passenger is already assigned to this transport plan');
    }

    // 2. Capacity Rule: Vehicle Capacity - Passengers = Remaining Seats. Never allow silent overbooking.
    if (existingPassengers.length >= plan.vehicleCapacity) {
      throw new Error(`Cannot assign passenger: Vehicle is at full capacity (${plan.vehicleCapacity} seats)`);
    }

    // 3. Transport Consent Enforcement for Learners
    if (data.passengerType === 'learner' && data.learnerId) {
      const allSubmissions = await consentSubmissionRepository.getByOrganisation(organisationId);
      const eventSubmissions = allSubmissions.filter(
        s => s.eventId === data.eventId && s.learnerId === data.learnerId && s.submissionStatus !== 'superseded'
      );

      const hasApprovedTransportConsent = eventSubmissions.some(
        s => s.participationApproved && s.transportApproved && (s.submissionStatus === 'verified' || s.submissionStatus === 'submitted')
      );

      if (!hasApprovedTransportConsent) {
        if (!allowConsentOverride) {
          throw new Error('Cannot assign learner: Approved transport consent is required before assignment');
        }
      }
    }

    const passenger = await transportPassengerRepository.create(organisationId, userId, {
      ...data,
      boardingStatus: data.boardingStatus || 'planned',
      returnStatus: data.returnStatus || 'pending',
      notes: allowConsentOverride ? (data.notes ? data.notes + ' | ' : '') + 'Admin override: Transport consent was overridden' : data.notes
    } as never);

    await auditService.log(
      organisationId,
      userId,
      'ADD_TRANSPORT_PASSENGER',
      'transportPassengers',
      passenger.id,
      undefined,
      passenger
    );

    return passenger;
  },

  async removePassenger(organisationId: string, id: string, userId: string): Promise<void> {
    const all = await transportPassengerRepository.getByOrganisation(organisationId);
    const existing = all.find(p => p.id === id);
    if (!existing) throw new Error('Transport passenger not found');

    await transportPassengerRepository.softDelete(organisationId, userId, id);
    await auditService.log(
      organisationId,
      userId,
      'REMOVE_TRANSPORT_PASSENGER',
      'transportPassengers',
      id,
      existing,
      { ...existing, status: 'deleted' }
    );
  },

  async markBoarded(organisationId: string, id: string, userId: string): Promise<void> {
    const all = await transportPassengerRepository.getByOrganisation(organisationId);
    const existing = all.find(p => p.id === id);
    if (!existing) throw new Error('Transport passenger not found');

    await transportPassengerRepository.update(organisationId, userId, id, {
      boardingStatus: 'boarded'
    } as never);

    const updated = { ...existing, boardingStatus: 'boarded' };
    await auditService.log(
      organisationId,
      userId,
      'MARK_PASSENGER_BOARDED',
      'transportPassengers',
      id,
      existing,
      updated
    );
  },

  async markAbsent(organisationId: string, id: string, userId: string, notes?: string): Promise<void> {
    const all = await transportPassengerRepository.getByOrganisation(organisationId);
    const existing = all.find(p => p.id === id);
    if (!existing) throw new Error('Transport passenger not found');

    await transportPassengerRepository.update(organisationId, userId, id, {
      boardingStatus: 'absent',
      notes: notes || existing.notes
    } as never);

    const updated = { ...existing, boardingStatus: 'absent', notes: notes || existing.notes };
    await auditService.log(
      organisationId,
      userId,
      'MARK_PASSENGER_ABSENT',
      'transportPassengers',
      id,
      existing,
      updated
    );
  },

  async markReturnBoarded(organisationId: string, id: string, userId: string): Promise<void> {
    const all = await transportPassengerRepository.getByOrganisation(organisationId);
    const existing = all.find(p => p.id === id);
    if (!existing) throw new Error('Transport passenger not found');

    await transportPassengerRepository.update(organisationId, userId, id, {
      returnStatus: 'boarded'
    } as never);
  },

  async markReturned(organisationId: string, id: string, userId: string): Promise<void> {
    const all = await transportPassengerRepository.getByOrganisation(organisationId);
    const existing = all.find(p => p.id === id);
    if (!existing) throw new Error('Transport passenger not found');

    await transportPassengerRepository.update(organisationId, userId, id, {
      returnStatus: 'returned'
    } as never);
  },

  async markNotReturning(organisationId: string, id: string, userId: string, notes?: string): Promise<void> {
    const all = await transportPassengerRepository.getByOrganisation(organisationId);
    const existing = all.find(p => p.id === id);
    if (!existing) throw new Error('Transport passenger not found');

    await transportPassengerRepository.update(organisationId, userId, id, {
      returnStatus: 'not_returning',
      notes: notes || existing.notes
    } as never);
  }
};
