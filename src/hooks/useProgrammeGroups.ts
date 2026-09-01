import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { programmeGroupService } from '../services/programmeGroupService';
import type { ProgrammeGroup } from '../types';

export function useProgrammeGroups() {
  const { organisationId } = useAuth();
  const [groups, setGroups] = useState<ProgrammeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const fetchGroups = async () => {
      try {
        setLoading(true);
        const data = await programmeGroupService.getGroups(organisationId);
        if (mounted) {
          setGroups(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchGroups();
    return () => { mounted = false; };
  }, [organisationId]);

  return { groups, loading, error };
}
