import { auditLogRepository } from '../repositories/auditLogRepository';
import type { AuditAction } from '../types';

export const auditService = {
  async log(
    organisationId: string,
    actorId: string,
    action: AuditAction,
    entityType: string,
    entityId: string,
    before?: unknown,
    after?: unknown
  ) {
    try {
      await auditLogRepository.log({
        organisationId,
        actorId,
        action,
        entityType,
        entityId,
        before,
        after
      });
    } catch (error) {
      console.error('Failed to write audit log', error);
      // We log but don't crash the main operation if audit fails
    }
  }
};
