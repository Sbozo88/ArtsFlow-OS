import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { choreographyService } from '../services/choreographyService';
import type { Choreography } from '../types';

export function useChoreography() {
  const { organisationId } = useAuth();
  const [choreographyList, setChoreographyList] = useState<Choreography[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const fetch = async () => {
      try {
        setLoading(true);
        const data = await choreographyService.getChoreography(organisationId);
        if (mounted) { setChoreographyList(data); setError(null); }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [organisationId]);

  return { choreographyList, loading, error };
}
