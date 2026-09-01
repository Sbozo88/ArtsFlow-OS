import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { guardianService } from '../services/guardianService';
import type { Guardian } from '../types';

export function useGuardians() {
  const { organisationId } = useAuth();
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const fetchGuardians = async () => {
      try {
        setLoading(true);
        const data = await guardianService.getGuardians(organisationId);
        if (mounted) {
          setGuardians(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchGuardians();
    return () => { mounted = false; };
  }, [organisationId]);

  return { guardians, loading, error };
}
