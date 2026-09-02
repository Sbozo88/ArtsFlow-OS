import { collection, doc, setDoc, query, where, getDocs } from 'firebase/firestore';
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
  },

  async getByOrganisation(organisationId: string): Promise<AuditLog[]> {
    const q = query(
      collection(db, 'auditLogs'),
      where('organisationId', '==', organisationId)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => d.data() as AuditLog)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
};

