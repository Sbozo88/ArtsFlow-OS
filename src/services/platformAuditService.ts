import { collection, getDocs, query, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AuditLog, AuditAction } from '../types';

export interface PlatformAuditFilter {
  organisationId?: string;
  actorId?: string;
  action?: AuditAction | 'all';
  limit?: number;
}

export const platformAuditService = {
  /**
   * Retrieves platform-level audit events.
   */
  async listPlatformAudit(filter?: PlatformAuditFilter): Promise<AuditLog[]> {
    const max = filter?.limit || 100;
    const auditRef = collection(db, 'auditLogs');
    const q = query(auditRef, orderBy('timestamp', 'desc'), firestoreLimit(max));
    const snap = await getDocs(q);

    let logs: AuditLog[] = [];
    snap.forEach((d) => {
      const data = d.data() as AuditLog;
      logs.push({
        ...data,
        id: d.id
      });
    });

    // Filter to platform scope or platform actions
    logs = logs.filter(
      (log) =>
        log.scopeType === 'platform' ||
        log.action.startsWith('PLATFORM_') ||
        log.entityType === 'organisation'
    );

    if (filter) {
      if (filter.organisationId && filter.organisationId !== 'all') {
        logs = logs.filter((l) => l.organisationId === filter.organisationId || l.entityId === filter.organisationId);
      }
      if (filter.actorId && filter.actorId !== 'all') {
        logs = logs.filter((l) => l.actorId === filter.actorId);
      }
      if (filter.action && filter.action !== 'all') {
        logs = logs.filter((l) => l.action === filter.action);
      }
    }

    return logs;
  }
};
