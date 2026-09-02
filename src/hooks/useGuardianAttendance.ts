import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { guardianPortalService } from '../services/guardianPortalService';
import type { GuardianAttendanceSummaryDto } from '../types';

export function useGuardianAttendance(learnerId: string | null) {
  const { authUser, organisationId } = useAuth();
  const [attendance, setAttendance] = useState<GuardianAttendanceSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    if (!authUser || !organisationId || !learnerId) return;

    const fetchAttendance = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await guardianPortalService.getAttendance(organisationId, authUser.uid, learnerId);
        if (mounted) {
          setAttendance(data);
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

    fetchAttendance();
    return () => { mounted = false; };
  }, [authUser, organisationId, learnerId, refreshIndex]);

  const refresh = async () => {
    setRefreshIndex(prev => prev + 1);
  };

  return { attendance, loading, error, refresh };
}
