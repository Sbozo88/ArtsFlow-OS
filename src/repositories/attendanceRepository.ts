import { BaseRepository } from './BaseRepository';
import type { Attendance } from '../types';
import { query, where, getDocs } from 'firebase/firestore';

class AttendanceRepository extends BaseRepository<Attendance> {
  constructor() {
    super('attendance');
  }

  async getBySessionId(orgId: string, sessionId: string): Promise<Attendance[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', orgId),
      where('sessionId', '==', sessionId),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Attendance);
  }

  async getByLearnerId(orgId: string, learnerId: string): Promise<Attendance[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', orgId),
      where('learnerId', '==', learnerId),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Attendance);
  }

  async getByLearner(orgId: string, learnerId: string): Promise<Attendance[]> {
    return this.getByLearnerId(orgId, learnerId);
  }

  async getDuplicate(orgId: string, sessionId: string, learnerId: string): Promise<Attendance | null> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', orgId),
      where('sessionId', '==', sessionId),
      where('learnerId', '==', learnerId),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.length > 0 ? (snapshot.docs[0].data() as Attendance) : null;
  }
}

export const attendanceRepository = new AttendanceRepository();
