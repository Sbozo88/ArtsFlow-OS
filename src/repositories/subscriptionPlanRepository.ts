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
import type { SubscriptionPlan } from '../types';

export class SubscriptionPlanRepository {
  private collectionName = 'subscriptionPlans';

  public getCollection() {
    return collection(db, this.collectionName);
  }

  async getById(id: string): Promise<SubscriptionPlan | null> {
    const docRef = doc(db, this.collectionName, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as SubscriptionPlan;
  }

  async getByCode(code: string): Promise<SubscriptionPlan | null> {
    const q = query(this.getCollection(), where('code', '==', code));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as SubscriptionPlan;
  }

  async getAll(): Promise<SubscriptionPlan[]> {
    const snap = await getDocs(this.getCollection());
    return snap.docs.map((d) => d.data() as SubscriptionPlan);
  }

  async save(plan: SubscriptionPlan): Promise<void> {
    const docRef = doc(db, this.collectionName, plan.id);
    await setDoc(docRef, plan, { merge: true });
  }

  async update(id: string, updates: Partial<SubscriptionPlan>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }
}

export const subscriptionPlanRepository = new SubscriptionPlanRepository();
