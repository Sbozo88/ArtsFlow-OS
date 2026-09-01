import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Organisation } from '../types';

export const organisationService = {
  async createOrganisation(orgId: string, name: string): Promise<Organisation> {
    const orgRef = doc(collection(db, 'organisations'), orgId);
    
    // Check if it already exists to avoid overwriting
    const snap = await getDoc(orgRef);
    if (snap.exists()) {
      return snap.data() as Organisation;
    }

    const now = new Date().toISOString();
    const org: Organisation = {
      id: orgId,
      name,
      status: 'active',
      createdAt: now
    };

    await setDoc(orgRef, org);
    return org;
  },

  async getOrganisation(orgId: string): Promise<Organisation | null> {
    const orgRef = doc(db, 'organisations', orgId);
    const snap = await getDoc(orgRef);
    return snap.exists() ? snap.data() as Organisation : null;
  }
};
