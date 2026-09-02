import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { guardianPortalService } from '../services/guardianPortalService';
import type { GuardianLearnerSummaryDto } from '../types';

export function useGuardianLearners() {
  const { authUser, organisationId } = useAuth();
  const [learners, setLearners] = useState<GuardianLearnerSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    if (!authUser || !organisationId) return;

    const fetchLearners = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await guardianPortalService.getLearners(organisationId, authUser.uid);
        if (mounted) {
          setLearners(data);
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

    fetchLearners();
    return () => { mounted = false; };
  }, [authUser, organisationId, refreshIndex]);

  const refresh = async () => {
    setRefreshIndex(prev => prev + 1);
  };

  return { learners, loading, error, refresh };
}
