import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Subscription } from '../types';

export class SubscriptionRepository {
  private collectionName = 'subscriptions';

  public getCollection() {
    return collection(db, this.collectionName);
  }

  async getById(id: string): Promise<Subscription | null> {
    const docRef = doc(db, this.collectionName, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as Subscription;
  }

  async getAll(): Promise<Subscription[]> {
    const q = query(this.getCollection(), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as Subscription)
      .filter((s) => s.status !== 'deleted');
  }

  async getByOrganisation(organisationId: string): Promise<Subscription[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', organisationId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as Subscription)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /**
   * Returns the single primary operative subscription for an organisation.
   * Prioritises active/trialing/past_due/paused over cancelled/expired.
   */
  async getPrimarySubscription(organisationId: string): Promise<Subscription | null> {
    const all = await this.getByOrganisation(organisationId);
    if (all.length === 0) return null;

    // First try finding an operative subscription
    const operative = all.find((s) =>
      ['active', 'trialing', 'past_due', 'paused'].includes(s.subscriptionStatus)
    );
    if (operative) return operative;

    // Otherwise return the most recently updated subscription
    return all[0];
  }

  async getByProviderSubscriptionId(providerSubscriptionId: string): Promise<Subscription | null> {
    const q = query(
      this.getCollection(),
      where('providerSubscriptionId', '==', providerSubscriptionId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as Subscription;
  }

  async save(subscription: Subscription): Promise<void> {
    const docRef = doc(db, this.collectionName, subscription.id);
    await setDoc(docRef, subscription, { merge: true });
  }

  async update(id: string, updates: Partial<Subscription>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }
}

export const subscriptionRepository = new SubscriptionRepository();
