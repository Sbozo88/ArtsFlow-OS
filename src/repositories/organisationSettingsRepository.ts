import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BaseRepository } from './BaseRepository';
import type { OrganisationSettings } from '../types';

export class OrganisationSettingsRepository extends BaseRepository<OrganisationSettings> {
  constructor() {
    super('organisationSettings');
  }

  async getByOrgId(organisationId: string): Promise<OrganisationSettings | null> {
    const docRef = doc(db, this.collectionName, organisationId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as OrganisationSettings;
  }

  async setSettings(
    organisationId: string,
    actorId: string,
    settings: OrganisationSettings
  ): Promise<OrganisationSettings> {
    const docRef = doc(db, this.collectionName, organisationId);
    const now = new Date().toISOString();
    const payload: OrganisationSettings = {
      ...settings,
      id: organisationId,
      organisationId,
      updatedAt: now,
      updatedBy: actorId,
      status: 'active'
    };
    await setDoc(docRef, payload, { merge: true });
    return payload;
  }

  async updateSection<K extends keyof OrganisationSettings>(
    organisationId: string,
    actorId: string,
    section: K,
    data: Partial<OrganisationSettings[K]>
  ): Promise<void> {
    const docRef = doc(db, this.collectionName, organisationId);
    const now = new Date().toISOString();
    await setDoc(
      docRef,
      {
        [section]: data,
        updatedAt: now,
        updatedBy: actorId
      },
      { merge: true }
    );
  }
}

export const organisationSettingsRepository = new OrganisationSettingsRepository();
