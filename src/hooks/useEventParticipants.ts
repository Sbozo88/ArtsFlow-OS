import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EventParticipant } from '../types';
import { eventParticipantService } from '../services/eventParticipantService';

export const useEventParticipants = (eventId?: string) => {
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  useEffect(() => {
    let mounted = true;
    if (!organisationId || !eventId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const loadData = async () => {
      try {
        const data = await eventParticipantService.getEventParticipants(organisationId, eventId);
        if (mounted) {
          setParticipants(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [organisationId, eventId]);

  return { participants, loading, error };
};
