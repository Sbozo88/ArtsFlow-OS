import { automationRuleRepository } from '../../repositories/automationRuleRepository';
import { auditService } from '../auditService';
import { organisationSettingsService } from '../organisationSettingsService';
import type { 
  AutomationRule, 
  RuleCategory, 
  RuleStatus, 
  TriggerType, 
  TriggerConfig, 
  ConditionPredicate, 
  AutomationAction, 
  RulePriority 
} from '../../types';

export interface CreateRuleInput {
  name: string;
  description?: string;
  ruleCategory: RuleCategory;
  triggerType: TriggerType;
  triggerConfig: TriggerConfig;
  conditions: ConditionPredicate[];
  actions: AutomationAction[];
  priority: RulePriority;
  cooldownMinutes?: number;
  deduplicationWindowHours?: number;
  ruleStatus?: RuleStatus;
}

export interface RuleTemplate {
  templateId: string;
  name: string;
  description: string;
  ruleCategory: RuleCategory;
  triggerType: TriggerType;
  triggerConfig: TriggerConfig;
  conditions: ConditionPredicate[];
  actions: AutomationAction[];
  priority: RulePriority;
  cooldownMinutes: number;
  deduplicationWindowHours: number;
}

export const BUILT_IN_TEMPLATES: RuleTemplate[] = [
  {
    templateId: 'tpl-attendance-consecutive',
    name: 'Attendance — 3 Consecutive Absences',
    description: 'Creates a high-priority attendance follow-up and notifies responsible staff when a learner misses 3 consecutive sessions.',
    ruleCategory: 'attendance',
    triggerType: 'pattern_detected',
    triggerConfig: { consecutiveCount: 3 },
    conditions: [],
    actions: [
      {
        actionType: 'create_follow_up',
        category: 'attendance',
        priority: 'high',
        dueDaysFromNow: 3,
        titleTemplate: 'Consecutive Absences: {{learnerName}}',
        messageTemplate: 'Learner {{learnerName}} has missed 3 consecutive sessions. Immediate guardian engagement recommended.'
      },
      {
        actionType: 'create_notification',
        target: 'owner',
        priority: 'high',
        titleTemplate: 'Chronic Absence Alert: {{learnerName}}',
        messageTemplate: 'Learner {{learnerName}} has missed 3 consecutive sessions in {{groupName}}.'
      }
    ],
    priority: 'high',
    cooldownMinutes: 1440, // 24 hours
    deduplicationWindowHours: 72 // 3 days
  },
  {
    templateId: 'tpl-attendance-low-group',
    name: 'Attendance — Group Rate Below 75%',
    description: 'Generates an operational alert and notifies teacher when overall group attendance drops below 75% across at least 4 sessions.',
    ruleCategory: 'attendance',
    triggerType: 'threshold_reached',
    triggerConfig: { thresholdPercent: 75, minSessions: 4 },
    conditions: [],
    actions: [
      {
        actionType: 'create_operational_alert',
        priority: 'urgent',
        titleTemplate: 'Low Group Attendance: {{groupName}} ({{rate}}%)',
        messageTemplate: 'Attendance has dropped to {{rate}}% across {{sessionsHeld}} sessions.'
      },
      {
        actionType: 'create_notification',
        target: 'owner',
        priority: 'urgent',
        titleTemplate: 'Low Attendance Alert: {{groupName}}',
        messageTemplate: 'Your group attendance is below 75%. Please review session registers.'
      }
    ],
    priority: 'urgent',
    cooldownMinutes: 2880, // 48 hours
    deduplicationWindowHours: 168 // 7 days
  },
  {
    templateId: 'tpl-finance-overdue-invoice',
    name: 'Finance — Overdue Invoice Follow-Up',
    description: 'Creates a payment follow-up and prepares a reminder draft when an invoice is 1 day overdue.',
    ruleCategory: 'finance',
    triggerType: 'date_reached',
    triggerConfig: { overdueDays: 1 },
    conditions: [],
    actions: [
      {
        actionType: 'create_follow_up',
        category: 'payment',
        priority: 'normal',
        dueDaysFromNow: 5,
        titleTemplate: 'Payment Follow-Up: Invoice #{{invoiceNumber}}',
        messageTemplate: 'Invoice #{{invoiceNumber}} is overdue. Balance: {{balance}}.'
      },
      {
        actionType: 'create_notification',
        target: 'finance',
        priority: 'normal',
        titleTemplate: 'Overdue Invoice #{{invoiceNumber}}',
        messageTemplate: 'Invoice #{{invoiceNumber}} has passed due date.'
      }
    ],
    priority: 'normal',
    cooldownMinutes: 1440,
    deduplicationWindowHours: 168
  },
  {
    templateId: 'tpl-finance-urgent-arrears',
    name: 'Finance — 30-Day Arrears Escalation',
    description: 'Escalates payment follow-up to urgent and notifies finance manager when an invoice remains unpaid for 30 days.',
    ruleCategory: 'finance',
    triggerType: 'date_reached',
    triggerConfig: { overdueDays: 30 },
    conditions: [],
    actions: [
      {
        actionType: 'create_follow_up',
        category: 'payment',
        priority: 'urgent',
        dueDaysFromNow: 3,
        titleTemplate: 'URGENT: 30-Day Arrears Invoice #{{invoiceNumber}}',
        messageTemplate: 'Invoice is 30 days overdue. Immediate contact required.'
      },
      {
        actionType: 'create_notification',
        target: 'finance',
        priority: 'urgent',
        titleTemplate: 'Urgent Arrears: Invoice #{{invoiceNumber}}',
        messageTemplate: 'Invoice is 30+ days overdue.'
      }
    ],
    priority: 'urgent',
    cooldownMinutes: 2880,
    deduplicationWindowHours: 336
  },
  {
    templateId: 'tpl-consent-7-day-reminder',
    name: 'Consent — 7-Day Event Reminder',
    description: 'Prepares reminder communications and notifies event staff for unsubmitted consent requests 7 days before an event.',
    ruleCategory: 'consent',
    triggerType: 'date_approaching',
    triggerConfig: { daysBefore: 7 },
    conditions: [],
    actions: [
      {
        actionType: 'prepare_communication',
        channel: 'sms',
        titleTemplate: 'Consent Reminder: {{eventName}}',
        messageTemplate: 'Friendly reminder to submit consent for {{eventName}} taking place on {{eventDate}}.'
      },
      {
        actionType: 'create_notification',
        target: 'owner',
        priority: 'normal',
        titleTemplate: 'Pending Consent for {{eventName}}',
        messageTemplate: 'Consent submission deadline is in 7 days.'
      }
    ],
    priority: 'normal',
    cooldownMinutes: 2880,
    deduplicationWindowHours: 120
  },
  {
    templateId: 'tpl-consent-2-day-urgent',
    name: 'Consent — 2-Day Urgent Escalation',
    description: 'Flags urgent missing consent 2 days before an event and notifies programme director.',
    ruleCategory: 'consent',
    triggerType: 'date_approaching',
    triggerConfig: { daysBefore: 2 },
    conditions: [],
    actions: [
      {
        actionType: 'create_follow_up',
        category: 'consent',
        priority: 'urgent',
        dueDaysFromNow: 1,
        titleTemplate: 'URGENT Consent: {{recipientName}} for {{eventName}}',
        messageTemplate: 'Event is in 2 days and consent is still pending. Direct phone call needed.'
      },
      {
        actionType: 'create_notification',
        target: 'director',
        priority: 'urgent',
        titleTemplate: 'Urgent Missing Consent: {{eventName}}',
        messageTemplate: 'Event takes place in 48 hours with pending consent.'
      }
    ],
    priority: 'urgent',
    cooldownMinutes: 1440,
    deduplicationWindowHours: 48
  },
  {
    templateId: 'tpl-event-readiness-7-day',
    name: 'Event — 7-Day Readiness Verification',
    description: 'Evaluates 6 dimensions of event readiness 7 days before event and alerts the event coordinator of critical gaps.',
    ruleCategory: 'event',
    triggerType: 'date_approaching',
    triggerConfig: { daysBefore: 7 },
    conditions: [],
    actions: [
      {
        actionType: 'create_operational_alert',
        priority: 'urgent',
        titleTemplate: 'Event Readiness: {{eventName}}',
        messageTemplate: 'Readiness check identified unresolved preparation gaps.'
      },
      {
        actionType: 'create_notification',
        target: 'owner',
        priority: 'urgent',
        titleTemplate: 'Readiness Check: {{eventName}}',
        messageTemplate: 'Your upcoming event has readiness deficiencies requiring review.'
      }
    ],
    priority: 'urgent',
    cooldownMinutes: 1440,
    deduplicationWindowHours: 72
  },
  {
    templateId: 'tpl-transport-capacity-exceeded',
    name: 'Transport — Vehicle Capacity Overflow',
    description: 'Generates a critical operational alert and immediately notifies logistics coordinator when assigned passengers exceed vehicle capacity.',
    ruleCategory: 'transport',
    triggerType: 'threshold_reached',
    triggerConfig: {},
    conditions: [],
    actions: [
      {
        actionType: 'create_operational_alert',
        priority: 'urgent',
        titleTemplate: 'CRITICAL: Transport Capacity Exceeded on {{planName}}',
        messageTemplate: 'Vehicle capacity is exceeded by assigned passengers. Immediate reallocation required.'
      },
      {
        actionType: 'create_notification',
        target: 'admin',
        priority: 'urgent',
        titleTemplate: 'Transport Over-Capacity Alert',
        messageTemplate: 'Vehicle capacity exceeded for {{planName}}.'
      }
    ],
    priority: 'urgent',
    cooldownMinutes: 360,
    deduplicationWindowHours: 24
  },
  {
    templateId: 'tpl-instrument-overdue-return',
    name: 'Instruments — Overdue Asset Return',
    description: 'Creates an instrument follow-up and notifies the music teacher when an allocated instrument passes its scheduled return date.',
    ruleCategory: 'instrument',
    triggerType: 'date_reached',
    triggerConfig: {},
    conditions: [],
    actions: [
      {
        actionType: 'create_follow_up',
        category: 'instrument',
        priority: 'normal',
        dueDaysFromNow: 3,
        titleTemplate: 'Overdue Instrument Return',
        messageTemplate: 'Allocated instrument return due date has passed. Please contact learner/guardian.'
      },
      {
        actionType: 'create_notification',
        target: 'owner',
        priority: 'normal',
        titleTemplate: 'Overdue Instrument Alert',
        messageTemplate: 'An allocated instrument is past its scheduled return date.'
      }
    ],
    priority: 'normal',
    cooldownMinutes: 1440,
    deduplicationWindowHours: 168
  },
  {
    templateId: 'tpl-costume-overdue-return',
    name: 'Costumes — Overdue Asset Return',
    description: 'Creates a costume follow-up and notifies dance coordinator when a performance costume passes its scheduled return date.',
    ruleCategory: 'costume',
    triggerType: 'date_reached',
    triggerConfig: {},
    conditions: [],
    actions: [
      {
        actionType: 'create_follow_up',
        category: 'general',
        priority: 'normal',
        dueDaysFromNow: 3,
        titleTemplate: 'Overdue Costume Return',
        messageTemplate: 'Allocated dance costume return due date has passed.'
      },
      {
        actionType: 'create_notification',
        target: 'owner',
        priority: 'normal',
        titleTemplate: 'Overdue Costume Alert',
        messageTemplate: 'An allocated costume is past its scheduled return date.'
      }
    ],
    priority: 'normal',
    cooldownMinutes: 1440,
    deduplicationWindowHours: 168
  },
  {
    templateId: 'tpl-followup-overdue-task',
    name: 'Follow-Up — Overdue Task Escalation',
    description: 'Notifies task owner and programme director when an open follow-up task passes its scheduled due date.',
    ruleCategory: 'follow_up',
    triggerType: 'date_reached',
    triggerConfig: {},
    conditions: [],
    actions: [
      {
        actionType: 'create_notification',
        target: 'owner',
        priority: 'urgent',
        titleTemplate: 'Overdue Task: {{title}}',
        messageTemplate: 'Follow-up task is past its due date. Please update or complete.'
      }
    ],
    priority: 'urgent',
    cooldownMinutes: 1440,
    deduplicationWindowHours: 48
  },
  {
    templateId: 'tpl-comm-delivery-failure',
    name: 'Communication — Delivery Failure Alert',
    description: 'Alerts message sender and creates attention item when an outgoing SMS or Email delivery fails.',
    ruleCategory: 'communication',
    triggerType: 'status_changed',
    triggerConfig: { targetStatus: 'failed' },
    conditions: [],
    actions: [
      {
        actionType: 'create_notification',
        target: 'admin',
        priority: 'normal',
        titleTemplate: 'Message Delivery Failure',
        messageTemplate: 'An outgoing message failed to deliver to recipient.'
      }
    ],
    priority: 'normal',
    cooldownMinutes: 360,
    deduplicationWindowHours: 24
  }
];

export const automationRuleService = {
  /**
   * Retrieves all automation rules for an organisation.
   */
  async getRules(organisationId: string, filterCategory?: RuleCategory): Promise<AutomationRule[]> {
    const all = await automationRuleRepository.getByOrganisation(organisationId);
    return all.filter(r => {
      if (r.status === 'deleted') return false;
      if (filterCategory && r.ruleCategory !== filterCategory) return false;
      return true;
    });
  },

  /**
   * Retrieves a single automation rule by ID.
   */
  async getRuleById(organisationId: string, ruleId: string): Promise<AutomationRule | null> {
    return automationRuleRepository.getById(organisationId, ruleId);
  },

  /**
   * Creates a custom automation rule.
   */
  async createRule(organisationId: string, actorId: string, input: CreateRuleInput): Promise<AutomationRule> {
    const rule = await automationRuleRepository.create(organisationId, actorId, {
      name: input.name.trim(),
      description: input.description?.trim(),
      ruleCategory: input.ruleCategory,
      triggerType: input.triggerType,
      triggerConfig: input.triggerConfig || {},
      conditions: input.conditions || [],
      actions: input.actions || [],
      priority: input.priority || 'normal',
      ruleStatus: input.ruleStatus || 'active',
      cooldownMinutes: input.cooldownMinutes || 1440,
      deduplicationWindowHours: input.deduplicationWindowHours || 24
    });

    await auditService.log(
      organisationId,
      actorId,
      'CREATE_AUTOMATION_RULE',
      'automationRule',
      rule.id,
      undefined,
      rule
    );

    return rule;
  },

  /**
   * Updates an existing automation rule.
   */
  async updateRule(
    organisationId: string,
    ruleId: string,
    actorId: string,
    updates: Partial<CreateRuleInput>
  ): Promise<void> {
    const before = await automationRuleRepository.getById(organisationId, ruleId);
    if (!before) throw new Error('Rule not found');

    await automationRuleRepository.update(organisationId, actorId, ruleId, updates);

    await auditService.log(
      organisationId,
      actorId,
      'UPDATE_AUTOMATION_RULE',
      'automationRule',
      ruleId,
      before,
      updates
    );
  },

  /**
   * Activates / enables an automation rule.
   */
  async enableRule(organisationId: string, ruleId: string, actorId: string): Promise<void> {
    await automationRuleRepository.update(organisationId, actorId, ruleId, { ruleStatus: 'active' });
    await auditService.log(
      organisationId,
      actorId,
      'ENABLE_AUTOMATION_RULE',
      'automationRule',
      ruleId
    );
  },

  /**
   * Pauses an automation rule.
   */
  async pauseRule(organisationId: string, ruleId: string, actorId: string): Promise<void> {
    await automationRuleRepository.update(organisationId, actorId, ruleId, { ruleStatus: 'paused' });
    await auditService.log(
      organisationId,
      actorId,
      'PAUSE_AUTOMATION_RULE',
      'automationRule',
      ruleId
    );
  },

  /**
   * Disables an automation rule.
   */
  async disableRule(organisationId: string, ruleId: string, actorId: string): Promise<void> {
    await automationRuleRepository.update(organisationId, actorId, ruleId, { ruleStatus: 'disabled' });
    await auditService.log(
      organisationId,
      actorId,
      'DISABLE_AUTOMATION_RULE',
      'automationRule',
      ruleId
    );
  },

  /**
   * Archives an automation rule.
   */
  async archiveRule(organisationId: string, ruleId: string, actorId: string): Promise<void> {
    await automationRuleRepository.update(organisationId, actorId, ruleId, { 
      ruleStatus: 'archived'
    });
    await automationRuleRepository.archive(organisationId, actorId, ruleId);
    await auditService.log(
      organisationId,
      actorId,
      'ARCHIVE_AUTOMATION_RULE',
      'automationRule',
      ruleId
    );
  },

  /**
   * Returns list of built-in templates.
   */
  getTemplates(): RuleTemplate[] {
    return BUILT_IN_TEMPLATES;
  },

  /**
   * Instantiates a built-in template into an active rule for the organisation.
   */
  async instantiateTemplate(
    organisationId: string,
    templateId: string,
    actorId: string,
    initialStatus: RuleStatus = 'active'
  ): Promise<AutomationRule> {
    const tpl = BUILT_IN_TEMPLATES.find(t => t.templateId === templateId);
    if (!tpl) throw new Error(`Template not found: ${templateId}`);

    return this.createRule(organisationId, actorId, {
      name: tpl.name,
      description: tpl.description,
      ruleCategory: tpl.ruleCategory,
      triggerType: tpl.triggerType,
      triggerConfig: tpl.triggerConfig,
      conditions: tpl.conditions,
      actions: tpl.actions,
      priority: tpl.priority,
      cooldownMinutes: tpl.cooldownMinutes,
      deduplicationWindowHours: tpl.deduplicationWindowHours,
      ruleStatus: initialStatus
    });
  },

  /**
   * Installs recommended automation rules using organisation-configured thresholds and defaults.
   */
  async installRecommendedRules(organisationId: string, actorId: string): Promise<AutomationRule[]> {
    const settings = await organisationSettingsService.getSettings(organisationId);
    const existingRules = await this.getRules(organisationId);
    const existingNames = new Set(existingRules.map(r => r.name.toLowerCase()));

    const installed: AutomationRule[] = [];
    const defaultStatus: RuleStatus = settings.automation.dryRunNewRulesByDefault ? 'paused' : 'active';
    const cooldown = (settings.automation.defaultCooldownHours || 24) * 60;

    for (const tpl of BUILT_IN_TEMPLATES) {
      if (existingNames.has(tpl.name.toLowerCase())) {
        continue; // Skip already installed
      }

      // Clone trigger config and adapt to settings
      const triggerConfig = { ...tpl.triggerConfig };
      if (tpl.templateId === 'tpl-attendance-consecutive') {
        triggerConfig.consecutiveCount = settings.attendance.consecutiveAbsenceThreshold;
      } else if (tpl.templateId === 'tpl-attendance-low-group') {
        triggerConfig.thresholdPercent = settings.attendance.lowAttendanceThresholdPercent;
      }

      const rule = await this.createRule(organisationId, actorId, {
        name: tpl.name,
        description: tpl.description,
        ruleCategory: tpl.ruleCategory,
        triggerType: tpl.triggerType,
        triggerConfig,
        conditions: tpl.conditions,
        actions: tpl.actions,
        priority: tpl.priority,
        cooldownMinutes: cooldown,
        deduplicationWindowHours: tpl.deduplicationWindowHours,
        ruleStatus: defaultStatus
      });

      installed.push(rule);
    }

    return installed;
  }
};
