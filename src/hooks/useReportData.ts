import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { ReportDefinition } from '../services/reportingService';
import type { OperationalReportRow } from '../types';

export function useReportData(
  reportDef: ReportDefinition | null,
  filters?: { startDate?: string; endDate?: string; programmeId?: string; groupId?: string }
) {
  const { organisationId } = useAuth();
  const [data, setData] = useState<OperationalReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startDate = filters?.startDate;
  const endDate = filters?.endDate;
  const programmeId = filters?.programmeId;
  const groupId = filters?.groupId;

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!organisationId || !reportDef) {
        return;
      }
      try {
        const rows = await reportDef.fetchData(organisationId, { startDate, endDate, programmeId, groupId });
        if (mounted) {
          setData(rows);
          setError(null);
        }
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to fetch report data');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [organisationId, reportDef, startDate, endDate, programmeId, groupId]);

  const refresh = async () => {
    if (!organisationId || !reportDef) return;
    setLoading(true);
    try {
      const rows = await reportDef.fetchData(organisationId, { startDate, endDate, programmeId, groupId });
      setData(rows);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refresh };
}
