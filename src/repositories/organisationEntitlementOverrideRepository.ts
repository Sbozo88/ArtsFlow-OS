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
import type { OrganisationEntitlementOverride } from '../types';

export class OrganisationEntitlementOverrideRepository {
  private collectionName = 'organisationEntitlementOverrides';

  public getCollection() {
    return collection(db, this.collectionName);
  }

  async getById(id: string): Promise<OrganisationEntitlementOverride | null> {
    const docRef = doc(db, this.collectionName, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as OrganisationEntitlementOverride;
  }

  async getByOrganisation(organisationId: string): Promise<OrganisationEntitlementOverride[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', organisationId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as OrganisationEntitlementOverride);
  }

  async getActiveByOrganisation(organisationId: string): Promise<OrganisationEntitlementOverride[]> {
    const all = await this.getByOrganisation(organisationId);
    const now = new Date().toISOString();
    return all.filter((override) => {
      if (override.status !== 'active') return false;
      if (override.startsAt && override.startsAt > now) return false;
      if (override.expiresAt && override.expiresAt <= now) return false;
      return true;
    });
  }

  async save(override: OrganisationEntitlementOverride): Promise<void> {
    const docRef = doc(db, this.collectionName, override.id);
    await setDoc(docRef, override, { merge: true });
  }

  async update(id: string, updates: Partial<OrganisationEntitlementOverride>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }
}

export const organisationEntitlementOverrideRepository = new OrganisationEntitlementOverrideRepository();
