import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EventPerformanceItem } from '../types';
import { eventPerformanceService } from '../services/eventPerformanceService';

export const useEventPerformanceItems = (eventId?: string) => {
  const [performanceItems, setPerformanceItems] = useState<EventPerformanceItem[]>([]);
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
        const data = await eventPerformanceService.getEventPerformances(organisationId, eventId);
        if (mounted) {
          setPerformanceItems(data);
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

  return { performanceItems, loading, error };
};
