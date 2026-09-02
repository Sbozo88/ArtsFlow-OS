import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FinanceAdjustment } from '../types';
import { financeAdjustmentService } from '../services/financeAdjustmentService';

export const useFinanceAdjustments = (filters?: { invoiceId?: string; chargeId?: string; learnerId?: string }) => {
  const [adjustments, setAdjustments] = useState<FinanceAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId) return;
    try {
      const data = await financeAdjustmentService.getAdjustments(organisationId, filters);
      setAdjustments(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [organisationId, filters?.invoiceId, filters?.chargeId, filters?.learnerId]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const init = async () => {
      try {
        const data = await financeAdjustmentService.getAdjustments(organisationId, filters);
        if (mounted) {
          setAdjustments(data);
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
  }, [organisationId, filters?.invoiceId, filters?.chargeId, filters?.learnerId]);

  return { adjustments, loading, error, refresh: loadData };
};
