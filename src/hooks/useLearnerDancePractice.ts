import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dancePracticeService } from '../services/dancePracticeService';
import type { DancePracticeLog } from '../types';

export function useLearnerDancePractice(learnerId: string | undefined) {
  const { organisationId } = useAuth();
  const [practiceLogs, setPracticeLogs] = useState<DancePracticeLog[]>([]);
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
        const data = await dancePracticeService.getPracticeLogs(organisationId);
        const filtered = data.filter(l => l.learnerId === learnerId);
        if (mounted) { setPracticeLogs(filtered); setError(null); }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [organisationId, learnerId]);

  return { practiceLogs, loading, error };
}
