import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { automationRuleService, type CreateRuleInput } from '../services/automation/automationRuleService';
import { automationExecutionService, type RunRuleResult } from '../services/automation/automationExecutionService';
import type { AutomationRule } from '../types';

export function useAutomationRule(ruleId?: string) {
  const { organisationId, user, authUser } = useAuth();
  const actorId = authUser?.uid || user?.uid || '';

  const [rule, setRule] = useState<AutomationRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const fetchRule = useCallback(async () => {
    if (!organisationId || !ruleId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await automationRuleService.getRuleById(organisationId, ruleId);
      setRule(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load rule');
    } finally {
      setLoading(false);
    }
  }, [organisationId, ruleId]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId || !ruleId) return;

    const load = async () => {
      try {
        const data = await automationRuleService.getRuleById(organisationId, ruleId);
        if (mounted) {
          setRule(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load rule');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [organisationId, ruleId]);

  const updateRule = async (updates: Partial<CreateRuleInput>) => {
    if (!organisationId || !ruleId || !actorId) return;
    try {
      await automationRuleService.updateRule(organisationId, ruleId, actorId, updates);
      await fetchRule();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update rule');
      throw err;
    }
  };

  const runRule = async (isDryRun = false): Promise<RunRuleResult> => {
    if (!organisationId || !ruleId || !actorId) throw new Error('Not authenticated');
    try {
      setRunning(true);
      const result = await automationExecutionService.runRule(organisationId, ruleId, actorId, isDryRun);
      if (!isDryRun) {
        await fetchRule();
      }
      return result;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Execution failed');
      throw err;
    } finally {
      setRunning(false);
    }
  };

  return {
    rule,
    loading,
    error,
    running,
    refresh: fetchRule,
    updateRule,
    runRule
  };
}
