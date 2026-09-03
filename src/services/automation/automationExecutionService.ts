import { automationRuleRepository } from '../../repositories/automationRuleRepository';
import { automationExecutionRepository } from '../../repositories/automationExecutionRepository';
import { followUpRepository } from '../../repositories/followUpRepository';
import { notificationRepository } from '../../repositories/notificationRepository';
import { automationEvaluationService } from './automationEvaluationService';
import { automationActionService, type ActionResult } from './automationActionService';
import { entitlementResolverService } from '../entitlementResolverService';
import { auditService } from '../auditService';
import type { 
  AutomationExecution, 
  ExecutionStatus,
  AutomationRule
} from '../../types';

export interface RunRuleResult {
  execution: AutomationExecution;
  matchedCount: number;
  actionsExecuted: ActionResult[];
  wasSkippedCooldown?: boolean;
}

export const automationExecutionService = {
  /**
   * Executes an automation rule against operational data.
   * Enforces cooldown, deduplication, safe human boundaries, and execution logging.
   */
  async runRule(
    organisationId: string,
    ruleId: string,
    actorId: string,
    isDryRun = false
  ): Promise<RunRuleResult> {
    const isEntitled = await entitlementResolverService.hasFeature(organisationId, 'automation.core');
    if (!isEntitled) {
      throw new Error(`Organisation is not entitled to feature 'automation.core'.`);
    }

    const rule = await automationRuleRepository.getById(organisationId, ruleId);
    if (!rule) throw new Error(`Automation rule not found: ${ruleId}`);

    const now = new Date();
    const nowIso = now.toISOString();

    // 1. Check rule cooldown (bypassed in dry-run mode)
    if (!isDryRun) {
      const cooldownCheck = automationActionService.checkCooldown(rule, now);
      if (cooldownCheck.inCooldown) {
        const skippedExecution = await automationExecutionRepository.create(organisationId, actorId, {
          automationRuleId: rule.id,
          ruleName: rule.name,
          ruleCategory: rule.ruleCategory,
          triggeredAt: nowIso,
          executionStatus: 'skipped' as ExecutionStatus,
          actionsAttempted: 0,
          actionsCompleted: 0,
          actionsFailed: 0,
          errorMessage: `Rule in cooldown (${cooldownCheck.remainingMinutes} minutes remaining)`,
          isDryRun: false
        });

        return {
          execution: skippedExecution,
          matchedCount: 0,
          actionsExecuted: [],
          wasSkippedCooldown: true
        };
      }
    }

    // 2. Evaluate matches
    const matchedEntities = await automationEvaluationService.evaluateRule(organisationId, rule);

    let actionsAttempted = 0;
    let actionsCompleted = 0;
    let actionsFailed = 0;
    const actionsTaken: ActionResult[] = [];
    let lastDeduplicationKey: string | undefined;

    // 3. Process each matched entity
    for (const entity of matchedEntities) {
      const deduplicationKey = automationActionService.generateDeduplicationKey(
        rule.id,
        entity.entityType,
        entity.entityId
      );
      lastDeduplicationKey = deduplicationKey;

      // Check deduplication (bypassed in dry run)
      if (!isDryRun && rule.deduplicationWindowHours) {
        const isDuplicate = await automationActionService.isDuplicateExecution(
          organisationId,
          deduplicationKey,
          rule.deduplicationWindowHours
        );
        if (isDuplicate) {
          actionsTaken.push({
            actionType: 'schedule_recheck',
            targetId: entity.entityId,
            targetType: entity.entityType,
            status: 'skipped',
            summary: `Skipped duplicate execution inside ${rule.deduplicationWindowHours}h window`
          });
          continue;
        }
      }

      // Execute each configured action on the matched entity
      for (const action of rule.actions) {
        actionsAttempted += 1;
        const result = await automationActionService.executeAction(
          organisationId,
          rule,
          action,
          entity,
          `exec_${Date.now()}`,
          actorId,
          isDryRun
        );

        actionsTaken.push(result);
        if (result.status === 'success') {
          actionsCompleted += 1;
        } else if (result.status === 'failed') {
          actionsFailed += 1;
        }
      }
    }

    // Determine execution status
    let status: ExecutionStatus = 'completed';
    if (actionsAttempted === 0) {
      status = 'completed';
    } else if (actionsFailed > 0 && actionsCompleted > 0) {
      status = 'partially_completed';
    } else if (actionsFailed > 0 && actionsCompleted === 0) {
      status = 'failed';
    }

    // 4. Record execution log
    const execution = await automationExecutionRepository.create(organisationId, actorId, {
      automationRuleId: rule.id,
      ruleName: rule.name,
      ruleCategory: rule.ruleCategory,
      triggeredAt: nowIso,
      triggerEntityType: matchedEntities[0]?.entityType,
      triggerEntityId: matchedEntities[0]?.entityId,
      executionStatus: status,
      actionsAttempted,
      actionsCompleted,
      actionsFailed,
      deduplicationKey: lastDeduplicationKey,
      isDryRun,
      executionDetails: {
        conditionsMatched: matchedEntities.length > 0,
        affectedEntitiesCount: matchedEntities.length,
        actionsTaken
      }
    });

    // 5. Update rule timestamps if not dry-run
    if (!isDryRun) {
      const updates: Partial<AutomationRule> = {
        lastEvaluatedAt: nowIso
      };
      if (actionsCompleted > 0) {
        updates.lastTriggeredAt = nowIso;
      }
      await automationRuleRepository.update(organisationId, actorId, rule.id, updates);

      await auditService.log(
        organisationId,
        actorId,
        'RUN_AUTOMATION_RULE',
        'automationRule',
        rule.id,
        undefined,
        {
          executionId: execution.id,
          matchedCount: matchedEntities.length,
          actionsCompleted,
          status
        }
      );
    }

    return {
      execution,
      matchedCount: matchedEntities.length,
      actionsExecuted: actionsTaken
    };
  },

  /**
   * Evaluates and executes all active rules for an organisation.
   */
  async evaluateAllActiveRules(organisationId: string, actorId: string): Promise<RunRuleResult[]> {
    const activeRules = await automationRuleRepository.getActiveRules(organisationId);
    const results: RunRuleResult[] = [];

    for (const rule of activeRules) {
      try {
        const res = await this.runRule(organisationId, rule.id, actorId, false);
        results.push(res);
      } catch (err) {
        console.error(`Error running automation rule ${rule.id}:`, err);
      }
    }

    return results;
  },

  /**
   * Retries a failed or partially completed automation execution safely.
   */
  async retryExecution(
    organisationId: string,
    executionId: string,
    actorId: string
  ): Promise<RunRuleResult> {
    const original = await automationExecutionRepository.getById(organisationId, executionId);
    if (!original) throw new Error(`Execution not found: ${executionId}`);

    const result = await this.runRule(organisationId, original.automationRuleId, actorId, false);

    await auditService.log(
      organisationId,
      actorId,
      'RETRY_AUTOMATION_EXECUTION',
      'automationExecution',
      executionId,
      undefined,
      { newExecutionId: result.execution.id, status: result.execution.executionStatus }
    );

    return result;
  },

  /**
   * Retrieves summary statistics for automation overview.
   */
  async getAutomationOverviewStats(organisationId: string): Promise<{
    activeRulesCount: number;
    disabledRulesCount: number;
    runsTodayCount: number;
    actionsTriggeredTodayCount: number;
    openAutomationFollowUpsCount: number;
    notificationsPendingCount: number;
    failedRunsCount: number;
    rulesRequiringAttention: AutomationRule[];
    recentExecutions: AutomationExecution[];
  }> {
    const [allRules, executions, followUps, notifications] = await Promise.all([
      automationRuleRepository.getByOrganisation(organisationId),
      automationExecutionRepository.getRecentExecutions(organisationId, 50),
      followUpRepository.getByOrganisation(organisationId),
      notificationRepository.getByOrganisation(organisationId)
    ]);

    const activeRulesCount = allRules.filter(r => r.ruleStatus === 'active').length;
    const disabledRulesCount = allRules.filter(r => r.ruleStatus === 'disabled' || r.ruleStatus === 'paused').length;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayRuns = executions.filter(e => e.triggeredAt.startsWith(todayStr));
    const actionsTriggeredTodayCount = todayRuns.reduce((sum, e) => sum + (e.actionsCompleted || 0), 0);
    const failedRunsCount = executions.filter(e => e.executionStatus === 'failed').length;

    const openAutomationFollowUpsCount = followUps.filter(
      f => f.followUpStatus === 'open' && (f.description?.includes('Automation') || f.subject?.includes('[Auto]'))
    ).length;

    const notificationsPendingCount = notifications.filter(n => n.notificationStatus === 'unread').length;

    // Rules requiring attention: rules that have had failures in recent runs
    const failedRuleIds = new Set(executions.filter(e => e.executionStatus === 'failed').map(e => e.automationRuleId));
    const rulesRequiringAttention = allRules.filter(r => failedRuleIds.has(r.id));

    return {
      activeRulesCount,
      disabledRulesCount,
      runsTodayCount: todayRuns.length,
      actionsTriggeredTodayCount,
      openAutomationFollowUpsCount,
      notificationsPendingCount,
      failedRunsCount,
      rulesRequiringAttention,
      recentExecutions: executions
    };
  }
};
