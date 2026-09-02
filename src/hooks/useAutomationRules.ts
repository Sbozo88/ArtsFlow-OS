import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { automationRuleService } from '../services/automation/automationRuleService';
import type { AutomationRule, RuleCategory, RuleStatus } from '../types';

export function useAutomationRules(filterCategory?: RuleCategory) {
  const { organisationId, user, authUser } = useAuth();
  const actorId = authUser?.uid || user?.uid || '';

  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    if (!organisationId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await automationRuleService.getRules(organisationId, filterCategory);
      setRules(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  }, [organisationId, filterCategory]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const load = async () => {
      try {
        const data = await automationRuleService.getRules(organisationId, filterCategory);
        if (mounted) {
          setRules(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load rules');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [organisationId, filterCategory]);

  const toggleRuleStatus = async (ruleId: string, currentStatus: RuleStatus) => {
    if (!organisationId || !actorId) return;
    try {
      if (currentStatus === 'active') {
        await automationRuleService.pauseRule(organisationId, ruleId, actorId);
      } else {
        await automationRuleService.enableRule(organisationId, ruleId, actorId);
      }
      await fetchRules();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update rule status');
      throw err;
    }
  };

  const instantiateTemplate = async (templateId: string) => {
    if (!organisationId || !actorId) return;
    try {
      const rule = await automationRuleService.instantiateTemplate(organisationId, templateId, actorId);
      await fetchRules();
      return rule;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to instantiate template');
      throw err;
    }
  };

  return {
    rules,
    loading,
    error,
    refresh: fetchRules,
    toggleRuleStatus,
    instantiateTemplate
  };
}
