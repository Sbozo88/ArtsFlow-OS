import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Session } from '../types';

export const sessionRepository = {
  async create(session: Session): Promise<void> {
    const docRef = doc(db, 'sessions', session.id);
    await setDoc(docRef, session);
  },

  async getByGroup(orgId: string, groupId: string): Promise<Session[]> {
    const q = query(
      collection(db, 'sessions'), 
      where('organisationId', '==', orgId),
      where('groupId', '==', groupId),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Session);
  }
};
