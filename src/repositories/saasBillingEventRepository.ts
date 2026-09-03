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
import type { SaaSBillingEvent } from '../types';

export class SaaSBillingEventRepository {
  private collectionName = 'saasBillingEvents';

  public getCollection() {
    return collection(db, this.collectionName);
  }

  async getById(id: string): Promise<SaaSBillingEvent | null> {
    const docRef = doc(db, this.collectionName, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as SaaSBillingEvent;
  }

  /**
   * Look up a billing event by composite provider identity for webhook idempotency.
   */
  async getByEventIdentity(
    providerType: string,
    providerEventId: string
  ): Promise<SaaSBillingEvent | null> {
    const q = query(
      this.getCollection(),
      where('providerType', '==', providerType),
      where('providerEventId', '==', providerEventId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as SaaSBillingEvent;
  }

  async getByOrganisation(organisationId: string): Promise<SaaSBillingEvent[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', organisationId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as SaaSBillingEvent)
      .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  }

  async getBySubscriptionId(subscriptionId: string): Promise<SaaSBillingEvent[]> {
    const q = query(
      this.getCollection(),
      where('subscriptionId', '==', subscriptionId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as SaaSBillingEvent)
      .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  }

  async save(event: SaaSBillingEvent): Promise<void> {
    const docRef = doc(db, this.collectionName, event.id);
    await setDoc(docRef, event, { merge: true });
  }

  async update(id: string, updates: Partial<SaaSBillingEvent>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }
}

export const saasBillingEventRepository = new SaaSBillingEventRepository();
