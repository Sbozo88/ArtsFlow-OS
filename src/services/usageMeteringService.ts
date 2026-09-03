import { organisationUsageRepository } from '../repositories/organisationUsageRepository';
import { entitlementResolverService } from './entitlementResolverService';
import { learnerRepository } from '../repositories/learnerRepository';
import { organisationMembershipRepository } from '../repositories/organisationMembershipRepository';
import { documentRepository } from '../repositories/documentRepository';
import {
  type LimitMeterKey,
  type LimitUsageStatus,
  type MeterStatus,
  type OrganisationUsage,
  type OrganisationUsageSummary,
  type LimitCheckResult,
  PlanLimitExceededError
} from '../types';

export interface MeterMetadata {
  key: LimitMeterKey;
  name: string;
  description: string;
  unit: string;
}

export const METER_DEFINITIONS: Record<LimitMeterKey, MeterMetadata> = {
  'limits.learners': {
    key: 'limits.learners',
    name: 'Active Learners',
    description: 'Active learner profiles registered with the academy',
    unit: 'learners'
  },
  'limits.staff_users': {
    key: 'limits.staff_users',
    name: 'Staff User Seats',
    description: 'Active staff and teacher organisation memberships',
    unit: 'staff'
  },
  'limits.storage_mb': {
    key: 'limits.storage_mb',
    name: 'Document & Media Storage',
    description: 'Cloud document and asset storage consumption',
    unit: 'MB'
  },
  'limits.monthly_communications': {
    key: 'limits.monthly_communications',
    name: 'Monthly Communications',
    description: 'Outbound emails and messages per calendar month',
    unit: 'messages'
  },
  'limits.automation_runs': {
    key: 'limits.automation_runs',
    name: 'Monthly Automation Runs',
    description: 'Automated background rule executions per calendar month',
    unit: 'runs'
  }
};

export class UsageMeteringService {
  public static readonly WARNING_THRESHOLD_PERCENT = 80;
  public static readonly CRITICAL_THRESHOLD_PERCENT = 90;

  /**
   * Determine the usage status based on current consumption vs plan limit.
   */
  calculateUsageStatus(current: number, limit: number | null): {
    percentUsed: number;
    status: LimitUsageStatus;
    warning: boolean;
    exceeded: boolean;
  } {
    if (limit === null || limit === undefined) {
      return {
        percentUsed: 0,
        status: 'ok',
        warning: false,
        exceeded: false
      };
    }

    if (limit <= 0) {
      const exceeded = current > 0;
      return {
        percentUsed: current > 0 ? 100 : 0,
        status: exceeded ? 'exceeded' : 'ok',
        warning: exceeded,
        exceeded
      };
    }

    const percentUsed = Math.round((current / limit) * 100);
    const exceeded = current >= limit;
    let status: LimitUsageStatus = 'ok';

    if (exceeded) {
      status = 'exceeded';
    } else if (percentUsed >= UsageMeteringService.CRITICAL_THRESHOLD_PERCENT) {
      status = 'critical';
    } else if (percentUsed >= UsageMeteringService.WARNING_THRESHOLD_PERCENT) {
      status = 'warning';
    }

    return {
      percentUsed,
      status,
      warning: status === 'warning' || status === 'critical' || status === 'exceeded',
      exceeded
    };
  }

  /**
   * Retrieves full usage summary and limit meter statuses for an organisation.
   */
  async getUsageMeters(organisationId: string): Promise<OrganisationUsageSummary> {
    const usage = await organisationUsageRepository.getOrCreate(organisationId);
    const keys: LimitMeterKey[] = [
      'limits.learners',
      'limits.staff_users',
      'limits.storage_mb',
      'limits.monthly_communications',
      'limits.automation_runs'
    ];

    const meters: Record<LimitMeterKey, MeterStatus> = {} as Record<LimitMeterKey, MeterStatus>;
    let anyWarning = false;
    let anyCritical = false;
    let anyExceeded = false;

    for (const key of keys) {
      const meta = METER_DEFINITIONS[key];
      const limit = await entitlementResolverService.getLimit(organisationId, key);

      let current = 0;
      switch (key) {
        case 'limits.learners':
          current = usage.learnersCount || 0;
          break;
        case 'limits.staff_users':
          current = usage.staffUsersCount || 0;
          break;
        case 'limits.storage_mb':
          current = usage.storageMb || 0;
          break;
        case 'limits.monthly_communications':
          current = usage.monthlyCommunicationsCount || 0;
          break;
        case 'limits.automation_runs':
          current = usage.automationRunsCount || 0;
          break;
      }

      const { percentUsed, status, warning, exceeded } = this.calculateUsageStatus(current, limit);

      if (status === 'warning') anyWarning = true;
      if (status === 'critical') {
        anyWarning = true;
        anyCritical = true;
      }
      if (status === 'exceeded') {
        anyWarning = true;
        anyExceeded = true;
      }

      meters[key] = {
        key,
        name: meta.name,
        description: meta.description,
        current,
        limit,
        unit: meta.unit,
        percentUsed,
        status,
        warning,
        exceeded
      };
    }

    return {
      organisationId,
      billingPeriod: usage.billingPeriod,
      meters,
      anyWarning,
      anyCritical,
      anyExceeded,
      lastSyncedAt: usage.lastSyncedAt || usage.updatedAt
    };
  }

  /**
   * Checks whether incrementing a specific meter by delta would breach the plan limit.
   */
  async checkLimit(
    organisationId: string,
    limitKey: LimitMeterKey,
    delta: number = 1
  ): Promise<LimitCheckResult> {
    const usage = await organisationUsageRepository.getOrCreate(organisationId);
    const limit = await entitlementResolverService.getLimit(organisationId, limitKey);

    let current = 0;
    switch (limitKey) {
      case 'limits.learners':
        current = usage.learnersCount || 0;
        break;
      case 'limits.staff_users':
        current = usage.staffUsersCount || 0;
        break;
      case 'limits.storage_mb':
        current = usage.storageMb || 0;
        break;
      case 'limits.monthly_communications':
        current = usage.monthlyCommunicationsCount || 0;
        break;
      case 'limits.automation_runs':
        current = usage.automationRunsCount || 0;
        break;
    }

    const projected = current + delta;
    if (limit === null || limit === undefined) {
      return {
        allowed: true,
        key: limitKey,
        current,
        limit: null,
        projected,
        percentUsed: 0,
        status: 'ok'
      };
    }

    const percentUsed = limit > 0 ? Math.round((projected / limit) * 100) : 100;
    const allowed = projected <= limit;

    let status: LimitUsageStatus = 'ok';
    if (!allowed) {
      status = 'exceeded';
    } else if (percentUsed >= UsageMeteringService.CRITICAL_THRESHOLD_PERCENT) {
      status = 'critical';
    } else if (percentUsed >= UsageMeteringService.WARNING_THRESHOLD_PERCENT) {
      status = 'warning';
    }

    const meta = METER_DEFINITIONS[limitKey];
    return {
      allowed,
      key: limitKey,
      current,
      limit,
      projected,
      percentUsed,
      status,
      reason: allowed
        ? undefined
        : `Adding ${delta} ${meta.unit} would exceed your plan limit of ${limit} ${meta.unit} (currently using ${current}).`
    };
  }

  /**
   * Enforces that an operation does not exceed plan limit, throwing PlanLimitExceededError if it does.
   */
  async assertWithinLimit(
    organisationId: string,
    limitKey: LimitMeterKey,
    delta: number = 1
  ): Promise<void> {
    const check = await this.checkLimit(organisationId, limitKey, delta);
    if (!check.allowed && check.limit !== null) {
      throw new PlanLimitExceededError(limitKey, check.current, check.limit, check.reason);
    }
  }

  /**
   * Records consumption against a meter counter.
   */
  async recordMeterConsumption(
    organisationId: string,
    limitKey: LimitMeterKey,
    delta: number,
    actorId: string = 'system'
  ): Promise<OrganisationUsage> {
    return organisationUsageRepository.incrementMeter(organisationId, actorId, limitKey, delta);
  }

  /**
   * Recalculates and synchronizes authoritative true counts from collections.
   */
  async syncAllUsage(
    organisationId: string,
    actorId: string = 'system'
  ): Promise<OrganisationUsageSummary> {
    // 1. Synchronize Active Learners Count
    let learnersCount = 0;
    try {
      const allLearners = await learnerRepository.getByOrganisation(organisationId);
      learnersCount = allLearners.filter((l) => l.status !== 'archived').length;
    } catch (err) {
      console.warn(`[UsageMeteringService] Could not count learners for ${organisationId}:`, err);
    }

    // 2. Synchronize Staff User Seats Count
    let staffUsersCount = 0;
    try {
      const allMemberships = await organisationMembershipRepository.getByOrganisation(organisationId);
      staffUsersCount = allMemberships.filter((m) => m.membershipStatus === 'active').length;
    } catch (err) {
      console.warn(`[UsageMeteringService] Could not count staff for ${organisationId}:`, err);
    }

    // 3. Synchronize Storage (MB)
    let storageMb = 0;
    try {
      const allDocuments = await documentRepository.getByOrganisation(organisationId);
      const totalBytes = allDocuments
        .filter((d) => d.status !== 'archived' && typeof d.fileSize === 'number')
        .reduce((sum, d) => sum + (d.fileSize || 0), 0);
      storageMb = Math.ceil(totalBytes / (1024 * 1024));
    } catch (err) {
      console.warn(`[UsageMeteringService] Could not calculate storage for ${organisationId}:`, err);
    }

    const now = new Date().toISOString();
    await organisationUsageRepository.updateUsage(organisationId, actorId, {
      learnersCount,
      staffUsersCount,
      storageMb,
      lastSyncedAt: now
    });

    return this.getUsageMeters(organisationId);
  }
}

export const usageMeteringService = new UsageMeteringService();
