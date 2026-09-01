import { BaseRepository } from './BaseRepository';
import type { InstrumentAllocation } from '../types';
import { query, where, getDocs } from 'firebase/firestore';

class InstrumentAllocationRepository extends BaseRepository<InstrumentAllocation> {
  constructor() {
    super('instrumentAllocations');
  }

  async getActiveByInstrumentId(orgId: string, instrumentId: string): Promise<InstrumentAllocation | null> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', orgId),
      where('instrumentId', '==', instrumentId),
      where('allocationStatus', '==', 'active'),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as InstrumentAllocation;
  }
}

export const instrumentAllocationRepository = new InstrumentAllocationRepository();
