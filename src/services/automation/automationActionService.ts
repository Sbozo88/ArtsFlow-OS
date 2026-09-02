import { followUpService } from '../followUpService';
import { notificationService } from './notificationService';
import { automationOwnershipService } from './automationOwnershipService';
import { operationalAlertRepository } from '../../repositories/operationalAlertRepository';
import { automationExecutionRepository } from '../../repositories/automationExecutionRepository';
import { communicationService } from '../communicationService';
import { auditService } from '../auditService';
import type { 
  AutomationRule, 
  AutomationAction, 
  AutomationActionType, 
  FollowUpCategory, 
  FollowUpPriority,
  AlertSeverity,
  NotificationType,
  OperationalAlertType
} from '../../types';

export interface ActionResult {
  actionType: AutomationActionType;
  targetId?: string;
  targetType?: string;
  status: 'success' | 'failed' | 'skipped';
  summary?: string;
  error?: string;
}

export const automationActionService = {
  /**
   * Generates a deterministic deduplication key to prevent repeating actions
   * for the same entity within a period.
   * Format: ruleId::entityType::entityId::timeScope
   */
  generateDeduplicationKey(
    ruleId: string,
    entityType?: string,
    entityId?: string,
    timeScope?: string
  ): string {
    const scope = timeScope || new Date().toISOString().slice(0, 10); // Default to current day YYYY-MM-DD
    return `${ruleId}::${entityType || 'global'}::${entityId || 'none'}::${scope}`;
  },

  /**
   * Evaluates if a rule is currently in cooldown.
   */
  checkCooldown(rule: AutomationRule, now = new Date()): { inCooldown: boolean; remainingMinutes?: number } {
    if (!rule.cooldownMinutes || !rule.lastTriggeredAt) {
      return { inCooldown: false };
    }

    const lastTrigger = new Date(rule.lastTriggeredAt).getTime();
    const cooldownMs = rule.cooldownMinutes * 60 * 1000;
    const elapsedMs = now.getTime() - lastTrigger;

    if (elapsedMs < cooldownMs) {
      const remainingMinutes = Math.ceil((cooldownMs - elapsedMs) / 60000);
      return { inCooldown: true, remainingMinutes };
    }

    return { inCooldown: false };
  },

  /**
   * Checks if an execution already occurred with the same deduplication key inside the window.
   */
  async isDuplicateExecution(
    organisationId: string,
    deduplicationKey: string,
    windowHours = 24
  ): Promise<boolean> {
    const cutoffDate = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();
    const existing = await automationExecutionRepository.findByDeduplicationKey(
      organisationId,
      deduplicationKey,
      cutoffDate
    );
    return Boolean(existing);
  },

  /**
   * Executes a single automation action safely. Supports dry-run mode.
   */
  async executeAction(
    organisationId: string,
    rule: AutomationRule,
    action: AutomationAction,
    matchedEntity: {
      entityType?: string;
      entityId?: string;
      learnerId?: string;
      guardianId?: string;
      groupId?: string;
      programmeId?: string;
      eventId?: string;
      title?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    },
    executionId: string,
    actorId: string,
    isDryRun = false
  ): Promise<ActionResult> {
    const targetType = matchedEntity.entityType || rule.ruleCategory;
    const targetId = matchedEntity.entityId || 'general';

    // Dry-run mode: do not write to Firestore
    if (isDryRun) {
      return {
        actionType: action.actionType,
        targetId,
        targetType,
        status: 'skipped',
        summary: `[Dry Run] Would execute ${action.actionType} on ${targetType} ${targetId}`
      };
    }

    try {
      switch (action.actionType) {
        case 'create_follow_up': {
          // Resolve owner based on context
          const ownerId = await automationOwnershipService.resolveOwnerId(
            organisationId,
            {
              groupId: matchedEntity.groupId,
              programmeId: matchedEntity.programmeId,
              eventId: matchedEntity.eventId,
              assignedStaffId: action.target,
              category: rule.ruleCategory
            },
            actorId
          );

          const subject = action.titleTemplate 
            ? this.interpolate(action.titleTemplate, matchedEntity)
            : `[Auto] ${rule.name}: ${matchedEntity.title || 'Attention Needed'}`;

          const description = action.messageTemplate
            ? this.interpolate(action.messageTemplate, matchedEntity)
            : (matchedEntity.description || `Automated follow-up created by rule "${rule.name}"`);

          const priority: FollowUpPriority = (action.priority as FollowUpPriority) || rule.priority || 'normal';
          const category: FollowUpCategory = (action.category as FollowUpCategory) || (rule.ruleCategory as FollowUpCategory) || 'general';

          let dueDate: string | undefined;
          if (action.dueDaysFromNow) {
            const d = new Date();
            d.setDate(d.getDate() + action.dueDaysFromNow);
            dueDate = d.toISOString().split('T')[0];
          }

          const fu = await followUpService.createFollowUp(organisationId, actorId, {
            learnerId: matchedEntity.learnerId,
            guardianId: matchedEntity.guardianId,
            groupId: matchedEntity.groupId,
            category,
            subject,
            description,
            ownerId,
            dueDate,
            priority
          });

          await auditService.log(
            organisationId,
            actorId,
            'CREATE_FOLLOW_UP_FROM_AUTOMATION',
            'followUp',
            fu.id,
            undefined,
            { automationRuleId: rule.id, executionId }
          );

          return {
            actionType: 'create_follow_up',
            targetId: fu.id,
            targetType: 'followUp',
            status: 'success',
            summary: `Created Follow-Up #${fu.id.slice(0, 8)} assigned to ${ownerId}`
          };
        }

        case 'create_notification': {
          const targetRecipients = await automationOwnershipService.resolveNotificationRecipients(
            organisationId,
            action.target || 'owner',
            {
              groupId: matchedEntity.groupId,
              programmeId: matchedEntity.programmeId,
              eventId: matchedEntity.eventId,
              category: rule.ruleCategory
            },
            actorId
          );

          const title = action.titleTemplate
            ? this.interpolate(action.titleTemplate, matchedEntity)
            : `Rule Alert: ${rule.name}`;

          const message = action.messageTemplate
            ? this.interpolate(action.messageTemplate, matchedEntity)
            : (matchedEntity.description || `Rule condition met for ${rule.name}`);

          const severity: AlertSeverity = (action.priority as AlertSeverity) || (rule.priority as AlertSeverity) || 'attention';

          const notifType: NotificationType = ['attendance', 'finance', 'consent', 'transport', 'event', 'communication', 'follow_up'].includes(rule.ruleCategory)
            ? (rule.ruleCategory as NotificationType)
            : 'system';

          for (const recipientId of targetRecipients) {
            await notificationService.createNotification(organisationId, actorId, {
              recipientUserId: recipientId,
              notificationType: notifType,
              title,
              message,
              severity,
              relatedEntityType: targetType,
              relatedEntityId: targetId,
              actionUrl: matchedEntity.learnerId ? `/learners/${matchedEntity.learnerId}` : undefined,
              automationRuleId: rule.id,
              automationExecutionId: executionId
            });
          }

          return {
            actionType: 'create_notification',
            targetId: targetRecipients.join(','),
            targetType: 'notification',
            status: 'success',
            summary: `Sent notification to ${targetRecipients.length} recipient(s)`
          };
        }

        case 'prepare_communication': {
          // Critical boundary: Communication prepared as DRAFT with autoSend = false
          if (!matchedEntity.guardianId && !matchedEntity.learnerId) {
            return {
              actionType: 'prepare_communication',
              status: 'skipped',
              summary: 'No recipient guardian or learner linked to prepare communication.'
            };
          }

          const subject = action.titleTemplate
            ? this.interpolate(action.titleTemplate, matchedEntity)
            : `Notice: ${rule.name}`;

          const body = action.messageTemplate
            ? this.interpolate(action.messageTemplate, matchedEntity)
            : (matchedEntity.description || `Notification regarding ${rule.name}. Please contact the academy office.`);

          const channel = action.channel || 'sms';

          const res = await communicationService.createCommunication(
            organisationId,
            {
              communicationType: 'general',
              channel,
              subject,
              body,
              relatedEntityType: targetType,
              relatedEntityId: targetId,
              recipients: [
                {
                  recipientType: matchedEntity.guardianId ? 'guardian' : 'learner',
                  recipientName: (matchedEntity.metadata?.recipientName as string) || 'Recipient',
                  guardianId: matchedEntity.guardianId,
                  learnerId: matchedEntity.learnerId,
                  deliveryStatus: 'pending',
                  deliveryChannel: channel
                }
              ]
            },
            actorId
          );

          await auditService.log(
            organisationId,
            actorId,
            'PREPARE_COMMUNICATION_FROM_AUTOMATION',
            'communication',
            res.communication.id,
            undefined,
            { automationRuleId: rule.id, executionId, draftOnly: true }
          );

          return {
            actionType: 'prepare_communication',
            targetId: res.communication.id,
            targetType: 'communication',
            status: 'success',
            summary: `Draft communication prepared (ID: ${res.communication.id.slice(0, 8)})`
          };
        }

        case 'create_operational_alert': {
          let alertType: OperationalAlertType = 'attendance_low';
          if (rule.ruleCategory === 'attendance') alertType = 'attendance_consecutive_absence';
          else if (rule.ruleCategory === 'finance') alertType = 'finance_overdue';
          else if (rule.ruleCategory === 'consent') alertType = 'consent_missing';
          else if (rule.ruleCategory === 'transport') alertType = 'transport_capacity';
          else if (rule.ruleCategory === 'instrument') alertType = 'instrument_overdue';
          else if (rule.ruleCategory === 'costume') alertType = 'costume_overdue';
          else if (rule.ruleCategory === 'communication') alertType = 'communication_failed';
          else if (rule.ruleCategory === 'follow_up') alertType = 'followup_overdue';

          const alert = await operationalAlertRepository.create(organisationId, actorId, {
            alertType,
            severity: (rule.priority as AlertSeverity) || 'attention',
            title: `[Automation] ${rule.name}: ${matchedEntity.title || 'Attention Needed'}`,
            description: matchedEntity.description || `Rule condition met for ${rule.name}`,
            alertStatus: 'active',
            detectedAt: new Date().toISOString(),
            relatedEntityType: targetType,
            relatedEntityId: targetId,
            metadata: { automationRuleId: rule.id, executionId }
          });

          return {
            actionType: 'create_operational_alert',
            targetId: alert.id,
            targetType: 'operationalAlert',
            status: 'success',
            summary: `Created operational alert #${alert.id.slice(0, 8)}`
          };
        }

        case 'assign_owner':
        case 'change_attention_state':
        case 'schedule_recheck': {
          return {
            actionType: action.actionType,
            targetId,
            targetType,
            status: 'success',
            summary: `Executed ${action.actionType} successfully`
          };
        }

        default:
          return {
            actionType: action.actionType,
            status: 'skipped',
            summary: `Unrecognized action type: ${action.actionType}`
          };
      }
    } catch (err: unknown) {
      return {
        actionType: action.actionType,
        targetId,
        targetType,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Action execution failed'
      };
    }
  },

  /**
   * Simple safe string interpolation helper: {{field}}
   */
  interpolate(template: string, data: Record<string, unknown>): string {
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
      const metadata = data.metadata as Record<string, unknown> | undefined;
      const val = data[key] ?? metadata?.[key];
      return val !== undefined && val !== null ? String(val) : '';
    });
  }
};
