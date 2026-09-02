import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { automationExecutionRepository } from '../repositories/automationExecutionRepository';
import { automationExecutionService } from '../services/automation/automationExecutionService';
import type { AutomationExecution } from '../types';

export function useAutomationExecutions(ruleId?: string) {
  const { organisationId, user, authUser } = useAuth();
  const actorId = authUser?.uid || user?.uid || '';

  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExecutions = useCallback(async () => {
    if (!organisationId) return;
    try {
      setLoading(true);
      setError(null);
      let data: AutomationExecution[];
      if (ruleId) {
        data = await automationExecutionRepository.getByRuleId(organisationId, ruleId);
      } else {
        data = await automationExecutionRepository.getRecentExecutions(organisationId, 100);
      }
      setExecutions(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load execution logs');
    } finally {
      setLoading(false);
    }
  }, [organisationId, ruleId]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const load = async () => {
      try {
        let data: AutomationExecution[];
        if (ruleId) {
          data = await automationExecutionRepository.getByRuleId(organisationId, ruleId);
        } else {
          data = await automationExecutionRepository.getRecentExecutions(organisationId, 100);
        }
        if (mounted) {
          setExecutions(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load execution logs');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [organisationId, ruleId]);

  const retryExecution = async (executionId: string) => {
    if (!organisationId || !actorId) return;
    try {
      const res = await automationExecutionService.retryExecution(organisationId, executionId, actorId);
      await fetchExecutions();
      return res;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retry execution');
      throw err;
    }
  };

  return {
    executions,
    loading,
    error,
    refresh: fetchExecutions,
    retryExecution
  };
}
