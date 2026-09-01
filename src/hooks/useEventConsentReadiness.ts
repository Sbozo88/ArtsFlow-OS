import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EventParticipant, ConsentSubmission, TransportPassenger } from '../types';
import { eventParticipantRepository } from '../repositories/eventParticipantRepository';
import { consentSubmissionRepository } from '../repositories/consentSubmissionRepository';
import { transportPassengerRepository } from '../repositories/transportPassengerRepository';

export interface ParticipantReadiness {
  participantId: string;
  learnerId: string;
  isConfirmed: boolean;
  isConsentApproved: boolean;
  hasTransportConsent: boolean;
  isTransportAssigned: boolean;
  medicalConditions?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  overallReady: boolean;
}

export const useEventConsentReadiness = (eventId?: string) => {
  const [readinessList, setReadinessList] = useState<ParticipantReadiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId || !eventId) return;
    try {
      const [allParticipants, allSubmissions, allPassengers] = await Promise.all([
        eventParticipantRepository.getByOrganisation(organisationId),
        consentSubmissionRepository.getByOrganisation(organisationId),
        transportPassengerRepository.getByOrganisation(organisationId)
      ]);

      const eventParticipants = allParticipants.filter((p: EventParticipant) => p.eventId === eventId);
      const eventSubmissions = allSubmissions.filter(
        (s: ConsentSubmission) => s.eventId === eventId && s.submissionStatus !== 'superseded'
      );
      const eventPassengers = allPassengers.filter(
        (p: TransportPassenger) => p.eventId === eventId && p.passengerType === 'learner'
      );

      const computed: ParticipantReadiness[] = eventParticipants.map((p: EventParticipant) => {
        const isConfirmed = p.participationStatus === 'confirmed';
        const submission = eventSubmissions.find((s: ConsentSubmission) => s.learnerId === p.learnerId);

        const isConsentApproved = !!(submission && submission.participationApproved && submission.submissionStatus === 'verified');
        const hasTransportConsent = !!(submission && submission.participationApproved && submission.transportApproved);
        const isTransportAssigned = eventPassengers.some((tp: TransportPassenger) => tp.learnerId === p.learnerId);

        const overallReady = isConfirmed && isConsentApproved;

        return {
          participantId: p.id,
          learnerId: p.learnerId,
          isConfirmed,
          isConsentApproved,
          hasTransportConsent,
          isTransportAssigned,
          medicalConditions: submission?.medicalConditions,
          allergies: submission?.allergies,
          emergencyContactName: submission?.emergencyContactName,
          emergencyContactPhone: submission?.emergencyContactPhone,
          overallReady
        };
      });

      setReadinessList(computed);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [organisationId, eventId]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId || !eventId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const init = async () => {
      try {
        const [allParticipants, allSubmissions, allPassengers] = await Promise.all([
          eventParticipantRepository.getByOrganisation(organisationId),
          consentSubmissionRepository.getByOrganisation(organisationId),
          transportPassengerRepository.getByOrganisation(organisationId)
        ]);

        const eventParticipants = allParticipants.filter((p: EventParticipant) => p.eventId === eventId);
        const eventSubmissions = allSubmissions.filter(
          (s: ConsentSubmission) => s.eventId === eventId && s.submissionStatus !== 'superseded'
        );
        const eventPassengers = allPassengers.filter(
          (p: TransportPassenger) => p.eventId === eventId && p.passengerType === 'learner'
        );

        const computed: ParticipantReadiness[] = eventParticipants.map((p: EventParticipant) => {
          const isConfirmed = p.participationStatus === 'confirmed';
          const submission = eventSubmissions.find((s: ConsentSubmission) => s.learnerId === p.learnerId);

          const isConsentApproved = !!(submission && submission.participationApproved && submission.submissionStatus === 'verified');
          const hasTransportConsent = !!(submission && submission.participationApproved && submission.transportApproved);
          const isTransportAssigned = eventPassengers.some((tp: TransportPassenger) => tp.learnerId === p.learnerId);

          const overallReady = isConfirmed && isConsentApproved;

          return {
            participantId: p.id,
            learnerId: p.learnerId,
            isConfirmed,
            isConsentApproved,
            hasTransportConsent,
            isTransportAssigned,
            medicalConditions: submission?.medicalConditions,
            allergies: submission?.allergies,
            emergencyContactName: submission?.emergencyContactName,
            emergencyContactPhone: submission?.emergencyContactPhone,
            overallReady
          };
        });

        if (mounted) {
          setReadinessList(computed);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();
    return () => { mounted = false; };
  }, [organisationId, eventId]);

  return { readinessList, loading, error, refresh: loadData };
};
