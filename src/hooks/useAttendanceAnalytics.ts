import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analyticsService } from '../services/analytics/analyticsService';
import type { AttendanceAnalyticsSummary } from '../types';

export function useAttendanceAnalytics(
  startDate?: string,
  endDate?: string,
  programmeId?: string,
  groupId?: string
) {
  const { organisationId } = useAuth();
  const [data, setData] = useState<AttendanceAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const fetchData = async () => {
      try {
        const res = await analyticsService.getAttendanceAnalytics(
          organisationId,
          startDate,
          endDate,
          programmeId,
          groupId
        );
        if (mounted) {
          setData(res);
          setError(null);
        }
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to fetch attendance analytics');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [organisationId, startDate, endDate, programmeId, groupId]);

  const refresh = async () => {
    if (!organisationId) return;
    setLoading(true);
    try {
      const res = await analyticsService.getAttendanceAnalytics(
        organisationId,
        startDate,
        endDate,
        programmeId,
        groupId
      );
      setData(res);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance analytics');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refresh };
}
