import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { timesheetService } from '../services/timesheetService';
import { timesheetVerificationService } from '../services/timesheetVerificationService';
import type { Timesheet, TimesheetEntry, TimesheetHoursSummary } from '../types';

export function useTimesheet(timesheetId?: string) {
  const { organisationId, user, authUser } = useAuth();
  const actorId = authUser?.uid || user?.uid || '';

  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [breakdown, setBreakdown] = useState<TimesheetHoursSummary>({
    teachingMinutes: 0,
    eventMinutes: 0,
    adminMinutes: 0,
    otherMinutes: 0,
    totalMinutes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimesheet = useCallback(async () => {
    if (!organisationId || !timesheetId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await timesheetService.getTimesheetWithEntries(organisationId, timesheetId);
      setTimesheet(data.timesheet);
      setEntries(data.entries);
      setBreakdown(timesheetService.calculateHoursBreakdown(data.entries));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load timesheet details';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [organisationId, timesheetId]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!organisationId || !timesheetId) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await timesheetService.getTimesheetWithEntries(organisationId, timesheetId);
        if (mounted) {
          setTimesheet(data.timesheet);
          setEntries(data.entries);
          setBreakdown(timesheetService.calculateHoursBreakdown(data.entries));
        }
      } catch (err: unknown) {
        if (mounted) {
          const msg = err instanceof Error ? err.message : 'Failed to load timesheet details';
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
  }, [organisationId, timesheetId]);

  const toggleEntryIncluded = async (entryId: string, included: boolean) => {
    if (!organisationId || !timesheetId) return;
    await timesheetService.toggleEntryIncluded(organisationId, timesheetId, entryId, included, actorId);
    await fetchTimesheet();
  };

  const submitTimesheet = async () => {
    if (!organisationId || !timesheetId) return;
    await timesheetService.submitTimesheet(organisationId, timesheetId, actorId);
    await fetchTimesheet();
  };

  const returnTimesheet = async (reason: string) => {
    if (!organisationId || !timesheetId) return;
    await timesheetService.returnTimesheet(organisationId, timesheetId, actorId, reason);
    await fetchTimesheet();
  };

  const verifyTimesheet = async (decisions?: { entryId: string; verified: boolean }[]) => {
    if (!organisationId || !timesheetId) return;
    await timesheetVerificationService.verifyTimesheet(organisationId, timesheetId, actorId, decisions);
    await fetchTimesheet();
  };

  const approveTimesheet = async () => {
    if (!organisationId || !timesheetId) return;
    await timesheetVerificationService.approveTimesheet(organisationId, timesheetId, actorId);
    await fetchTimesheet();
  };

  const rejectTimesheet = async (rejectionReason: string) => {
    if (!organisationId || !timesheetId) return;
    await timesheetVerificationService.rejectTimesheet(organisationId, timesheetId, actorId, rejectionReason);
    await fetchTimesheet();
  };

  return {
    timesheet,
    entries,
    breakdown,
    loading,
    error,
    refresh: fetchTimesheet,
    toggleEntryIncluded,
    submitTimesheet,
    returnTimesheet,
    verifyTimesheet,
    approveTimesheet,
    rejectTimesheet,
    formatDuration: timesheetService.formatDuration
  };
}
