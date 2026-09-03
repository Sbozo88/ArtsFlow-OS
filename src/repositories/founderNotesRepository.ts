import { collection, doc, setDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FounderCustomerNote } from '../types';

export const founderNotesRepository = {
  async save(note: FounderCustomerNote): Promise<void> {
    const docRef = doc(db, 'platformCustomerNotes', note.id);
    await setDoc(docRef, note);
  },

  async getById(id: string): Promise<FounderCustomerNote | null> {
    const docRef = doc(db, 'platformCustomerNotes', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as FounderCustomerNote;
  },

  async getByOrganisation(organisationId: string): Promise<FounderCustomerNote[]> {
    const q = query(
      collection(db, 'platformCustomerNotes'),
      where('organisationId', '==', organisationId)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as FounderCustomerNote)
      .filter((n) => n.status !== 'archived')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getAll(): Promise<FounderCustomerNote[]> {
    const snap = await getDocs(collection(db, 'platformCustomerNotes'));
    return snap.docs
      .map((d) => d.data() as FounderCustomerNote)
      .filter((n) => n.status !== 'archived')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
};
