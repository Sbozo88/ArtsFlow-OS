import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserPreferences } from '../types';

export const userPreferencesRepository = {
  async get(userId: string): Promise<UserPreferences | null> {
    const snapshot = await getDoc(doc(db, 'userPreferences', userId));
    return snapshot.exists() ? snapshot.data() as UserPreferences : null;
  },

  async setLastActiveOrganisation(userId: string, organisationId: string): Promise<void> {
    await setDoc(doc(db, 'userPreferences', userId), {
      id: userId,
      userId,
      lastActiveOrganisationId: organisationId,
      updatedAt: new Date().toISOString()
    } satisfies UserPreferences, { merge: true });
  }
};
