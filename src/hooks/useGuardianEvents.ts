import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { guardianPortalService } from '../services/guardianPortalService';
import type { GuardianEventDto } from '../types';

export function useGuardianEvents(learnerId?: string | null) {
  const { authUser, organisationId } = useAuth();
  const [events, setEvents] = useState<GuardianEventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    if (!authUser || !organisationId) return;

    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await guardianPortalService.getEvents(organisationId, authUser.uid, learnerId || undefined);
        if (mounted) {
          setEvents(data);
        }
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchEvents();
    return () => { mounted = false; };
  }, [authUser, organisationId, learnerId, refreshIndex]);

  const refresh = async () => {
    setRefreshIndex(prev => prev + 1);
  };

  return { events, loading, error, refresh };
}
