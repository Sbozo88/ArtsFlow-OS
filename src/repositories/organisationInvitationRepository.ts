import { query, where, getDocs } from 'firebase/firestore';
import { BaseRepository } from './BaseRepository';
import type { OrganisationInvitation, InvitationStatus } from '../types';

export class OrganisationInvitationRepository extends BaseRepository<OrganisationInvitation> {
  constructor() {
    super('organisationInvitations');
  }

  async getByEmail(organisationId: string, email: string): Promise<OrganisationInvitation[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', organisationId),
      where('email', '==', email.toLowerCase().trim())
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as OrganisationInvitation);
  }

  async getByStatus(organisationId: string, invitationStatus: InvitationStatus): Promise<OrganisationInvitation[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', organisationId),
      where('invitationStatus', '==', invitationStatus)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as OrganisationInvitation);
  }

  async getByToken(token: string): Promise<OrganisationInvitation | null> {
    const q = query(
      this.getCollection(),
      where('token', '==', token)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as OrganisationInvitation;
  }

  async updateStatus(
    organisationId: string,
    actorId: string,
    id: string,
    invitationStatus: InvitationStatus,
    extra?: Partial<Omit<OrganisationInvitation, keyof import('../types').BaseRecord>>
  ): Promise<void> {
    await this.update(organisationId, actorId, id, {
      invitationStatus,
      ...extra
    } as Partial<Omit<OrganisationInvitation, keyof import('../types').BaseRecord>>);
  }

  async save(invitation: OrganisationInvitation): Promise<void> {
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('../lib/firebase');
    const docRef = doc(db, this.collectionName, invitation.id);
    await setDoc(docRef, invitation, { merge: true });
  }
}

export const organisationInvitationRepository = new OrganisationInvitationRepository();
