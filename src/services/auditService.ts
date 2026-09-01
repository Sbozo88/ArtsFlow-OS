import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE';

export interface AuditLogPayload {
  organisationId: string;
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export const auditService = {
  async log(payload: AuditLogPayload): Promise<void> {
    try {
      const auditRef = collection(db, 'audit_logs');
      await addDoc(auditRef, {
        ...payload,
        timestamp: serverTimestamp(),
      });
      console.info(`Audit Log: [${payload.action}] ${payload.entityType} (${payload.entityId})`);
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // In production, might want to handle this differently to ensure compliance
    }
  }
};
