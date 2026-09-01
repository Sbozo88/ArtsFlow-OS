import { collection, doc, setDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Attendance } from '../types';

export const attendanceRepository = {
  async upsert(attendance: Attendance): Promise<void> {
    const docRef = doc(db, 'attendance', attendance.id);
    await setDoc(docRef, attendance);
  },

  async getBySession(orgId: string, sessionId: string): Promise<Attendance[]> {
    const q = query(
      collection(db, 'attendance'), 
      where('organisationId', '==', orgId),
      where('sessionId', '==', sessionId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Attendance);
  },

  async markAll(attendances: Attendance[]): Promise<void> {
    const batch = writeBatch(db);
    attendances.forEach(att => {
      const docRef = doc(db, 'attendance', att.id);
      batch.set(docRef, att);
    });
    await batch.commit();
  }
};
