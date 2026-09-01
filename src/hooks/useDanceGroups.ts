import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProgrammeGroups } from './useProgrammeGroups';
import { useProgrammes } from './useProgrammes';
import type { ProgrammeGroup } from '../types';

export function useDanceGroups() {
  const { organisationId } = useAuth();
  const { groups, loading: groupsLoading, error: groupsError } = useProgrammeGroups();
  const { programmes, loading: programmesLoading, error: programmesError } = useProgrammes();
  const [danceGroups, setDanceGroups] = useState<ProgrammeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!organisationId) return;

    if (groupsError || programmesError) {
      setTimeout(() => {
        setError(groupsError || programmesError);
        setLoading(false);
      }, 0);
      return;
    }

    if (!groupsLoading && !programmesLoading) {
      const danceProgrammes = programmes.filter(p => p.programmeType === 'Dance');
      const danceProgrammeIds = new Set(danceProgrammes.map(p => p.id));
      const filtered = groups.filter(g => danceProgrammeIds.has(g.programmeId));
      setTimeout(() => {
        setDanceGroups(filtered);
        setLoading(false);
      }, 0);
    }
  }, [organisationId, groups, programmes, groupsLoading, programmesLoading, groupsError, programmesError]);

  return { danceGroups, loading, error };
}
