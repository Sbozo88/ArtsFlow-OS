import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Payment, PaymentStatus } from '../types';
import { paymentService } from '../services/paymentService';

export const usePayments = (filters?: {
  learnerId?: string;
  guardianId?: string;
  paymentStatus?: PaymentStatus;
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId) return;
    try {
      const data = await paymentService.getPayments(organisationId, filters);
      setPayments(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [organisationId, filters?.learnerId, filters?.guardianId, filters?.paymentStatus]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const init = async () => {
      try {
        const data = await paymentService.getPayments(organisationId, filters);
        if (mounted) {
          setPayments(data);
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
  }, [organisationId, filters?.learnerId, filters?.guardianId, filters?.paymentStatus]);

  return { payments, loading, error, refresh: loadData };
};
