import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EventStaff } from '../types';
import { eventStaffService } from '../services/eventStaffService';

export const useEventStaff = (eventId?: string) => {
  const [eventStaff, setEventStaff] = useState<EventStaff[]>([]);
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
        const data = await eventStaffService.getEventStaff(organisationId, eventId);
        if (mounted) {
          setEventStaff(data);
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

  return { eventStaff, loading, error };
};
