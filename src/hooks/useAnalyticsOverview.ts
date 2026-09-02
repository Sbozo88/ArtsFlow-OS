import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analyticsService } from '../services/analytics/analyticsService';
import type { AnalyticsOverviewMetrics } from '../types';

export function useAnalyticsOverview(startDate?: string, endDate?: string) {
  const { organisationId } = useAuth();
  const [metrics, setMetrics] = useState<AnalyticsOverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const fetchMetrics = async () => {
      try {
        const data = await analyticsService.getOverviewMetrics(organisationId, startDate, endDate);
        if (mounted) {
          setMetrics(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to fetch analytics overview');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMetrics();
    return () => { mounted = false; };
  }, [organisationId, startDate, endDate]);

  const refresh = async () => {
    if (!organisationId) return;
    setLoading(true);
    try {
      const data = await analyticsService.getOverviewMetrics(organisationId, startDate, endDate);
      setMetrics(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics overview');
    } finally {
      setLoading(false);
    }
  };

  return { metrics, loading, error, refresh };
}
