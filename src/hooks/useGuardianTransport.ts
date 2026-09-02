import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { guardianPortalService } from '../services/guardianPortalService';
import type { GuardianTransportPlanDto } from '../types';

export function useGuardianTransport(learnerId?: string | null) {
  const { authUser, organisationId } = useAuth();
  const [plans, setPlans] = useState<GuardianTransportPlanDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    if (!authUser || !organisationId) return;

    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await guardianPortalService.getTransportPlans(organisationId, authUser.uid, learnerId || undefined);
        if (mounted) {
          setPlans(data);
        }
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchPlans();
    return () => { mounted = false; };
  }, [authUser, organisationId, learnerId, refreshIndex]);

  const refresh = async () => {
    setRefreshIndex(prev => prev + 1);
  };

  return { plans, loading, error, refresh };
}
