import { collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CustomerFeedbackRecord, CustomerFeedbackStatus } from '../types';

export const customerFeedbackRepository = {
  async save(feedback: CustomerFeedbackRecord): Promise<void> {
    const docRef = doc(db, 'customerFeedback', feedback.id);
    await setDoc(docRef, feedback);
  },

  async getById(id: string): Promise<CustomerFeedbackRecord | null> {
    const docRef = doc(db, 'customerFeedback', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as CustomerFeedbackRecord;
  },

  async getByOrganisation(organisationId: string): Promise<CustomerFeedbackRecord[]> {
    const q = query(
      collection(db, 'customerFeedback'),
      where('organisationId', '==', organisationId)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as CustomerFeedbackRecord)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getAll(): Promise<CustomerFeedbackRecord[]> {
    const snap = await getDocs(collection(db, 'customerFeedback'));
    return snap.docs
      .map((d) => d.data() as CustomerFeedbackRecord)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async updateStatus(
    id: string,
    status: CustomerFeedbackStatus,
    reviewedBy: string,
    internalNotes?: string
  ): Promise<void> {
    const docRef = doc(db, 'customerFeedback', id);
    const now = new Date().toISOString();
    await updateDoc(docRef, {
      status,
      reviewedBy,
      reviewedAt: now,
      internalNotes: internalNotes ?? '',
      updatedAt: now
    });
  }
};
