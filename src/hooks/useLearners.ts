import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { learnerService } from '../services/learnerService';
import type { Learner } from '../types';

export function useLearners() {
  const { organisationId } = useAuth();
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const fetchLearners = async () => {
      try {
        setLoading(true);
        const data = await learnerService.getLearners(organisationId);
        if (mounted) {
          setLearners(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchLearners();
    return () => { mounted = false; };
  }, [organisationId]);

  return { learners, loading, error };
}
