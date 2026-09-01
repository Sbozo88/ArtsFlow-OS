import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sessionService } from '../services/sessionService';
import type { Session } from '../types';

export function useSessions() {
  const { organisationId } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const fetch = async () => {
      try {
        setLoading(true);
        const data = await sessionService.getSessions(organisationId);
        if (mounted) { setSessions(data); setError(null); }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [organisationId]);

  return { sessions, loading, error };
}
