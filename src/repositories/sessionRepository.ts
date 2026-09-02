import { BaseRepository } from './BaseRepository';
import type { Session } from '../types';
import { query, where, getDocs } from 'firebase/firestore';

class SessionRepository extends BaseRepository<Session> {
  constructor() {
    super('sessions');
  }

  async getByGroupId(orgId: string, groupId: string): Promise<Session[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', orgId),
      where('groupId', '==', groupId),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Session);
  }

  async getByGroup(orgId: string, groupId: string): Promise<Session[]> {
    return this.getByGroupId(orgId, groupId);
  }

  async getByDate(orgId: string, date: string): Promise<Session[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', orgId),
      where('date', '==', date),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Session);
  }

  async getByDateRange(orgId: string, startDate: string, endDate: string): Promise<Session[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', orgId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Session);
  }
}

export const sessionRepository = new SessionRepository();
