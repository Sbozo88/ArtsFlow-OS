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
import type { ProvisioningJob } from '../types';

export class ProvisioningJobRepository {
  private collectionName = 'provisioningJobs';

  public getCollection() {
    return collection(db, this.collectionName);
  }

  async getById(id: string): Promise<ProvisioningJob | null> {
    const docRef = doc(db, this.collectionName, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as ProvisioningJob;
  }

  async getByRequestId(requestId: string): Promise<ProvisioningJob | null> {
    const q = query(
      this.getCollection(),
      where('requestId', '==', requestId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as ProvisioningJob;
  }

  async getByOrganisationId(organisationId: string): Promise<ProvisioningJob | null> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', organisationId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as ProvisioningJob;
  }

  async getAll(): Promise<ProvisioningJob[]> {
    const q = query(this.getCollection(), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as ProvisioningJob)
      .filter((j) => j.status !== 'deleted');
  }

  async save(job: ProvisioningJob): Promise<void> {
    const docRef = doc(db, this.collectionName, job.id);
    await setDoc(docRef, job);
  }

  async update(id: string, updates: Partial<ProvisioningJob>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }
}

export const provisioningJobRepository = new ProvisioningJobRepository();
