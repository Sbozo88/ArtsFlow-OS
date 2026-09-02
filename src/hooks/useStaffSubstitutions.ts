import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { staffSubstitutionService, type RequestSubstitutionInput } from '../services/staffSubstitutionService';
import type { StaffSubstitution } from '../types';

export function useStaffSubstitutions(sessionId?: string, staffId?: string) {
  const { organisationId, user, authUser } = useAuth();
  const actorId = authUser?.uid || user?.uid || '';

  const [substitutions, setSubstitutions] = useState<StaffSubstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubstitutions = useCallback(async () => {
    if (!organisationId) return;
    try {
      setLoading(true);
      setError(null);
      let data: StaffSubstitution[] = [];
      if (sessionId) {
        data = await staffSubstitutionService.getSubstitutionsForSession(organisationId, sessionId);
      } else if (staffId) {
        data = await staffSubstitutionService.getSubstitutionsForStaff(organisationId, staffId);
      }
      setSubstitutions(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load substitutions';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [organisationId, sessionId, staffId]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        let data: StaffSubstitution[] = [];
        if (sessionId) {
          data = await staffSubstitutionService.getSubstitutionsForSession(organisationId, sessionId);
        } else if (staffId) {
          data = await staffSubstitutionService.getSubstitutionsForStaff(organisationId, staffId);
        }
        if (mounted) setSubstitutions(data);
      } catch (err: unknown) {
        if (mounted) {
          const msg = err instanceof Error ? err.message : 'Failed to load substitutions';
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
  }, [organisationId, sessionId, staffId]);

  const requestSubstitution = async (input: RequestSubstitutionInput) => {
    if (!organisationId) throw new Error('No active organisation');
    const res = await staffSubstitutionService.requestSubstitution(organisationId, actorId, input);
    await fetchSubstitutions();
    return res;
  };

  const confirmSubstitution = async (substitutionId: string) => {
    if (!organisationId) throw new Error('No active organisation');
    const updated = await staffSubstitutionService.confirmSubstitution(organisationId, substitutionId, actorId);
    await fetchSubstitutions();
    return updated;
  };

  const cancelSubstitution = async (substitutionId: string) => {
    if (!organisationId) throw new Error('No active organisation');
    await staffSubstitutionService.cancelSubstitution(organisationId, substitutionId, actorId);
    await fetchSubstitutions();
  };

  return {
    substitutions,
    loading,
    error,
    refresh: fetchSubstitutions,
    requestSubstitution,
    confirmSubstitution,
    cancelSubstitution
  };
}
