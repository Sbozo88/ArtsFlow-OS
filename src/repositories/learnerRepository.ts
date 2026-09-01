import { collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Learner } from '../types';

const COLLECTION_NAME = 'learners';

export const learnerRepository = {
  async create(learner: Learner): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, learner.id);
    await setDoc(docRef, learner);
  },

  async update(id: string, updates: Partial<Learner>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
  },

  async getByOrganisation(orgId: string): Promise<Learner[]> {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('organisationId', '==', orgId),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Learner);
  },

  async getById(id: string): Promise<Learner | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as Learner) : null;
  }
};
