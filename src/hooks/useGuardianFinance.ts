import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { guardianPortalService } from '../services/guardianPortalService';
import type { GuardianFinanceSummaryDto } from '../types';

export function useGuardianFinance(learnerId: string | null) {
  const { authUser, organisationId } = useAuth();
  const [finance, setFinance] = useState<GuardianFinanceSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    if (!authUser || !organisationId || !learnerId) return;

    const fetchFinance = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await guardianPortalService.getFinance(organisationId, authUser.uid, learnerId);
        if (mounted) {
          setFinance(data);
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

    fetchFinance();
    return () => { mounted = false; };
  }, [authUser, organisationId, learnerId, refreshIndex]);

  const refresh = async () => {
    setRefreshIndex(prev => prev + 1);
  };

  return { finance, loading, error, refresh };
}
