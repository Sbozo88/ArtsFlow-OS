import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { learnerGuardianService } from '../services/learnerGuardianService';
import type { LearnerGuardian } from '../types';

export function useLearnerGuardians(learnerId?: string) {
  const { organisationId } = useAuth();
  const [links, setLinks] = useState<LearnerGuardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId || !learnerId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const fetchLinks = async () => {
      try {
        setLoading(true);
        const data = await learnerGuardianService.getGuardiansForLearner(organisationId, learnerId);
        if (mounted) {
          setLinks(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchLinks();
    return () => { mounted = false; };
  }, [organisationId, learnerId]);

  return { links, loading, error };
}
