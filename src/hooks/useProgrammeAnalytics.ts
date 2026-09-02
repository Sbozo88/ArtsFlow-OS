import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analyticsService } from '../services/analytics/analyticsService';
import type { ProgrammeAnalyticsSummary } from '../types';

export function useProgrammeAnalytics(startDate?: string, endDate?: string) {
  const { organisationId } = useAuth();
  const [summaries, setSummaries] = useState<ProgrammeAnalyticsSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const fetchData = async () => {
      try {
        const res = await analyticsService.getProgrammeAnalytics(organisationId, startDate, endDate);
        if (mounted) {
          setSummaries(res);
          setError(null);
        }
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to fetch programme analytics');
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
      const res = await analyticsService.getProgrammeAnalytics(organisationId, startDate, endDate);
      setSummaries(res);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch programme analytics');
    } finally {
      setLoading(false);
    }
  };

  return { summaries, loading, error, refresh };
}
