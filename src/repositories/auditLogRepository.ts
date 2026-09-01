import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AuditLog } from '../types';

export const auditLogRepository = {
  async log(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const docRef = doc(collection(db, 'auditLogs'));
    const logEntry: AuditLog = {
      ...entry,
      id: docRef.id,
      timestamp: new Date().toISOString()
    };
    await setDoc(docRef, logEntry);
  }
};
