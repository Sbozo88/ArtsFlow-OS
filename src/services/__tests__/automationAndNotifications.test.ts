import { describe, it, expect, vi, beforeEach } from 'vitest';
import { automationActionService } from '../automation/automationActionService';
import { automationEvaluationService } from '../automation/automationEvaluationService';
import { automationExecutionService } from '../automation/automationExecutionService';
import { automationOwnershipService } from '../automation/automationOwnershipService';
import { notificationService } from '../automation/notificationService';
import { automationRuleService } from '../automation/automationRuleService';
import { automationRuleRepository } from '../../repositories/automationRuleRepository';
import { automationExecutionRepository } from '../../repositories/automationExecutionRepository';
import { notificationRepository } from '../../repositories/notificationRepository';
import { staffRepository } from '../../repositories/staffRepository';
import { programmeGroupRepository } from '../../repositories/programmeGroupRepository';
import { attendanceRepository } from '../../repositories/attendanceRepository';
import { sessionRepository } from '../../repositories/sessionRepository';
import { learnerRepository } from '../../repositories/learnerRepository';
import { invoiceRepository } from '../../repositories/invoiceRepository';
import { paymentRepository } from '../../repositories/paymentRepository';
import { followUpService } from '../followUpService';
import { auditService } from '../auditService';
import type { 
  AutomationRule, 
  AutomationExecution, 
  Staff, 
  ProgrammeGroup, 
  Learner, 
  Invoice, 
  Session, 
  Attendance, 
  FollowUp,
  AppNotification
} from '../../types';

describe('Phase 5B: Workflow Automation & Notifications Tests', () => {
  const orgId = 'org-artsflow-5b';
  const actorId = 'user-admin-test';

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(auditService, 'log').mockResolvedValue(undefined);
  });

  describe('1. Cooldown, Deduplication and Safety Boundaries', () => {
    it('generates deterministic deduplication keys based on rule, entity and scope', () => {
      const key1 = automationActionService.generateDeduplicationKey('rule-1', 'learner', 'lrn-100', '2026-09-02');
      const key2 = automationActionService.generateDeduplicationKey('rule-1', 'learner', 'lrn-100', '2026-09-02');
      const keyDiff = automationActionService.generateDeduplicationKey('rule-1', 'learner', 'lrn-101', '2026-09-02');

      expect(key1).toBe('rule-1::learner::lrn-100::2026-09-02');
      expect(key1).toBe(key2);
      expect(key1).not.toBe(keyDiff);
    });

    it('correctly calculates cooldown active status and remaining minutes', () => {
      const rule: AutomationRule = {
        id: 'rule-test',
        organisationId: orgId,
        name: 'Cooldown Test',
        ruleCategory: 'attendance',
        triggerType: 'pattern_detected',
        triggerConfig: {},
        conditions: [],
        actions: [],
        priority: 'high',
        ruleStatus: 'active',
        cooldownMinutes: 60,
        lastTriggeredAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      const check = automationActionService.checkCooldown(rule, new Date());
      expect(check.inCooldown).toBe(true);
      expect(check.remainingMinutes).toBe(40);
    });

    it('reports cooldown as false when cooldown minutes have elapsed', () => {
      const rule: AutomationRule = {
        id: 'rule-test',
        organisationId: orgId,
        name: 'Cooldown Test',
        ruleCategory: 'attendance',
        triggerType: 'pattern_detected',
        triggerConfig: {},
        conditions: [],
        actions: [],
        priority: 'high',
        ruleStatus: 'active',
        cooldownMinutes: 60,
        lastTriggeredAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 90 mins ago
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      const check = automationActionService.checkCooldown(rule, new Date());
      expect(check.inCooldown).toBe(false);
    });
  });

  describe('2. Ownership Escalation & Role Resolution', () => {
    it('resolves group teacher as primary owner for group attendance', async () => {
      const mockStaff = [
        { id: 'staff-teacher-1', role: 'teacher', staffStatus: 'active' },
        { id: 'staff-director-1', role: 'programme_director', staffStatus: 'active' },
        { id: 'staff-admin-1', role: 'admin', staffStatus: 'active' }
      ] as Staff[];

      const mockGroups = [
        { id: 'grp-violin-1', teacherId: 'staff-teacher-1', groupStatus: 'active' }
      ] as ProgrammeGroup[];

      vi.spyOn(staffRepository, 'getByOrganisation').mockResolvedValue(mockStaff);
      vi.spyOn(programmeGroupRepository, 'getByOrganisation').mockResolvedValue(mockGroups);

      const ownerId = await automationOwnershipService.resolveOwnerId(orgId, {
        groupId: 'grp-violin-1',
        category: 'attendance'
      });

      expect(ownerId).toBe('staff-teacher-1');
    });

    it('resolves finance staff member for finance category when no group assigned', async () => {
      const mockStaff = [
        { id: 'staff-teacher-1', role: 'teacher', staffStatus: 'active' },
        { id: 'staff-fin-1', role: 'finance_manager', staffStatus: 'active' },
        { id: 'staff-admin-1', role: 'admin', staffStatus: 'active' }
      ] as Staff[];

      vi.spyOn(staffRepository, 'getByOrganisation').mockResolvedValue(mockStaff);

      const ownerId = await automationOwnershipService.resolveOwnerId(orgId, {
        category: 'finance'
      });

      expect(ownerId).toBe('staff-fin-1');
    });

    it('escalates owner to director or admin when requested', async () => {
      const mockStaff = [
        { id: 'staff-teacher-1', role: 'teacher', staffStatus: 'active' },
        { id: 'staff-director-1', role: 'programme_director', staffStatus: 'active' },
        { id: 'staff-admin-1', role: 'admin', staffStatus: 'active' }
      ] as Staff[];

      vi.spyOn(staffRepository, 'getByOrganisation').mockResolvedValue(mockStaff);

      const escalated = await automationOwnershipService.escalateOwner(orgId, 'staff-teacher-1');
      expect(escalated).toBe('staff-director-1');
    });
  });

  describe('3. Rule Evaluation & Deterministic Triggers', () => {
    it('detects 3 consecutive absences and returns matching learner entity', async () => {
      const sessions = [
        { id: 's1', date: '2026-08-01', groupId: 'g1' },
        { id: 's2', date: '2026-08-08', groupId: 'g1' },
        { id: 's3', date: '2026-08-15', groupId: 'g1' },
      ] as Session[];

      const attendance = [
        { sessionId: 's1', learnerId: 'lrn-1', attendanceStatus: 'absent' },
        { sessionId: 's2', learnerId: 'lrn-1', attendanceStatus: 'absent' },
        { sessionId: 's3', learnerId: 'lrn-1', attendanceStatus: 'absent' },
      ] as Attendance[];

      const learners = [
        { id: 'lrn-1', firstName: 'Thabo', lastName: 'Molefe', learnerStatus: 'active' }
      ] as Learner[];

      const groups = [
        { id: 'g1', name: 'Junior Strings', programmeId: 'prog-1' }
      ] as ProgrammeGroup[];

      vi.spyOn(sessionRepository, 'getByOrganisation').mockResolvedValue(sessions);
      vi.spyOn(attendanceRepository, 'getByOrganisation').mockResolvedValue(attendance);
      vi.spyOn(learnerRepository, 'getByOrganisation').mockResolvedValue(learners);
      vi.spyOn(programmeGroupRepository, 'getByOrganisation').mockResolvedValue(groups);

      const rule: AutomationRule = {
        id: 'rule-consecutive-3',
        organisationId: orgId,
        name: '3 Consecutive Absences',
        ruleCategory: 'attendance',
        triggerType: 'pattern_detected',
        triggerConfig: { consecutiveCount: 3 },
        conditions: [],
        actions: [],
        priority: 'high',
        ruleStatus: 'active',
        createdAt: '',
        updatedAt: '',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      const matches = await automationEvaluationService.evaluateRule(orgId, rule);
      expect(matches.length).toBe(1);
      expect(matches[0].learnerId).toBe('lrn-1');
      expect(matches[0].metadata?.consecutiveAbsences).toBe(3);
    });

    it('identifies overdue invoices past the threshold date', async () => {
      const invoices = [
        {
          id: 'inv-101',
          invoiceNumber: 'INV-101',
          learnerId: 'lrn-1',
          dueDate: '2026-08-01', // well in the past
          balance: 50000,
          invoiceStatus: 'issued'
        },
        {
          id: 'inv-102',
          invoiceNumber: 'INV-102',
          learnerId: 'lrn-2',
          dueDate: '2026-12-31', // future
          balance: 50000,
          invoiceStatus: 'issued'
        },
        {
          id: 'inv-103',
          invoiceNumber: 'INV-103',
          learnerId: 'lrn-3',
          dueDate: '2026-08-01',
          balance: 0, // fully paid
          invoiceStatus: 'paid'
        }
      ] as Invoice[];

      vi.spyOn(invoiceRepository, 'getByOrganisation').mockResolvedValue(invoices);
      vi.spyOn(learnerRepository, 'getByOrganisation').mockResolvedValue([
        { id: 'lrn-1', firstName: 'Kabelo', lastName: 'Nkosi' } as Learner
      ]);
      vi.spyOn(paymentRepository, 'getByOrganisation').mockResolvedValue([]);

      const rule: AutomationRule = {
        id: 'rule-overdue-inv',
        organisationId: orgId,
        name: 'Overdue Invoices',
        ruleCategory: 'finance',
        triggerType: 'date_reached',
        triggerConfig: { overdueDays: 1 },
        conditions: [],
        actions: [],
        priority: 'normal',
        ruleStatus: 'active',
        createdAt: '',
        updatedAt: '',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      const matches = await automationEvaluationService.evaluateRule(orgId, rule);
      expect(matches.length).toBe(1);
      expect(matches[0].entityId).toBe('inv-101');
      expect(matches[0].metadata?.invoiceNumber).toBe('INV-101');
    });
  });

  describe('4. Dry-Run Mode and Live Action Safety', () => {
    it('simulates planned actions in dry-run mode without writing to database', async () => {
      const rule: AutomationRule = {
        id: 'rule-dryrun',
        organisationId: orgId,
        name: 'Dry Run Test Rule',
        ruleCategory: 'attendance',
        triggerType: 'pattern_detected',
        triggerConfig: { consecutiveCount: 3 },
        conditions: [],
        actions: [
          {
            actionType: 'create_follow_up',
            category: 'attendance',
            priority: 'high',
            titleTemplate: 'Follow-Up: {{title}}'
          },
          {
            actionType: 'create_notification',
            priority: 'high',
            titleTemplate: 'Alert: {{title}}'
          }
        ],
        priority: 'high',
        ruleStatus: 'active',
        createdAt: '',
        updatedAt: '',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      vi.spyOn(automationRuleRepository, 'getById').mockResolvedValue(rule);
      vi.spyOn(automationEvaluationService, 'evaluateRule').mockResolvedValue([
        {
          entityType: 'learner',
          entityId: 'lrn-1',
          learnerId: 'lrn-1',
          title: '3 Consecutive Absences: Sbozo',
          description: 'Learner missed 3 consecutive classes.'
        }
      ]);

      const createFollowUpSpy = vi.spyOn(followUpService, 'createFollowUp');
      const createNotificationSpy = vi.spyOn(notificationService, 'createNotification');

      vi.spyOn(automationExecutionRepository, 'create').mockImplementation(async (_org, _actor, data) => ({
        id: 'exec-dry-1',
        ...data
      } as AutomationExecution));

      const result = await automationExecutionService.runRule(orgId, 'rule-dryrun', actorId, true); // true = isDryRun

      expect(result.execution.isDryRun).toBe(true);
      expect(result.matchedCount).toBe(1);
      expect(result.actionsExecuted.length).toBe(2);
      expect(result.actionsExecuted[0].status).toBe('skipped');
      expect(result.actionsExecuted[0].summary).toContain('[Dry Run]');

      // Assert no database mutations occurred
      expect(createFollowUpSpy).not.toHaveBeenCalled();
      expect(createNotificationSpy).not.toHaveBeenCalled();
    });

    it('creates follow-ups and notifications with human ownership in live mode', async () => {
      const rule: AutomationRule = {
        id: 'rule-live',
        organisationId: orgId,
        name: 'Live Rule Test',
        ruleCategory: 'attendance',
        triggerType: 'pattern_detected',
        triggerConfig: {},
        conditions: [],
        actions: [
          {
            actionType: 'create_follow_up',
            category: 'attendance',
            priority: 'high',
            titleTemplate: 'Follow-up for {{title}}',
            dueDaysFromNow: 3
          }
        ],
        priority: 'high',
        ruleStatus: 'active',
        createdAt: '',
        updatedAt: '',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      vi.spyOn(automationRuleRepository, 'getById').mockResolvedValue(rule);
      vi.spyOn(automationRuleRepository, 'update').mockResolvedValue(undefined);
      vi.spyOn(automationEvaluationService, 'evaluateRule').mockResolvedValue([
        {
          entityType: 'learner',
          entityId: 'lrn-1',
          learnerId: 'lrn-1',
          groupId: 'grp-1',
          title: '3 Absences',
          description: 'Missed 3 sessions.'
        }
      ]);
      vi.spyOn(automationActionService, 'isDuplicateExecution').mockResolvedValue(false);
      vi.spyOn(automationOwnershipService, 'resolveOwnerId').mockResolvedValue('staff-teacher-1');

      const mockFollowUp = {
        id: 'fu-auto-1',
        organisationId: orgId,
        ownerId: 'staff-teacher-1',
        subject: 'Follow-up for 3 Absences',
        followUpStatus: 'open'
      } as FollowUp;

      vi.spyOn(followUpService, 'createFollowUp').mockResolvedValue(mockFollowUp);
      vi.spyOn(automationExecutionRepository, 'create').mockImplementation(async (_org, _actor, data) => ({
        id: 'exec-live-1',
        ...data
      } as AutomationExecution));

      const result = await automationExecutionService.runRule(orgId, 'rule-live', actorId, false);

      expect(result.execution.isDryRun).toBe(false);
      expect(result.actionsExecuted[0].status).toBe('success');
      expect(result.actionsExecuted[0].targetId).toBe('fu-auto-1');
      expect(followUpService.createFollowUp).toHaveBeenCalled();
    });
  });

  describe('5. In-App Notifications Lifecycle', () => {
    it('creates and delivers an in-app notification to the intended recipient', async () => {
      const mockNotif: AppNotification = {
        id: 'notif-1',
        organisationId: orgId,
        recipientUserId: 'staff-director-1',
        notificationType: 'attendance',
        title: 'Consecutive Absences Alert',
        message: 'Learner missed 3 consecutive classes.',
        severity: 'urgent',
        notificationStatus: 'unread',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      vi.spyOn(notificationRepository, 'create').mockResolvedValue(mockNotif);

      const created = await notificationService.createNotification(orgId, actorId, {
        recipientUserId: 'staff-director-1',
        notificationType: 'attendance',
        title: 'Consecutive Absences Alert',
        message: 'Learner missed 3 consecutive classes.',
        severity: 'urgent'
      });

      expect(created.id).toBe('notif-1');
      expect(created.notificationStatus).toBe('unread');
      expect(auditService.log).toHaveBeenCalledWith(
        orgId,
        actorId,
        'CREATE_NOTIFICATION',
        'notification',
        'notif-1',
        undefined,
        expect.anything()
      );
    });

    it('calculates unread summary count accurately', async () => {
      const unreadList = [
        { id: 'n1', notificationStatus: 'unread' },
        { id: 'n2', notificationStatus: 'unread' },
        { id: 'n3', notificationStatus: 'unread' }
      ] as AppNotification[];

      vi.spyOn(notificationRepository, 'getUnreadForUser').mockResolvedValue(unreadList);

      const summary = await notificationService.getUnreadSummary(orgId, 'staff-1');
      expect(summary.count).toBe(3);
      expect(summary.recentUnread.length).toBe(3);
    });

    it('marks a notification as read and logs audit evidence', async () => {
      const markSpy = vi.spyOn(notificationRepository, 'markAsRead').mockResolvedValue(undefined);

      await notificationService.markAsRead(orgId, 'notif-1', actorId);

      expect(markSpy).toHaveBeenCalledWith(orgId, 'notif-1', actorId);
      expect(auditService.log).toHaveBeenCalledWith(
        orgId,
        actorId,
        'MARK_NOTIFICATION_READ',
        'notification',
        'notif-1'
      );
    });
  });

  describe('6. Rule Template Catalog', () => {
    it('contains built-in templates across all 8 operational domains', () => {
      const templates = automationRuleService.getTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(10);

      const categories = new Set(templates.map(t => t.ruleCategory));
      expect(categories.has('attendance')).toBe(true);
      expect(categories.has('finance')).toBe(true);
      expect(categories.has('consent')).toBe(true);
      expect(categories.has('event')).toBe(true);
      expect(categories.has('transport')).toBe(true);
      expect(categories.has('instrument')).toBe(true);
      expect(categories.has('costume')).toBe(true);
      expect(categories.has('follow_up')).toBe(true);
    });

    it('instantiates a template into a persistent active rule for an organisation', async () => {
      const createSpy = vi.spyOn(automationRuleRepository, 'create').mockImplementation(async (_org, _act, data) => ({
        id: 'rule-instantiated-1',
        ...data
      } as AutomationRule));

      const rule = await automationRuleService.instantiateTemplate(
        orgId,
        'tpl-attendance-consecutive',
        actorId,
        'active'
      );

      expect(rule.name).toBe('Attendance — 3 Consecutive Absences');
      expect(rule.ruleCategory).toBe('attendance');
      expect(rule.ruleStatus).toBe('active');
      expect(createSpy).toHaveBeenCalled();
    });
  });
});
