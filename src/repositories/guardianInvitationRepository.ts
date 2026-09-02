import { query, where, getDocs } from 'firebase/firestore';
import { BaseRepository } from './BaseRepository';
import type { GuardianInvitation, InvitationStatus } from '../types';

export class GuardianInvitationRepository extends BaseRepository<GuardianInvitation> {
  constructor() {
    super('guardianInvitations');
  }

  async getByEmail(organisationId: string, email: string): Promise<GuardianInvitation[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', organisationId),
      where('email', '==', email.toLowerCase().trim()),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as GuardianInvitation);
  }

  async getByGuardianId(organisationId: string, guardianId: string): Promise<GuardianInvitation[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', organisationId),
      where('guardianId', '==', guardianId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as GuardianInvitation);
  }

  async getByToken(token: string): Promise<GuardianInvitation | null> {
    const q = query(
      this.getCollection(),
      where('token', '==', token)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as GuardianInvitation;
  }

  async updateStatus(
    organisationId: string,
    actorId: string,
    id: string,
    invitationStatus: InvitationStatus,
    extra?: Partial<Omit<GuardianInvitation, keyof import('../types').BaseRecord>>
  ): Promise<void> {
    await this.update(organisationId, actorId, id, {
      invitationStatus,
      ...extra
    } as Partial<Omit<GuardianInvitation, keyof import('../types').BaseRecord>>);
  }
}

export const guardianInvitationRepository = new GuardianInvitationRepository();
