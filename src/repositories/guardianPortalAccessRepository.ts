import { query, where, getDocs } from 'firebase/firestore';
import { BaseRepository } from './BaseRepository';
import type { GuardianPortalAccess, GuardianPortalAccessStatus } from '../types';

export class GuardianPortalAccessRepository extends BaseRepository<GuardianPortalAccess> {
  constructor() {
    super('guardianPortalAccess');
  }

  /**
   * Look up access record by Firebase Auth userId.
   */
  async getByUserId(organisationId: string, userId: string): Promise<GuardianPortalAccess | null> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', organisationId),
      where('userId', '==', userId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as GuardianPortalAccess;
  }

  /**
   * Look up access record across all organisations for an auth userId (used for initial login routing).
   */
  async findByUserId(userId: string): Promise<GuardianPortalAccess[]> {
    const q = query(
      this.getCollection(),
      where('userId', '==', userId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as GuardianPortalAccess);
  }

  /**
   * Look up access record by guardianId.
   */
  async getByGuardianId(organisationId: string, guardianId: string): Promise<GuardianPortalAccess | null> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', organisationId),
      where('guardianId', '==', guardianId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as GuardianPortalAccess;
  }

  /**
   * Query records by access status.
   */
  async getByStatus(organisationId: string, accessStatus: GuardianPortalAccessStatus): Promise<GuardianPortalAccess[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', organisationId),
      where('accessStatus', '==', accessStatus),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as GuardianPortalAccess);
  }

  /**
   * Mutate access status with audit and timestamp tracking.
   */
  async updateAccessStatus(
    organisationId: string,
    actorId: string,
    id: string,
    accessStatus: GuardianPortalAccessStatus,
    extra?: Partial<Omit<GuardianPortalAccess, keyof import('../types').BaseRecord>>
  ): Promise<void> {
    await this.update(organisationId, actorId, id, {
      accessStatus,
      ...extra
    } as Partial<Omit<GuardianPortalAccess, keyof import('../types').BaseRecord>>);
  }
}

export const guardianPortalAccessRepository = new GuardianPortalAccessRepository();
