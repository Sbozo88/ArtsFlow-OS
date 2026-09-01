import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { enrolmentService } from '../services/enrolmentService';
import type { Enrolment } from '../types';

export function useLearnerEnrolments(learnerId: string | undefined) {
  const { organisationId } = useAuth();
  const [enrolments, setEnrolments] = useState<Enrolment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId || !learnerId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const fetch = async () => {
      try {
        setLoading(true);
        const data = await enrolmentService.getEnrolmentsByLearner(organisationId, learnerId);
        if (mounted) { setEnrolments(data); setError(null); }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [organisationId, learnerId]);

  return { enrolments, loading, error };
}
