import { BaseRepository } from './BaseRepository';
import type { Instrument } from '../types';
import { query, where, getDocs } from 'firebase/firestore';

class InstrumentRepository extends BaseRepository<Instrument> {
  constructor() {
    super('instruments');
  }

  async getByAssetNumber(orgId: string, assetNumber: string): Promise<Instrument | null> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', orgId),
      where('assetNumber', '==', assetNumber),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as Instrument;
  }
}

export const instrumentRepository = new InstrumentRepository();
