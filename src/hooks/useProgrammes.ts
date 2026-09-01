import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { programmeService } from '../services/programmeService';
import type { Programme } from '../types';

export function useProgrammes() {
  const { organisationId } = useAuth();
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const fetchProgrammes = async () => {
      try {
        setLoading(true);
        const data = await programmeService.getProgrammes(organisationId);
        if (mounted) {
          setProgrammes(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProgrammes();
    return () => { mounted = false; };
  }, [organisationId]);

  return { programmes, loading, error };
}
