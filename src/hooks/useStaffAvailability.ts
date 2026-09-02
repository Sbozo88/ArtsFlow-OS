import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { staffAvailabilityService, type SetStaffAvailabilityInput } from '../services/staffAvailabilityService';
import type { StaffAvailability } from '../types';

export function useStaffAvailability(staffId?: string) {
  const { organisationId, user, authUser } = useAuth();
  const actorId = authUser?.uid || user?.uid || '';

  const [availabilities, setAvailabilities] = useState<StaffAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailabilities = useCallback(async () => {
    if (!organisationId || !staffId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await staffAvailabilityService.getAvailabilityForStaff(organisationId, staffId);
      setAvailabilities(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load staff availability';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [organisationId, staffId]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!organisationId || !staffId) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await staffAvailabilityService.getAvailabilityForStaff(organisationId, staffId);
        if (mounted) setAvailabilities(data);
      } catch (err: unknown) {
        if (mounted) {
          const msg = err instanceof Error ? err.message : 'Failed to load staff availability';
          setError(msg);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [organisationId, staffId]);

  const setAvailability = async (input: SetStaffAvailabilityInput) => {
    if (!organisationId) throw new Error('No active organisation');
    const created = await staffAvailabilityService.setAvailability(organisationId, actorId, input);
    await fetchAvailabilities();
    return created;
  };

  const removeAvailability = async (availabilityId: string) => {
    if (!organisationId) throw new Error('No active organisation');
    await staffAvailabilityService.removeAvailability(organisationId, availabilityId, actorId);
    await fetchAvailabilities();
  };

  return {
    availabilities,
    loading,
    error,
    refresh: fetchAvailabilities,
    setAvailability,
    removeAvailability
  };
}
