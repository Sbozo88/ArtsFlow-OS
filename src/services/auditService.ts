import { auditLogRepository } from '../repositories/auditLogRepository';
import type { AuditAction, AuditScopeType } from '../types';

export interface AuditLogOptions {
  organisationId: string;
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  scopeType?: AuditScopeType;
  reason?: string;
  before?: unknown;
  after?: unknown;
}

export const auditService = {
  async log(
    orgIdOrOptions: string | AuditLogOptions,
    actorId?: string,
    action?: AuditAction,
    entityType?: string,
    entityId?: string,
    before?: unknown,
    after?: unknown
  ) {
    try {
      if (typeof orgIdOrOptions === 'object') {
        await auditLogRepository.log(orgIdOrOptions);
      } else if (actorId && action && entityType && entityId) {
        await auditLogRepository.log({
          organisationId: orgIdOrOptions,
          actorId,
          action,
          entityType,
          entityId,
          before,
          after
        });
      }
    } catch (error) {
      console.error('Failed to write audit log', error);
      // We log but don't crash the main operation if audit fails
    }
  }
};
