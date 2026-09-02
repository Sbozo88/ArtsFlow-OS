import { query, where, getDocs } from 'firebase/firestore';
import { BaseRepository } from './BaseRepository';
import type { PortalChangeRequest, PortalChangeRequestStatus } from '../types';

export class PortalChangeRequestRepository extends BaseRepository<PortalChangeRequest> {
  constructor() {
    super('portalChangeRequests');
  }

  async getByGuardian(organisationId: string, guardianId: string): Promise<PortalChangeRequest[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', organisationId),
      where('guardianId', '==', guardianId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as PortalChangeRequest);
  }

  async getPending(organisationId: string): Promise<PortalChangeRequest[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', organisationId),
      where('requestStatus', '==', 'pending'),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as PortalChangeRequest);
  }

  async updateRequestStatus(
    organisationId: string,
    actorId: string,
    id: string,
    requestStatus: PortalChangeRequestStatus,
    reviewNotes?: string
  ): Promise<void> {
    await this.update(organisationId, actorId, id, {
      requestStatus,
      reviewedAt: new Date().toISOString(),
      reviewedBy: actorId,
      reviewNotes
    } as Partial<Omit<PortalChangeRequest, keyof import('../types').BaseRecord>>);
  }
}

export const portalChangeRequestRepository = new PortalChangeRequestRepository();
