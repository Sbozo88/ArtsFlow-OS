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
import type { SaaSCheckoutSession } from '../types';

export class SaaSCheckoutSessionRepository {
  private collectionName = 'saasCheckoutSessions';

  public getCollection() {
    return collection(db, this.collectionName);
  }

  async getById(id: string): Promise<SaaSCheckoutSession | null> {
    const docRef = doc(db, this.collectionName, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as SaaSCheckoutSession;
  }

  async getByProviderSessionId(providerSessionId: string): Promise<SaaSCheckoutSession | null> {
    const q = query(
      this.getCollection(),
      where('providerSessionId', '==', providerSessionId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as SaaSCheckoutSession;
  }

  async getByOrganisation(organisationId: string): Promise<SaaSCheckoutSession[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', organisationId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as SaaSCheckoutSession)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async save(session: SaaSCheckoutSession): Promise<void> {
    const docRef = doc(db, this.collectionName, session.id);
    await setDoc(docRef, session, { merge: true });
  }

  async update(id: string, updates: Partial<SaaSCheckoutSession>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }
}

export const saasCheckoutSessionRepository = new SaaSCheckoutSessionRepository();
