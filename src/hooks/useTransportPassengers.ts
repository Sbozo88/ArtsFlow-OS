import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TransportPassenger } from '../types';
import { transportPassengerService } from '../services/transportPassengerService';

export const useTransportPassengers = (eventTransportPlanId?: string) => {
  const [passengers, setPassengers] = useState<TransportPassenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId || !eventTransportPlanId) return;
    try {
      const data = await transportPassengerService.getPassengers(organisationId, eventTransportPlanId);
      setPassengers(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [organisationId, eventTransportPlanId]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId || !eventTransportPlanId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const init = async () => {
      try {
        const data = await transportPassengerService.getPassengers(organisationId, eventTransportPlanId);
        if (mounted) {
          setPassengers(data);
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
  }, [organisationId, eventTransportPlanId]);

  return { passengers, loading, error, refresh: loadData };
};
