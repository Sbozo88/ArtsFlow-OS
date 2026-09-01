import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BaseRecord } from '../types';

export class BaseRepository<T extends BaseRecord> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  public getCollection() {
    return collection(db, this.collectionName);
  }

  async create(orgId: string, actorId: string, data: Omit<T, keyof BaseRecord>): Promise<T> {
    const docRef = doc(this.getCollection());
    const now = new Date().toISOString();
    
    const record = {
      ...data,
      id: docRef.id,
      organisationId: orgId,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
      status: 'active'
    } as unknown as T;

    await setDoc(docRef, record);
    return record;
  }

  async update(orgId: string, actorId: string, id: string, updates: Partial<Omit<T, keyof BaseRecord>>): Promise<void> {
    // Prevent cross-organisation updates by verifying first or relying on security rules.
    // We will rely on security rules but also defensively query.
    const docRef = doc(db, this.collectionName, id);
    const snap = await getDoc(docRef);
    
    if (!snap.exists()) throw new Error('Record not found');
    const existing = snap.data() as T;
    
    if (existing.organisationId !== orgId) {
      throw new Error('Cross-organisation update prevented');
    }

    const payload = {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: actorId
    };

    await updateDoc(docRef, payload);
  }

  async getById(orgId: string, id: string): Promise<T | null> {
    const docRef = doc(db, this.collectionName, id);
    const snap = await getDoc(docRef);
    
    if (!snap.exists()) return null;
    
    const data = snap.data() as T;
    if (data.organisationId !== orgId) return null; // Enforce org scope
    
    return data;
  }

  async getByOrganisation(orgId: string, additionalConstraints: QueryConstraint[] = []): Promise<T[]> {
    const q = query(
      this.getCollection(), 
      where('organisationId', '==', orgId),
      where('status', '!=', 'deleted'),
      ...additionalConstraints
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc: DocumentData) => doc.data() as T);
  }

  async archive(orgId: string, actorId: string, id: string): Promise<void> {
    await this.update(orgId, actorId, id, { status: 'archived' } as unknown as Partial<Omit<T, keyof BaseRecord>>);
  }
  
  async softDelete(orgId: string, actorId: string, id: string): Promise<void> {
    await this.update(orgId, actorId, id, { status: 'deleted' } as unknown as Partial<Omit<T, keyof BaseRecord>>);
  }
}
