import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { choreographyService } from '../services/choreographyService';
import type { Choreography } from '../types';

export function useGroupChoreography(groupId: string | undefined) {
  const { organisationId } = useAuth();
  const [choreographyList, setChoreographyList] = useState<Choreography[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId || !groupId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const fetch = async () => {
      try {
        setLoading(true);
        const data = await choreographyService.getChoreography(organisationId);
        const filtered = data.filter(c => c.groupId === groupId);
        if (mounted) { setChoreographyList(filtered); setError(null); }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [organisationId, groupId]);

  return { choreographyList, loading, error };
}
