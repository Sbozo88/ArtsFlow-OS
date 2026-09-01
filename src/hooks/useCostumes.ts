import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { costumeService } from '../services/costumeService';
import type { Costume } from '../types';

export function useCostumes() {
  const { organisationId } = useAuth();
  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const fetch = async () => {
      try {
        setLoading(true);
        const data = await costumeService.getCostumes(organisationId);
        if (mounted) { setCostumes(data); setError(null); }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [organisationId]);

  return { costumes, loading, error };
}
