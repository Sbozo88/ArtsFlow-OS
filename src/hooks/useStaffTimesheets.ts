import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { timesheetService, type CreateTimesheetInput } from '../services/timesheetService';
import type { Timesheet } from '../types';

export function useStaffTimesheets(staffId?: string) {
  const { organisationId, user, authUser } = useAuth();
  const actorId = authUser?.uid || user?.uid || '';

  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimesheets = useCallback(async () => {
    if (!organisationId) return;
    try {
      setLoading(true);
      setError(null);
      const data = staffId
        ? await timesheetService.getTimesheetsForStaff(organisationId, staffId)
        : await timesheetService.getTimesheetsPendingReview(organisationId);
      setTimesheets(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load timesheets';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [organisationId, staffId]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = staffId
          ? await timesheetService.getTimesheetsForStaff(organisationId, staffId)
          : await timesheetService.getTimesheetsPendingReview(organisationId);
        if (mounted) setTimesheets(data);
      } catch (err: unknown) {
        if (mounted) {
          const msg = err instanceof Error ? err.message : 'Failed to load timesheets';
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

  const createDraftTimesheet = async (input: CreateTimesheetInput) => {
    if (!organisationId) throw new Error('No active organisation');
    const res = await timesheetService.createDraftTimesheet(organisationId, actorId, input);
    await fetchTimesheets();
    return res;
  };

  const submitTimesheet = async (timesheetId: string) => {
    if (!organisationId) throw new Error('No active organisation');
    const updated = await timesheetService.submitTimesheet(organisationId, timesheetId, actorId);
    await fetchTimesheets();
    return updated;
  };

  return {
    timesheets,
    loading,
    error,
    refresh: fetchTimesheets,
    createDraftTimesheet,
    submitTimesheet
  };
}
