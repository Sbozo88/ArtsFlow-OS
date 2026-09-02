import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analyticsService } from '../services/analytics/analyticsService';
import type { FinanceAgeingSummary } from '../types';

export function useFinanceAnalytics(startDate?: string, endDate?: string) {
  const { organisationId, authUser } = useAuth();
  const [data, setData] = useState<{
    isRestricted: boolean;
    totalInvoiced: number;
    totalReceived: number;
    outstandingBalance: number;
    collectionRate: number;
    ageingSummary: FinanceAgeingSummary;
    programmeCollections: Array<{
      programmeName: string;
      invoiced: number;
      received: number;
      outstanding: number;
      collectionRate: number;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = authUser?.role;

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const fetchData = async () => {
      try {
        const res = await analyticsService.getFinanceAnalytics(
          organisationId,
          startDate,
          endDate,
          role
        );
        if (mounted) {
          setData(res);
          setError(null);
        }
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to fetch finance analytics');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [organisationId, role, startDate, endDate]);

  const refresh = async () => {
    if (!organisationId) return;
    setLoading(true);
    try {
      const res = await analyticsService.getFinanceAnalytics(
        organisationId,
        startDate,
        endDate,
        role
      );
      setData(res);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch finance analytics');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refresh };
}
