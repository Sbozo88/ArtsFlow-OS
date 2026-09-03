import { doc, getDoc, getDocs, query, runTransaction, setDoc, where } from 'firebase/firestore';
import { BaseRepository } from './BaseRepository';
import { db } from '../lib/firebase';
import type { OrganisationMembership, OrganisationRole, AuthRole, MembershipStatus } from '../types';

export function membershipDocumentId(userId: string, organisationId: string): string {
  return `mem_${userId}_${organisationId}`;
}

export class OrganisationMembershipRepository extends BaseRepository<OrganisationMembership> {
  constructor() {
    super('organisationMemberships');
  }

  async getByUserId(userId: string): Promise<OrganisationMembership[]> {
    const q = query(
      this.getCollection(),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as OrganisationMembership);
  }

  async getByUserAndOrg(userId: string, organisationId: string): Promise<OrganisationMembership | null> {
    const canonical = await getDoc(doc(db, this.collectionName, membershipDocumentId(userId, organisationId)));
    if (canonical.exists()) return canonical.data() as OrganisationMembership;

    // Temporary read compatibility for pre-3B random membership ids.
    const q = query(
      this.getCollection(),
      where('organisationId', '==', organisationId),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as OrganisationMembership;
  }

  async getActiveMemberships(userId: string): Promise<OrganisationMembership[]> {
    const q = query(
      this.getCollection(),
      where('userId', '==', userId),
      where('membershipStatus', '==', 'active')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as OrganisationMembership);
  }

  async getDefaultMembership(userId: string): Promise<OrganisationMembership | null> {
    const q = query(
      this.getCollection(),
      where('userId', '==', userId),
      where('isDefaultOrganisation', '==', true)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as OrganisationMembership;
  }

  async createMembership(
    orgId: string,
    actorId: string,
    data: Omit<OrganisationMembership, keyof import('../types').BaseRecord>
  ): Promise<OrganisationMembership> {
    const id = membershipDocumentId(data.userId, orgId);
    const existing = await this.getByUserAndOrg(data.userId, orgId);
    if (existing) throw new Error(`Membership already exists for user ${data.userId} in organisation ${orgId}`);

    const now = new Date().toISOString();
    const membership = {
      ...data,
      id,
      organisationId: orgId,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
      status: 'active'
    } as OrganisationMembership;
    await setDoc(doc(db, this.collectionName, id), membership);
    return membership;
  }

  async updateRole(
    organisationId: string,
    actorId: string,
    id: string,
    role: OrganisationRole | AuthRole
  ): Promise<void> {
    await this.update(organisationId, actorId, id, { role } as unknown as Partial<Omit<OrganisationMembership, keyof import('../types').BaseRecord>>);
  }

  async updateStatus(
    organisationId: string,
    actorId: string,
    id: string,
    membershipStatus: MembershipStatus
  ): Promise<void> {
    await this.update(organisationId, actorId, id, { membershipStatus } as unknown as Partial<Omit<OrganisationMembership, keyof import('../types').BaseRecord>>);
  }

  async save(membership: OrganisationMembership): Promise<void> {
    const docRef = doc(db, this.collectionName, membership.id);
    await setDoc(docRef, membership, { merge: true });
  }

  async setDefaultOrganisation(userId: string, organisationId: string, actorId: string): Promise<void> {
    const memberships = await this.getActiveMemberships(userId);
    const target = memberships.find((item) => item.organisationId === organisationId);
    if (!target) throw new Error('Only an active membership can be selected as the default organisation.');

    await runTransaction(db, async (transaction) => {
      for (const membership of memberships) {
        const ref = doc(db, this.collectionName, membership.id);
        transaction.update(ref, {
          isDefaultOrganisation: membership.id === target.id,
          updatedAt: new Date().toISOString(),
          updatedBy: actorId
        });
      }
    });
  }
}

export const organisationMembershipRepository = new OrganisationMembershipRepository();
