import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analyticsService } from '../services/analytics/analyticsService';
import type { EventReadinessCheck } from '../types';

export function useEventAnalytics(startDate?: string, endDate?: string) {
  const { organisationId } = useAuth();
  const [readiness, setReadiness] = useState<EventReadinessCheck[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const fetchData = async () => {
      try {
        const res = await analyticsService.getEventAnalytics(organisationId, startDate, endDate);
        if (mounted) {
          setReadiness(res.upcomingReadiness);
          setCompletedCount(res.completedCount);
          setUpcomingCount(res.upcomingCount);
          setError(null);
        }
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to fetch event analytics');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [organisationId, startDate, endDate]);

  const refresh = async () => {
    if (!organisationId) return;
    setLoading(true);
    try {
      const res = await analyticsService.getEventAnalytics(organisationId, startDate, endDate);
      setReadiness(res.upcomingReadiness);
      setCompletedCount(res.completedCount);
      setUpcomingCount(res.upcomingCount);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch event analytics');
    } finally {
      setLoading(false);
    }
  };

  return { readiness, completedCount, upcomingCount, loading, error, refresh };
}
