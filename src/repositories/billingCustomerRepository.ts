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
import type { BillingCustomer } from '../types';

export class BillingCustomerRepository {
  private collectionName = 'billingCustomers';

  public getCollection() {
    return collection(db, this.collectionName);
  }

  async getById(id: string): Promise<BillingCustomer | null> {
    const docRef = doc(db, this.collectionName, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as BillingCustomer;
  }

  async getByOrganisation(organisationId: string): Promise<BillingCustomer | null> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', organisationId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as BillingCustomer;
  }

  async getByProviderCustomerId(providerCustomerId: string): Promise<BillingCustomer | null> {
    const q = query(
      this.getCollection(),
      where('providerCustomerId', '==', providerCustomerId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as BillingCustomer;
  }

  async save(customer: BillingCustomer): Promise<void> {
    const docRef = doc(db, this.collectionName, customer.id);
    await setDoc(docRef, customer, { merge: true });
  }

  async update(id: string, updates: Partial<BillingCustomer>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }
}

export const billingCustomerRepository = new BillingCustomerRepository();
