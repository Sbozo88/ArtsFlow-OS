import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { costumeAllocationService } from '../services/costumeAllocationService';
import type { CostumeAllocation } from '../types';

export function useCostumeAllocations() {
  const { organisationId } = useAuth();
  const [allocations, setAllocations] = useState<CostumeAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const fetch = async () => {
      try {
        setLoading(true);
        const data = await costumeAllocationService.getCostumeAllocations(organisationId);
        if (mounted) { setAllocations(data); setError(null); }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [organisationId]);

  return { allocations, loading, error };
}
