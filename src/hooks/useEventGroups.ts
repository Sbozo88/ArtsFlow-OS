import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EventGroup } from '../types';
import { eventGroupService } from '../services/eventGroupService';

export const useEventGroups = (eventId?: string) => {
  const [eventGroups, setEventGroups] = useState<EventGroup[]>([]);
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
        const data = await eventGroupService.getEventGroups(organisationId, eventId);
        if (mounted) {
          setEventGroups(data);
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

  return { eventGroups, loading, error };
};
