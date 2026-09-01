import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { staffService } from '../services/staffService';
import type { Staff } from '../types';

export function useStaff() {
  const { organisationId } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const fetchStaff = async () => {
      try {
        setLoading(true);
        const data = await staffService.getStaff(organisationId);
        if (mounted) {
          setStaff(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchStaff();
    return () => { mounted = false; };
  }, [organisationId]);

  return { staff, loading, error };
}
