import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BaseRepository } from './BaseRepository';
import type { Organisation } from '../types';

class OrganisationRepository extends BaseRepository<Organisation> {
  constructor() {
    super('organisations');
  }

  // Overload to allow getById(id) or getById(orgId, id)
  async getById(idOrOrgId: string, maybeId?: string): Promise<Organisation | null> {
    const docId = maybeId || idOrOrgId;
    const docRef = doc(db, this.collectionName, docId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as Organisation;
  }

  // Overload to allow update(id, actorId, updates) or update(orgId, id, actorId, updates)
  async update(
    idOrOrgId: string,
    idOrActorId: string,
    actorIdOrUpdates: string | Partial<Organisation>,
    maybeUpdates?: Partial<Organisation>
  ): Promise<void> {
    let docId: string;
    let actorId: string;
    let updates: Partial<Organisation>;

    if (maybeUpdates !== undefined) {
      docId = idOrActorId;
      actorId = actorIdOrUpdates as string;
      updates = maybeUpdates;
    } else {
      docId = idOrOrgId;
      actorId = idOrActorId;
      updates = actorIdOrUpdates as Partial<Organisation>;
    }

    const docRef = doc(db, this.collectionName, docId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: actorId
    });
  }
}

export const organisationRepository = new OrganisationRepository();
