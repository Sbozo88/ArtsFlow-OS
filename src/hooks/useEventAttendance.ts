import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EventAttendance } from '../types';
import { eventAttendanceService } from '../services/eventAttendanceService';

export const useEventAttendance = (eventId?: string) => {
  const [attendance, setAttendance] = useState<EventAttendance[]>([]);
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
        const data = await eventAttendanceService.getEventAttendance(organisationId, eventId);
        if (mounted) {
          setAttendance(data);
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

  return { attendance, loading, error };
};
