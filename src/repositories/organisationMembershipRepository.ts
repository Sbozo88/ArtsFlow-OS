import { query, where, getDocs } from 'firebase/firestore';
import { BaseRepository } from './BaseRepository';
import type { OrganisationMembership, AuthRole, MembershipStatus } from '../types';

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
    const existing = await this.getByUserAndOrg(data.userId, orgId);
    if (existing) {
      throw new Error(`Membership already exists for user ${data.userId} in organisation ${orgId}`);
    }
    return this.create(orgId, actorId, data);
  }

  async updateRole(
    organisationId: string,
    actorId: string,
    id: string,
    role: AuthRole
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
}

export const organisationMembershipRepository = new OrganisationMembershipRepository();
