import { doc, getDoc, setDoc, QueryConstraint } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BaseRepository } from './BaseRepository';
import type { OrganisationUsage, LimitMeterKey } from '../types';

export class OrganisationUsageRepository extends BaseRepository<OrganisationUsage> {
  constructor() {
    super('organisationUsage');
  }

  getUsageDocId(organisationId: string): string {
    return `usage_${organisationId}`;
  }

  getCurrentBillingPeriod(): string {
    const d = new Date();
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  createDefaultUsage(organisationId: string, actorId: string = 'system'): OrganisationUsage {
    const now = new Date().toISOString();
    return {
      id: this.getUsageDocId(organisationId),
      organisationId,
      billingPeriod: this.getCurrentBillingPeriod(),
      learnersCount: 0,
      staffUsersCount: 0,
      storageMb: 0,
      monthlyCommunicationsCount: 0,
      automationRunsCount: 0,
      lastSyncedAt: now,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
      status: 'active'
    };
  }

  override async getByOrganisation(orgId: string, _additionalConstraints: QueryConstraint[] = []): Promise<OrganisationUsage[]> {
    const single = await this.getUsageForOrganisation(orgId);
    return single ? [single] : [];
  }

  async getUsageForOrganisation(organisationId: string): Promise<OrganisationUsage | null> {
    const docId = this.getUsageDocId(organisationId);
    const docRef = doc(db, this.collectionName, docId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as OrganisationUsage;
  }

  async getOrCreate(organisationId: string, actorId: string = 'system'): Promise<OrganisationUsage> {
    const existing = await this.getUsageForOrganisation(organisationId);
    if (existing) {
      // If billing period has rolled over, reset monthly meters
      const currentPeriod = this.getCurrentBillingPeriod();
      if (existing.billingPeriod !== currentPeriod) {
        return this.updateUsage(organisationId, actorId, {
          billingPeriod: currentPeriod,
          monthlyCommunicationsCount: 0,
          automationRunsCount: 0
        });
      }
      return existing;
    }

    const defaultUsage = this.createDefaultUsage(organisationId, actorId);
    const docRef = doc(db, this.collectionName, defaultUsage.id);
    await setDoc(docRef, defaultUsage);
    return defaultUsage;
  }

  async updateUsage(
    organisationId: string,
    actorId: string,
    updates: Partial<OrganisationUsage>
  ): Promise<OrganisationUsage> {
    const current = await this.getOrCreate(organisationId, actorId);
    const now = new Date().toISOString();
    const payload: OrganisationUsage = {
      ...current,
      ...updates,
      updatedAt: now,
      updatedBy: actorId
    };

    const docRef = doc(db, this.collectionName, payload.id);
    await setDoc(docRef, payload, { merge: true });
    return payload;
  }

  async incrementMeter(
    organisationId: string,
    actorId: string,
    meterKey: LimitMeterKey,
    delta: number
  ): Promise<OrganisationUsage> {
    const current = await this.getOrCreate(organisationId, actorId);
    const updates: Partial<OrganisationUsage> = {};

    switch (meterKey) {
      case 'limits.learners':
        updates.learnersCount = Math.max(0, (current.learnersCount || 0) + delta);
        break;
      case 'limits.staff_users':
        updates.staffUsersCount = Math.max(0, (current.staffUsersCount || 0) + delta);
        break;
      case 'limits.storage_mb':
        updates.storageMb = Math.max(0, (current.storageMb || 0) + delta);
        break;
      case 'limits.monthly_communications':
        updates.monthlyCommunicationsCount = Math.max(0, (current.monthlyCommunicationsCount || 0) + delta);
        break;
      case 'limits.automation_runs':
        updates.automationRunsCount = Math.max(0, (current.automationRunsCount || 0) + delta);
        break;
    }

    return this.updateUsage(organisationId, actorId, updates);
  }
}

export const organisationUsageRepository = new OrganisationUsageRepository();
