import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { LearnerGuardian } from '../types';

export const learnerGuardianService = {
  async linkGuardian(
    organisationId: string,
    actorId: string,
    data: Omit<LearnerGuardian, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>
  ): Promise<LearnerGuardian> {
    const docRef = doc(collection(db, 'learnerGuardians'));
    const now = new Date().toISOString();
    
    const link: LearnerGuardian = {
      ...data,
      id: docRef.id,
      organisationId,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId
    };

    await setDoc(docRef, link);
    return link;
  },

  async getGuardiansForLearner(organisationId: string, learnerId: string): Promise<LearnerGuardian[]> {
    const q = query(
      collection(db, 'learnerGuardians'),
      where('organisationId', '==', organisationId),
      where('learnerId', '==', learnerId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as LearnerGuardian);
  },

  async getLearnersForGuardian(organisationId: string, guardianId: string): Promise<LearnerGuardian[]> {
    const q = query(
      collection(db, 'learnerGuardians'),
      where('organisationId', '==', organisationId),
      where('guardianId', '==', guardianId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as LearnerGuardian);
  }
};
