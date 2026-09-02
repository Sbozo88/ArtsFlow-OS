import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { financeReportingService } from '../services/financeReportingService';

export const useFinanceReports = () => {
  const [dataContext, setDataContext] = useState<Awaited<ReturnType<typeof financeReportingService.getReportsContext>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId) return;
    try {
      const data = await financeReportingService.getReportsContext(organisationId);
      setDataContext(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [organisationId]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const init = async () => {
      try {
        const data = await financeReportingService.getReportsContext(organisationId);
        if (mounted) {
          setDataContext(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();
    return () => { mounted = false; };
  }, [organisationId]);

  return { dataContext, loading, error, refresh: loadData };
};
