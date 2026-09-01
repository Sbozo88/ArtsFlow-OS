import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { danceLevelService } from '../services/danceLevelService';
import type { DanceLevel } from '../types';

export function useDanceLevels() {
  const { organisationId } = useAuth();
  const [levels, setLevels] = useState<DanceLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const fetch = async () => {
      try {
        setLoading(true);
        const data = await danceLevelService.getDanceLevels(organisationId);
        if (mounted) { setLevels(data); setError(null); }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [organisationId]);

  return { levels, loading, error };
}
