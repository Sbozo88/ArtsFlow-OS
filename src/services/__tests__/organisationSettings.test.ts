import { describe, it, expect, vi, beforeEach } from 'vitest';
import { organisationSettingsService, DEFAULT_SETTINGS } from '../organisationSettingsService';
import { calendarPeriodService } from '../calendarPeriodService';
import { permissionService, ALL_PERMISSIONS } from '../permissionService';
import { userInvitationService } from '../userInvitationService';
import { documentBrandingService } from '../documentBrandingService';
import { metricCalculations } from '../analytics/metricCalculations';
import { automationRuleService } from '../automation/automationRuleService';

import { organisationSettingsRepository } from '../../repositories/organisationSettingsRepository';
import { organisationRepository } from '../../repositories/organisationRepository';
import { organisationCalendarPeriodRepository } from '../../repositories/organisationCalendarPeriodRepository';
import { organisationInvitationRepository } from '../../repositories/organisationInvitationRepository';
import { organisationMembershipRepository } from '../../repositories/organisationMembershipRepository';
import { auditService } from '../auditService';
import { automationRuleRepository } from '../../repositories/automationRuleRepository';

import type { 
  AutomationRule,
  OrganisationCalendarPeriod, 
  OrganisationInvitation, 
  OrganisationMembership,
  Attendance,
  AuthUser
} from '../../types';

vi.mock('../../lib/firebase', () => ({
  db: {},
  auth: {}
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn()
}));

vi.mock('../../repositories/organisationSettingsRepository');
vi.mock('../../repositories/organisationRepository');
vi.mock('../../repositories/organisationCalendarPeriodRepository');
vi.mock('../../repositories/organisationInvitationRepository');
vi.mock('../../repositories/organisationMembershipRepository');
vi.mock('../../repositories/automationRuleRepository');
vi.mock('../auditService', () => ({
  auditService: {
    log: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('Phase 6B: Organisation Administration & Configuration', () => {
  const orgId = 'org-arts-academy-1';
  const actorId = 'actor-admin-1';

  beforeEach(() => {
    vi.clearAllMocks();
    organisationSettingsService.invalidateCache();

    vi.mocked(organisationRepository.getById).mockResolvedValue({
      id: orgId,
      organisationId: orgId,
      name: 'Cape Town Youth Arts Academy',
      organisationType: 'school_arts_programme',
      status: 'active',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      createdBy: 'admin',
      updatedBy: 'admin'
    });
  });

  describe('OrganisationSettingsService & Section Validation', () => {
    it('initializes default settings when no existing settings exist', async () => {
      vi.mocked(organisationSettingsRepository.getByOrgId).mockResolvedValue(null);
      vi.mocked(organisationSettingsRepository.setSettings).mockImplementation(async (_org, _actor, s) => s);

      const settings = await organisationSettingsService.getSettings(orgId);

      expect(settings).toBeDefined();
      expect(settings.profile.name).toBe('Cape Town Youth Arts Academy');
      expect(settings.profile.timezone).toBe('Africa/Johannesburg');
      expect(settings.finance.defaultCurrency).toBe('ZAR');
      expect(settings.attendance.lowAttendanceThresholdPercent).toBe(75);
      expect(settings.staff.preventSelfApproval).toBe(true);
      expect(organisationSettingsRepository.setSettings).toHaveBeenCalled();
    });

    it('validates attendance threshold bounds', () => {
      expect(() => {
        organisationSettingsService.validateSection('attendance', {
          lowAttendanceThresholdPercent: 120
        });
      }).toThrow('Low attendance threshold must be between 0 and 100%');

      expect(() => {
        organisationSettingsService.validateSection('attendance', {
          consecutiveAbsenceThreshold: 0
        });
      }).toThrow('Consecutive absence threshold must be at least 1');
    });

    it('validates finance currency code format and sequence padding', () => {
      expect(() => {
        organisationSettingsService.validateSection('finance', {
          defaultCurrency: 'rand'
        });
      }).toThrow('Currency must be a valid 3-letter uppercase code');

      expect(() => {
        organisationSettingsService.validateSection('finance', {
          invoiceSequencePadding: 15
        });
      }).toThrow('Invoice sequence padding must be between 1 and 12 digits');
    });

    it('validates valid IANA timezone in profile', () => {
      expect(() => {
        organisationSettingsService.validateSection('profile', {
          timezone: 'Mars/Colony_1'
        });
      }).toThrow('Invalid IANA timezone');

      expect(() => {
        organisationSettingsService.validateSection('profile', {
          timezone: 'Africa/Johannesburg'
        });
      }).not.toThrow();
    });

    it('updates a section, invalidates cache and logs an audit record', async () => {
      const defaults = DEFAULT_SETTINGS(orgId, 'Cape Town Academy');
      vi.mocked(organisationSettingsRepository.getByOrgId).mockResolvedValue(defaults);
      vi.mocked(organisationSettingsRepository.updateSection).mockResolvedValue();

      await organisationSettingsService.updateSection(orgId, actorId, 'attendance', {
        lowAttendanceThresholdPercent: 80,
        consecutiveAbsenceThreshold: 4
      });

      expect(organisationSettingsRepository.updateSection).toHaveBeenCalledWith(
        orgId,
        actorId,
        'attendance',
        expect.objectContaining({
          lowAttendanceThresholdPercent: 80,
          consecutiveAbsenceThreshold: 4
        })
      );

      expect(auditService.log).toHaveBeenCalledWith(
        orgId,
        actorId,
        'UPDATE_ATTENDANCE_SETTINGS',
        'organisationSettings',
        `${orgId}_attendance`,
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('CalendarPeriodService', () => {
    it('creates operational periods and validates end date is after start date', async () => {
      await expect(
        calendarPeriodService.createPeriod(orgId, actorId, {
          name: 'Term 1',
          periodType: 'term',
          startDate: '2026-04-01',
          endDate: '2026-03-01'
        })
      ).rejects.toThrow('End date (2026-03-01) cannot be earlier than start date (2026-04-01)');
    });

    it('detects overlapping dates within the same period type and raises a warning', async () => {
      const existingPeriod: OrganisationCalendarPeriod = {
        id: 'p-1',
        organisationId: orgId,
        name: 'Term 1 2026',
        periodType: 'term',
        startDate: '2026-01-15',
        endDate: '2026-03-25',
        calendarYear: 2026,
        periodStatus: 'active',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      vi.mocked(organisationCalendarPeriodRepository.getByYear).mockResolvedValue([existingPeriod]);
      vi.mocked(organisationCalendarPeriodRepository.create).mockImplementation(async (_org, _actor, data) => ({
        ...data,
        id: 'p-new',
        organisationId: orgId,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      } as OrganisationCalendarPeriod));

      const result = await calendarPeriodService.createPeriod(orgId, actorId, {
        name: 'Term 1 Alternative',
        periodType: 'term',
        startDate: '2026-03-01',
        endDate: '2026-04-30',
        calendarYear: 2026
      });

      expect(result.overlapWarning).toBeDefined();
      expect(result.overlapWarning).toContain('overlap with existing term "Term 1 2026"');
      expect(auditService.log).toHaveBeenCalledWith(
        orgId,
        actorId,
        'CREATE_CALENDAR_PERIOD',
        'organisationCalendarPeriod',
        'p-new',
        undefined,
        expect.any(Object)
      );
    });

    it('resolves active period covering a specific date', async () => {
      const period: OrganisationCalendarPeriod = {
        id: 'term-1',
        organisationId: orgId,
        name: 'Term 1 2026',
        periodType: 'term',
        startDate: '2026-01-15',
        endDate: '2026-03-31',
        calendarYear: 2026,
        periodStatus: 'active',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      vi.mocked(organisationCalendarPeriodRepository.getForDate).mockResolvedValue([period]);

      const active = await calendarPeriodService.getActivePeriodForDate(orgId, '2026-02-15');
      expect(active).toEqual(period);
    });
  });

  describe('PermissionService (RBAC Architecture)', () => {
    it('grants full permissions to organisation_admin and super_admin', () => {
      const admin: AuthUser = { uid: 'u1', email: 'admin@arts.org', displayName: 'Admin', role: 'organisation_admin' };
      const superAdmin: AuthUser = { uid: 'u2', email: 'super@arts.org', displayName: 'Super', role: 'super_admin' };

      ALL_PERMISSIONS.forEach(p => {
        expect(permissionService.can(admin, p)).toBe(true);
        expect(permissionService.can(superAdmin, p)).toBe(true);
      });
    });

    it('restricts teacher from managing settings and finance', () => {
      const teacher: AuthUser = { uid: 'u3', email: 'teacher@arts.org', displayName: 'Teacher', role: 'teacher' };

      expect(permissionService.can(teacher, 'learners.read')).toBe(true);
      expect(permissionService.can(teacher, 'attendance.write')).toBe(true);
      expect(permissionService.can(teacher, 'settings.manage')).toBe(false);
      expect(permissionService.can(teacher, 'finance.write')).toBe(false);
      expect(permissionService.can(teacher, 'users.manage')).toBe(false);
    });

    it('grants finance manager access to finance reads and writes, but restricts event management', () => {
      const fin: AuthUser = { uid: 'u4', email: 'fin@arts.org', displayName: 'Finance Officer', role: 'finance' };

      expect(permissionService.can(fin, 'finance.read')).toBe(true);
      expect(permissionService.can(fin, 'finance.write')).toBe(true);
      expect(permissionService.can(fin, 'events.manage')).toBe(false);
      expect(permissionService.can(fin, 'staff.approve_timesheets')).toBe(false);
    });
  });

  describe('UserInvitationService & Role Assignment Safety', () => {
    it('creates an invitation with secure token and 7-day expiration', async () => {
      vi.mocked(organisationInvitationRepository.getByEmail).mockResolvedValue([]);
      vi.mocked(organisationInvitationRepository.create).mockImplementation(async (_org, _actor, data) => ({
        ...data,
        id: 'inv-123',
        organisationId: orgId,
        createdAt: '2026-09-01',
        updatedAt: '2026-09-01',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      } as OrganisationInvitation));

      const inv = await userInvitationService.inviteUser(orgId, actorId, {
        email: 'director@artsflow.test',
        role: 'programme_director'
      });

      expect(inv.id).toBe('inv-123');
      expect(inv.email).toBe('director@artsflow.test');
      expect(inv.role).toBe('programme_director');
      expect(inv.token).toHaveLength(32);
      expect(new Date(inv.expiresAt).getTime()).toBeGreaterThan(Date.now());
      expect(auditService.log).toHaveBeenCalledWith(
        orgId,
        actorId,
        'INVITE_USER',
        'organisationInvitation',
        'inv-123',
        undefined,
        expect.any(Object)
      );
    });

    it('prevents demoting the last active organisation_admin', async () => {
      const lastAdminMembership: OrganisationMembership = {
        id: 'mem-admin-1',
        organisationId: orgId,
        userId: 'admin-1',
        email: 'solo-admin@arts.org',
        role: 'organisation_admin',
        membershipStatus: 'active',
        joinedAt: '2026-01-01',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        createdBy: 'admin-1',
        updatedBy: 'admin-1',
        status: 'active'
      };

      vi.mocked(organisationMembershipRepository.getById).mockResolvedValue(lastAdminMembership);
      vi.mocked(organisationMembershipRepository.getByOrganisation).mockResolvedValue([lastAdminMembership]);

      await expect(
        userInvitationService.changeUserRole(orgId, actorId, 'mem-admin-1', 'teacher')
      ).rejects.toThrow('Cannot change role: Organisation must have at least one active Administrator');
    });

    it('accepts an invitation enforcing server-stored role from the invitation record', async () => {
      const invitation: OrganisationInvitation = {
        id: 'inv-valid',
        organisationId: orgId,
        email: 'newuser@artsflow.test',
        role: 'finance',
        invitationStatus: 'pending',
        invitedBy: actorId,
        invitedAt: '2026-09-01T00:00:00Z',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        token: 'token1234567890123456789012345678',
        createdAt: '2026-09-01',
        updatedAt: '2026-09-01',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      vi.mocked(organisationInvitationRepository.getByToken).mockResolvedValue(invitation);
      vi.mocked(organisationMembershipRepository.getByUserAndOrg).mockResolvedValue(null);
      vi.mocked(organisationMembershipRepository.create).mockImplementation(async (_org, _actor, data) => ({
        ...data,
        id: 'mem-created',
        organisationId: orgId,
        createdAt: '2026-09-01',
        updatedAt: '2026-09-01',
        createdBy: 'new-uid',
        updatedBy: 'new-uid',
        status: 'active'
      } as OrganisationMembership));

      const membership = await userInvitationService.acceptInvitation('token1234567890123456789012345678', {
        uid: 'new-uid',
        email: 'newuser@artsflow.test',
        displayName: 'New Finance User'
      });

      expect(membership.role).toBe('finance'); // Enforced from invitation doc
      expect(organisationInvitationRepository.updateStatus).toHaveBeenCalledWith(
        orgId,
        'new-uid',
        'inv-valid',
        'accepted',
        expect.objectContaining({ acceptedByUserId: 'new-uid' })
      );
    });
  });

  describe('DocumentBrandingService', () => {
    it('assembles complete document branding and formats HTML header & footer', async () => {
      const defaults = DEFAULT_SETTINGS(orgId, 'Music Academy');
      defaults.branding.primaryBrandColour = '#2563eb';
      defaults.branding.logoUrl = 'https://artsflow.test/logo.png';
      defaults.profile.taxNumber = '4010293847';

      vi.mocked(organisationSettingsRepository.getByOrgId).mockResolvedValue(defaults);

      const branding = await documentBrandingService.getBranding(orgId);
      expect(branding.header.displayName).toBe('Music Academy');
      expect(branding.header.primaryColor).toBe('#2563eb');
      expect(branding.header.logoUrl).toBe('https://artsflow.test/logo.png');

      const headerHtml = await documentBrandingService.formatHeaderHtml(orgId);
      expect(headerHtml).toContain('border-bottom: 2px solid #2563eb');
      expect(headerHtml).toContain('https://artsflow.test/logo.png');
      expect(headerHtml).toContain('4010293847');
    });
  });

  describe('Attendance Formula & Module Configuration Integration', () => {
    it('respects lateCountsAsPresent and excusedCountsInDenominator options in attendance calculation', () => {
      const records: Attendance[] = [
        { id: '1', organisationId: orgId, sessionId: 's1', learnerId: 'l1', attendanceStatus: 'present', markedBy: actorId, createdAt: '', updatedAt: '', createdBy: '', updatedBy: '', status: 'active' },
        { id: '2', organisationId: orgId, sessionId: 's2', learnerId: 'l1', attendanceStatus: 'late', markedBy: actorId, createdAt: '', updatedAt: '', createdBy: '', updatedBy: '', status: 'active' },
        { id: '3', organisationId: orgId, sessionId: 's3', learnerId: 'l1', attendanceStatus: 'absent', markedBy: actorId, createdAt: '', updatedAt: '', createdBy: '', updatedBy: '', status: 'active' },
        { id: '4', organisationId: orgId, sessionId: 's4', learnerId: 'l1', attendanceStatus: 'excused', markedBy: actorId, createdAt: '', updatedAt: '', createdBy: '', updatedBy: '', status: 'active' }
      ];

      // Default: late counts as present, excused excluded from denominator
      // Present=1, Late=1 (treated as present) => 2 present equiv.
      // Denominator = 1 (present) + 1 (late) + 1 (absent) = 3. Excused excluded.
      // Rate = 2/3 = 66.7%
      const defaultRate = metricCalculations.calculateAttendanceRate(records);
      expect(defaultRate).toBe(66.7);

      // Strict late: late does NOT count as present
      // Present=1. Denominator = 1 + 1 + 1 = 3.
      // Rate = 1/3 = 33.3%
      const strictLateRate = metricCalculations.calculateAttendanceRate(records, {
        lateCountsAsPresent: false,
        excusedCountsInDenominator: false
      });
      expect(strictLateRate).toBe(33.3);

      // Including excused in denominator
      // Present=2 (with late). Denominator = 1 + 1 + 1 + 1 = 4.
      // Rate = 2/4 = 50.0%
      const penaltyExcusedRate = metricCalculations.calculateAttendanceRate(records, {
        lateCountsAsPresent: true,
        excusedCountsInDenominator: true
      });
      expect(penaltyExcusedRate).toBe(50.0);
    });

    it('installs recommended automation rules using organisation thresholds', async () => {
      const customSettings = DEFAULT_SETTINGS(orgId, 'Music Academy');
      customSettings.attendance.consecutiveAbsenceThreshold = 4;
      customSettings.attendance.lowAttendanceThresholdPercent = 80;
      customSettings.automation.dryRunNewRulesByDefault = false;

      vi.mocked(organisationSettingsRepository.getByOrgId).mockResolvedValue(customSettings);
      vi.mocked(automationRuleRepository.getByOrganisation).mockResolvedValue([]);
      vi.mocked(automationRuleRepository.create).mockImplementation(async (_org, _actor, data) => ({
        ...data,
        id: 'rule-new',
        organisationId: orgId,
        createdAt: '2026-09-01',
        updatedAt: '2026-09-01',
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      } as unknown as AutomationRule));

      const installed = await automationRuleService.installRecommendedRules(orgId, actorId);
      expect(installed.length).toBeGreaterThan(0);

      const consecutiveRule = installed.find(r => r.name.toLowerCase().includes('consecutive'));
      expect(consecutiveRule).toBeDefined();
      expect(consecutiveRule?.triggerConfig.consecutiveCount).toBe(4);
      expect(consecutiveRule?.ruleStatus).toBe('active');
    });
  });
});
