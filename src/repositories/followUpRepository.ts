import { BaseRepository } from './BaseRepository';
import type { FollowUp } from '../types';
import { query, where, getDocs } from 'firebase/firestore';

class FollowUpRepository extends BaseRepository<FollowUp> {
  constructor() {
    super('followUps');
  }

  async getByLearnerId(orgId: string, learnerId: string): Promise<FollowUp[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', orgId),
      where('learnerId', '==', learnerId),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as FollowUp);
  }

  async getByOwnerId(orgId: string, ownerId: string): Promise<FollowUp[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', orgId),
      where('ownerId', '==', ownerId),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as FollowUp);
  }

  async getByStatus(orgId: string, followUpStatus: string): Promise<FollowUp[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', orgId),
      where('followUpStatus', '==', followUpStatus),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as FollowUp);
  }
}

export const followUpRepository = new FollowUpRepository();
