import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { staffAssignmentService, type CreateStaffAssignmentInput } from '../services/staffAssignmentService';
import type { StaffAssignment } from '../types';

export function useStaffAssignments(staffId?: string) {
  const { organisationId, user, authUser } = useAuth();
  const actorId = authUser?.uid || user?.uid || '';

  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!organisationId) return;
    try {
      setLoading(true);
      setError(null);
      const data = staffId 
        ? await staffAssignmentService.getAssignmentsForStaff(organisationId, staffId)
        : await staffAssignmentService.getAllAssignments(organisationId);
      setAssignments(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load staff assignments';
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
          ? await staffAssignmentService.getAssignmentsForStaff(organisationId, staffId)
          : await staffAssignmentService.getAllAssignments(organisationId);
        if (mounted) {
          setAssignments(data);
        }
      } catch (err: unknown) {
        if (mounted) {
          const msg = err instanceof Error ? err.message : 'Failed to load staff assignments';
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

  const createAssignment = async (input: CreateStaffAssignmentInput) => {
    if (!organisationId) throw new Error('No active organisation');
    const created = await staffAssignmentService.createAssignment(organisationId, actorId, input);
    await fetchAssignments();
    return created;
  };

  const endAssignment = async (assignmentId: string, status: 'completed' | 'cancelled' = 'completed') => {
    if (!organisationId) throw new Error('No active organisation');
    await staffAssignmentService.endAssignment(organisationId, assignmentId, actorId, status);
    await fetchAssignments();
  };

  return {
    assignments,
    loading,
    error,
    refresh: fetchAssignments,
    createAssignment,
    endAssignment
  };
}
