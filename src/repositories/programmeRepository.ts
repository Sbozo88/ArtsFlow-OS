import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Programme } from '../types';

export const programmeRepository = {
  async create(programme: Programme): Promise<void> {
    const docRef = doc(db, 'programmes', programme.id);
    await setDoc(docRef, programme);
  },

  async getByOrganisation(orgId: string): Promise<Programme[]> {
    const q = query(
      collection(db, 'programmes'), 
      where('organisationId', '==', orgId),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Programme);
  }
};
