import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sessionService } from '../services/sessionService';
import type { Session } from '../types';

export function useGroupSessions(groupId: string | undefined) {
  const { organisationId } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
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
        const data = await sessionService.getSessionsByGroup(organisationId, groupId);
        if (mounted) { setSessions(data); setError(null); }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [organisationId, groupId]);

  return { sessions, loading, error };
}
