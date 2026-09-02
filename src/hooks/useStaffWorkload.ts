import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  staffWorkloadService, 
  type StaffOverviewStats, 
  type GroupStaffCoverageItem 
} from '../services/staffWorkloadService';
import type { StaffWorkloadSummary } from '../types';

export function useStaffWorkload(startDate?: string, endDate?: string) {
  const { organisationId } = useAuth();

  const [overviewStats, setOverviewStats] = useState<StaffOverviewStats>({
    activeStaffCount: 0,
    teachersWorkingThisWeekCount: 0,
    sessionsThisWeekCount: 0,
    unverifiedTimesheetsCount: 0,
    timesheetsAwaitingApprovalCount: 0,
    activeSubstitutionsCount: 0,
    highWorkloadStaffCount: 0,
    noRecentActivityStaffCount: 0
  });

  const [summaries, setSummaries] = useState<StaffWorkloadSummary[]>([]);
  const [coverage, setCoverage] = useState<GroupStaffCoverageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default dates: current month if not provided
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const effectiveStart = startDate || defaultStart;
  const effectiveEnd = endDate || defaultEnd;

  const loadData = useCallback(async () => {
    if (!organisationId) return;
    try {
      setLoading(true);
      setError(null);
      const [stats, summs, cov] = await Promise.all([
        staffWorkloadService.getOverviewStats(organisationId),
        staffWorkloadService.getStaffWorkloadSummaries(organisationId, effectiveStart, effectiveEnd),
        staffWorkloadService.getGroupStaffCoverage(organisationId)
      ]);
      setOverviewStats(stats);
      setSummaries(summs);
      setCoverage(cov);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load workload analytics';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [organisationId, effectiveStart, effectiveEnd]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [stats, summs, cov] = await Promise.all([
          staffWorkloadService.getOverviewStats(organisationId),
          staffWorkloadService.getStaffWorkloadSummaries(organisationId, effectiveStart, effectiveEnd),
          staffWorkloadService.getGroupStaffCoverage(organisationId)
        ]);
        if (mounted) {
          setOverviewStats(stats);
          setSummaries(summs);
          setCoverage(cov);
        }
      } catch (err: unknown) {
        if (mounted) {
          const msg = err instanceof Error ? err.message : 'Failed to load workload analytics';
          setError(msg);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [organisationId, effectiveStart, effectiveEnd]);

  return {
    overviewStats,
    summaries,
    coverage,
    loading,
    error,
    refresh: loadData
  };
}
