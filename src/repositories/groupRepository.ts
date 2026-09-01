import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Group } from '../types';

export const groupRepository = {
  async create(group: Group): Promise<void> {
    const docRef = doc(db, 'groups', group.id);
    await setDoc(docRef, group);
  },

  async getByOrganisation(orgId: string): Promise<Group[]> {
    const q = query(
      collection(db, 'groups'), 
      where('organisationId', '==', orgId),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Group);
  }
};
