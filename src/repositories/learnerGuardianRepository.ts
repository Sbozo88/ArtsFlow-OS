import { BaseRepository } from './BaseRepository';
import type { LearnerGuardian } from '../types';
import { query, where, getDocs } from 'firebase/firestore';

class LearnerGuardianRepository extends BaseRepository<LearnerGuardian> {
  constructor() {
    super('learnerGuardians');
  }

  async getGuardiansForLearner(orgId: string, learnerId: string): Promise<LearnerGuardian[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', orgId),
      where('learnerId', '==', learnerId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as LearnerGuardian);
  }

  async getLearnersForGuardian(orgId: string, guardianId: string): Promise<LearnerGuardian[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', orgId),
      where('guardianId', '==', guardianId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as LearnerGuardian);
  }
}

export const learnerGuardianRepository = new LearnerGuardianRepository();
