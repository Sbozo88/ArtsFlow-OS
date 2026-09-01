import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { followUpService } from '../services/followUpService';
import type { FollowUp } from '../types';

export function useFollowUps() {
  const { organisationId } = useAuth();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const fetch = async () => {
      try {
        setLoading(true);
        const data = await followUpService.getFollowUps(organisationId);
        if (mounted) { setFollowUps(data); setError(null); }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [organisationId]);

  return { followUps, loading, error };
}
