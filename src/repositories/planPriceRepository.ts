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
import type { PlanPrice, BillingInterval } from '../types';

export class PlanPriceRepository {
  private collectionName = 'planPrices';

  public getCollection() {
    return collection(db, this.collectionName);
  }

  async getById(id: string): Promise<PlanPrice | null> {
    const docRef = doc(db, this.collectionName, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as PlanPrice;
  }

  async getAll(): Promise<PlanPrice[]> {
    const snap = await getDocs(this.getCollection());
    return snap.docs
      .map((d) => d.data() as PlanPrice)
      .filter((p) => p.status !== 'deleted');
  }

  async getByPlanId(planId: string): Promise<PlanPrice[]> {
    const q = query(
      this.getCollection(),
      where('planId', '==', planId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PlanPrice);
  }

  async getPrice(
    planId: string,
    currency: string,
    billingInterval: BillingInterval
  ): Promise<PlanPrice | null> {
    const q = query(
      this.getCollection(),
      where('planId', '==', planId),
      where('currency', '==', currency.toUpperCase()),
      where('billingInterval', '==', billingInterval),
      where('priceStatus', '==', 'active'),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as PlanPrice;
  }

  async save(price: PlanPrice): Promise<void> {
    const docRef = doc(db, this.collectionName, price.id);
    await setDoc(docRef, price, { merge: true });
  }

  async update(id: string, updates: Partial<PlanPrice>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }
}

export const planPriceRepository = new PlanPriceRepository();
