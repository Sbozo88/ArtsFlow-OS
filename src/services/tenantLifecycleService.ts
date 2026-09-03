import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auditService } from './auditService';
import type { TenantStatus, Organisation, AuditAction } from '../types';

export const VALID_STATUS_TRANSITIONS: Record<TenantStatus, TenantStatus[]> = {
  provisioning: ['trial', 'active'],
  trial: ['active', 'suspended', 'cancelled'],
  active: ['restricted', 'suspended', 'cancelled'],
  restricted: ['active', 'suspended', 'cancelled'],
  suspended: ['active', 'cancelled'],
  cancelled: ['archived'],
  archived: []
};

export const REASON_REQUIRED_STATUSES = new Set<TenantStatus>([
  'restricted',
  'suspended',
  'cancelled',
  'archived'
]);

export interface UpdateTenantStatusOptions {
  organisationId: string;
  targetStatus: TenantStatus;
  reason?: string;
  actorId: string;
  actorEmail?: string;
}

export const tenantLifecycleService = {
  /**
   * Validates whether a requested tenant status transition is allowable.
   */
  isValidTransition(currentStatus?: TenantStatus, targetStatus?: TenantStatus): boolean {
    if (!targetStatus) return false;
    // Default legacy undefined status is treated as 'active'
    const from = currentStatus || 'active';
    if (from === targetStatus) return true; // No-op is permitted
    const allowed = VALID_STATUS_TRANSITIONS[from] || [];
    return allowed.includes(targetStatus);
  },

  /**
   * Checks whether a given status transition strictly requires an audit justification reason.
   */
  requiresReason(targetStatus: TenantStatus): boolean {
    return REASON_REQUIRED_STATUSES.has(targetStatus);
  },

  /**
   * Map target status to platform audit action.
   */
  getAuditActionForStatus(targetStatus: TenantStatus): AuditAction {
    switch (targetStatus) {
      case 'active':
        return 'PLATFORM_ACTIVATE_TENANT';
      case 'restricted':
        return 'PLATFORM_RESTRICT_TENANT';
      case 'suspended':
        return 'PLATFORM_SUSPEND_TENANT';
      case 'cancelled':
        return 'PLATFORM_CANCEL_TENANT';
      case 'archived':
        return 'PLATFORM_ARCHIVE_TENANT';
      default:
        return 'PLATFORM_ACTIVATE_TENANT';
    }
  },

  /**
   * Controlled tenant lifecycle status update.
   * Never modifies or deletes underlying customer domain data (learners, invoices, etc.).
   */
  async updateTenantStatus(options: UpdateTenantStatusOptions): Promise<Organisation> {
    const { organisationId, targetStatus, reason, actorId } = options;
    const orgRef = doc(db, 'organisations', organisationId);
    const snap = await getDoc(orgRef);

    if (!snap.exists()) {
      throw new Error(`Organisation not found: ${organisationId}`);
    }

    const org = snap.data() as Organisation;
    const currentStatus: TenantStatus = org.tenantStatus || 'active';

    if (!this.isValidTransition(currentStatus, targetStatus)) {
      throw new Error(
        `Invalid tenant status transition: cannot move from '${currentStatus}' to '${targetStatus}'.`
      );
    }

    if (this.requiresReason(targetStatus) && (!reason || !reason.trim())) {
      throw new Error(`A justification reason is required when transitioning tenant to '${targetStatus}'.`);
    }

    const now = new Date().toISOString();
    const updates: Partial<Organisation> = {
      tenantStatus: targetStatus,
      updatedAt: now,
      updatedBy: actorId
    };

    if (targetStatus === 'suspended') {
      updates.suspendedAt = now;
      updates.suspendedBy = actorId;
      updates.suspensionReason = reason?.trim();
    } else if (targetStatus === 'restricted') {
      updates.restrictedAt = now;
      updates.restrictedBy = actorId;
      updates.restrictionReason = reason?.trim();
    }

    await updateDoc(orgRef, updates as Record<string, unknown>);

    const auditAction: AuditAction = currentStatus === 'suspended' && targetStatus === 'active'
      ? 'PLATFORM_RESTORE_TENANT'
      : this.getAuditActionForStatus(targetStatus);

    await auditService.log(
      organisationId,
      actorId,
      auditAction,
      'organisation',
      organisationId,
      { tenantStatus: currentStatus },
      { tenantStatus: targetStatus, reason: reason?.trim() }
    );

    return {
      ...org,
      ...updates
    };
  }
};
