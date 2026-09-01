import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sessionChoreographyService } from '../services/sessionChoreographyService';
import type { SessionChoreography } from '../types';

export function useSessionChoreography(sessionId: string | undefined) {
  const { organisationId } = useAuth();
  const [sessionChoreographies, setSessionChoreographies] = useState<SessionChoreography[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId || !sessionId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const fetch = async () => {
      try {
        setLoading(true);
        const data = await sessionChoreographyService.getSessionChoreography(organisationId);
        const filtered = data.filter(c => c.sessionId === sessionId);
        if (mounted) { setSessionChoreographies(filtered); setError(null); }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [organisationId, sessionId]);

  return { sessionChoreographies, loading, error };
}
