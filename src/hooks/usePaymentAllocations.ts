import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PaymentAllocation } from '../types';
import { paymentAllocationService } from '../services/paymentAllocationService';

export const usePaymentAllocations = (filters?: { paymentId?: string; invoiceId?: string }) => {
  const [allocations, setAllocations] = useState<PaymentAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId) return;
    try {
      const data = await paymentAllocationService.getAllocations(organisationId, filters);
      setAllocations(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [organisationId, filters?.paymentId, filters?.invoiceId]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const init = async () => {
      try {
        const data = await paymentAllocationService.getAllocations(organisationId, filters);
        if (mounted) {
          setAllocations(data);
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
  }, [organisationId, filters?.paymentId, filters?.invoiceId]);

  return { allocations, loading, error, refresh: loadData };
};
