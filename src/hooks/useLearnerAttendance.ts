import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { attendanceService } from '../services/attendanceService';
import type { Attendance } from '../types';

export function useLearnerAttendance(learnerId: string | undefined) {
  const { organisationId } = useAuth();
  const [records, setRecords] = useState<Attendance[]>([]);
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
        const data = await attendanceService.getLearnerAttendance(organisationId, learnerId);
        if (mounted) { setRecords(data); setError(null); }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [organisationId, learnerId]);

  return { records, loading, error };
}
