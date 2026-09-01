import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EventTransportPlan } from '../types';
import { eventTransportPlanService } from '../services/eventTransportPlanService';

export const useEventTransportPlans = (eventId?: string) => {
  const [plans, setPlans] = useState<EventTransportPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId) return;
    try {
      const data = await eventTransportPlanService.getTransportPlans(organisationId, eventId);
      setPlans(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [organisationId, eventId]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const init = async () => {
      try {
        const data = await eventTransportPlanService.getTransportPlans(organisationId, eventId);
        if (mounted) {
          setPlans(data);
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
  }, [organisationId, eventId]);

  return { plans, loading, error, refresh: loadData };
};
