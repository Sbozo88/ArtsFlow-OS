import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Enrolment } from '../types';

export const enrolmentRepository = {
  async create(enrolment: Enrolment): Promise<void> {
    const docRef = doc(db, 'enrolments', enrolment.id);
    await setDoc(docRef, enrolment);
  },

  async getByLearner(orgId: string, learnerId: string): Promise<Enrolment[]> {
    const q = query(
      collection(db, 'enrolments'), 
      where('organisationId', '==', orgId),
      where('learnerId', '==', learnerId),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Enrolment);
  },

  async getByGroup(orgId: string, groupId: string): Promise<Enrolment[]> {
    const q = query(
      collection(db, 'enrolments'), 
      where('organisationId', '==', orgId),
      where('groupId', '==', groupId),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Enrolment);
  }
};
