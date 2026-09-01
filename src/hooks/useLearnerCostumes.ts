import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { costumeAllocationService } from '../services/costumeAllocationService';
import type { CostumeAllocation } from '../types';

export function useLearnerCostumes(learnerId: string | undefined) {
  const { organisationId } = useAuth();
  const [allocations, setAllocations] = useState<CostumeAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId || !learnerId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const fetch = async () => {
      try {
        setLoading(true);
        const data = await costumeAllocationService.getCostumeAllocations(organisationId);
        const filtered = data.filter(a => a.learnerId === learnerId);
        if (mounted) { setAllocations(filtered); setError(null); }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [organisationId, learnerId]);

  return { allocations, loading, error };
}
