import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { OrganisationOnboarding } from '../types';

export class OrganisationOnboardingRepository {
  private collectionName = 'organisationOnboarding';

  public getCollection() {
    return collection(db, this.collectionName);
  }

  async getById(id: string): Promise<OrganisationOnboarding | null> {
    const docRef = doc(db, this.collectionName, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as OrganisationOnboarding;
  }

  async getByOrganisationId(organisationId: string): Promise<OrganisationOnboarding | null> {
    // Primary deterministic ID convention
    const directDoc = await this.getById(`onboarding_${organisationId}`);
    if (directDoc) return directDoc;

    // Fallback query by organisationId field
    const q = query(
      this.getCollection(),
      where('organisationId', '==', organisationId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as OrganisationOnboarding;
  }

  async getAll(): Promise<OrganisationOnboarding[]> {
    const snap = await getDocs(this.getCollection());
    return snap.docs
      .map((d) => d.data() as OrganisationOnboarding)
      .filter((o) => o.status !== 'deleted');
  }

  async save(onboarding: OrganisationOnboarding): Promise<void> {
    const docRef = doc(db, this.collectionName, onboarding.id);
    await setDoc(docRef, onboarding);
  }

  async update(id: string, updates: Partial<OrganisationOnboarding>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }
}

export const organisationOnboardingRepository = new OrganisationOnboardingRepository();
