import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analyticsService } from '../services/analytics/analyticsService';
import type { LearnerAnalyticsSummary } from '../types';

export function useLearnerAnalytics(startDate?: string, endDate?: string, programmeId?: string) {
  const { organisationId } = useAuth();
  const [data, setData] = useState<LearnerAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const fetchData = async () => {
      try {
        const res = await analyticsService.getLearnerAnalytics(organisationId, startDate, endDate, programmeId);
        if (mounted) {
          setData(res);
          setError(null);
        }
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to fetch learner analytics');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [organisationId, startDate, endDate, programmeId]);

  const refresh = async () => {
    if (!organisationId) return;
    setLoading(true);
    try {
      const res = await analyticsService.getLearnerAnalytics(organisationId, startDate, endDate, programmeId);
      setData(res);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch learner analytics');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refresh };
}
