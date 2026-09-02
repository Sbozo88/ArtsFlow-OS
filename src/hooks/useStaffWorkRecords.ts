import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { staffWorkRecordService, type CreateManualWorkRecordInput } from '../services/staffWorkRecordService';
import type { StaffWorkRecord } from '../types';

export function useStaffWorkRecords(staffId?: string) {
  const { organisationId, user, authUser } = useAuth();
  const actorId = authUser?.uid || user?.uid || '';

  const [records, setRecords] = useState<StaffWorkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!organisationId) return;
    try {
      setLoading(true);
      setError(null);
      const data = staffId
        ? await staffWorkRecordService.getRecordsForStaff(organisationId, staffId)
        : await staffWorkRecordService.getUnverifiedRecords(organisationId);
      setRecords(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load work records';
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
          ? await staffWorkRecordService.getRecordsForStaff(organisationId, staffId)
          : await staffWorkRecordService.getUnverifiedRecords(organisationId);
        if (mounted) setRecords(data);
      } catch (err: unknown) {
        if (mounted) {
          const msg = err instanceof Error ? err.message : 'Failed to load work records';
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

  const createManualRecord = async (input: CreateManualWorkRecordInput) => {
    if (!organisationId) throw new Error('No active organisation');
    const res = await staffWorkRecordService.createManualRecord(organisationId, actorId, input);
    await fetchRecords();
    return res;
  };

  const generateFromSession = async (sessionId: string) => {
    if (!organisationId) throw new Error('No active organisation');
    const created = await staffWorkRecordService.generateFromSession(organisationId, sessionId, actorId);
    await fetchRecords();
    return created;
  };

  const generateFromEvent = async (eventId: string, defaultDurationMinutes = 180) => {
    if (!organisationId) throw new Error('No active organisation');
    const created = await staffWorkRecordService.generateFromEvent(organisationId, eventId, actorId, defaultDurationMinutes);
    await fetchRecords();
    return created;
  };

  const verifyRecord = async (recordId: string) => {
    if (!organisationId) throw new Error('No active organisation');
    await staffWorkRecordService.verifyRecord(organisationId, recordId, actorId);
    await fetchRecords();
  };

  const rejectRecord = async (recordId: string, reason: string) => {
    if (!organisationId) throw new Error('No active organisation');
    await staffWorkRecordService.rejectRecord(organisationId, recordId, actorId, reason);
    await fetchRecords();
  };

  return {
    records,
    loading,
    error,
    refresh: fetchRecords,
    createManualRecord,
    generateFromSession,
    generateFromEvent,
    verifyRecord,
    rejectRecord
  };
}
