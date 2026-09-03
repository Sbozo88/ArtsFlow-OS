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
import type { PlanEntitlement } from '../types';

export function getPlanEntitlementDocId(planId: string, featureKey: string): string {
  return `plan_${planId}_${featureKey.replace(/\./g, '_')}`;
}

export class PlanEntitlementRepository {
  private collectionName = 'planEntitlements';

  public getCollection() {
    return collection(db, this.collectionName);
  }

  async getByPlanAndFeature(planId: string, featureKey: string): Promise<PlanEntitlement | null> {
    const docId = getPlanEntitlementDocId(planId, featureKey);
    const docRef = doc(db, this.collectionName, docId);
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data() as PlanEntitlement;

    // Fallback query if legacy/custom ID
    const q = query(
      this.getCollection(),
      where('planId', '==', planId),
      where('featureKey', '==', featureKey)
    );
    const querySnap = await getDocs(q);
    if (querySnap.empty) return null;
    return querySnap.docs[0].data() as PlanEntitlement;
  }

  async getByPlanId(planId: string): Promise<PlanEntitlement[]> {
    const q = query(this.getCollection(), where('planId', '==', planId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PlanEntitlement);
  }

  async getAll(): Promise<PlanEntitlement[]> {
    const snap = await getDocs(this.getCollection());
    return snap.docs.map((d) => d.data() as PlanEntitlement);
  }

  async save(entitlement: PlanEntitlement): Promise<void> {
    const id = entitlement.id || getPlanEntitlementDocId(entitlement.planId, entitlement.featureKey);
    const docRef = doc(db, this.collectionName, id);
    await setDoc(docRef, { ...entitlement, id }, { merge: true });
  }

  async update(id: string, updates: Partial<PlanEntitlement>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }
}

export const planEntitlementRepository = new PlanEntitlementRepository();
