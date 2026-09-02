import { BaseRepository } from './BaseRepository';
import type { Enrolment } from '../types';
import { query, where, getDocs } from 'firebase/firestore';

class EnrolmentRepository extends BaseRepository<Enrolment> {
  constructor() {
    super('enrolments');
  }

  async getByLearnerId(orgId: string, learnerId: string): Promise<Enrolment[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', orgId),
      where('learnerId', '==', learnerId),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Enrolment);
  }

  async getByLearner(orgId: string, learnerId: string): Promise<Enrolment[]> {
    return this.getByLearnerId(orgId, learnerId);
  }

  async getByGroupId(orgId: string, groupId: string): Promise<Enrolment[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', orgId),
      where('groupId', '==', groupId),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Enrolment);
  }

  async getActiveByGroupId(orgId: string, groupId: string): Promise<Enrolment[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', orgId),
      where('groupId', '==', groupId),
      where('enrolmentStatus', '==', 'active')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Enrolment);
  }

  async getActiveDuplicate(orgId: string, learnerId: string, groupId: string): Promise<Enrolment | null> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', orgId),
      where('learnerId', '==', learnerId),
      where('groupId', '==', groupId),
      where('enrolmentStatus', '==', 'active')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.length > 0 ? (snapshot.docs[0].data() as Enrolment) : null;
  }
}

export const enrolmentRepository = new EnrolmentRepository();
