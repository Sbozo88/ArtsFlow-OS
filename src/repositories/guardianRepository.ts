import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Guardian, LearnerGuardian } from '../types';

export const guardianRepository = {
  async create(guardian: Guardian): Promise<void> {
    const docRef = doc(db, 'guardians', guardian.id);
    await setDoc(docRef, guardian);
  },

  async getByOrganisation(orgId: string): Promise<Guardian[]> {
    const q = query(
      collection(db, 'guardians'), 
      where('organisationId', '==', orgId),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Guardian);
  },

  async linkLearner(link: LearnerGuardian): Promise<void> {
    const docRef = doc(db, 'learner_guardians', link.id);
    await setDoc(docRef, link);
  }
};
