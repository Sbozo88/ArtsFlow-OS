import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dancePracticeService } from '../services/dancePracticeService';
import type { DancePracticeLog } from '../types';

export function useDancePracticeLogs() {
  const { organisationId } = useAuth();
  const [practiceLogs, setPracticeLogs] = useState<DancePracticeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const fetch = async () => {
      try {
        setLoading(true);
        const data = await dancePracticeService.getPracticeLogs(organisationId);
        if (mounted) { setPracticeLogs(data); setError(null); }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [organisationId]);

  return { practiceLogs, loading, error };
}
