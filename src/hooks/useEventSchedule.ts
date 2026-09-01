import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EventScheduleItem } from '../types';
import { eventScheduleService } from '../services/eventScheduleService';

export const useEventSchedule = (eventId?: string) => {
  const [scheduleItems, setScheduleItems] = useState<EventScheduleItem[]>([]);
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
        const data = await eventScheduleService.getEventSchedule(organisationId, eventId);
        if (mounted) {
          setScheduleItems(data);
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

  return { scheduleItems, loading, error };
};
