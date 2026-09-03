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
import type { PlatformFeature } from '../types';

export class PlatformFeatureRepository {
  private collectionName = 'platformFeatures';

  public getCollection() {
    return collection(db, this.collectionName);
  }

  async getByKey(key: string): Promise<PlatformFeature | null> {
    const docRef = doc(db, this.collectionName, key);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as PlatformFeature;
    }

    // Fallback search by key field if ID is different
    const q = query(this.getCollection(), where('key', '==', key));
    const querySnap = await getDocs(q);
    if (querySnap.empty) return null;
    return querySnap.docs[0].data() as PlatformFeature;
  }

  async getAll(): Promise<PlatformFeature[]> {
    const snap = await getDocs(this.getCollection());
    return snap.docs.map((d) => d.data() as PlatformFeature);
  }

  async save(feature: PlatformFeature): Promise<void> {
    const docRef = doc(db, this.collectionName, feature.id || feature.key);
    await setDoc(docRef, feature, { merge: true });
  }

  async update(key: string, updates: Partial<PlatformFeature>): Promise<void> {
    const docRef = doc(db, this.collectionName, key);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }
}

export const platformFeatureRepository = new PlatformFeatureRepository();
