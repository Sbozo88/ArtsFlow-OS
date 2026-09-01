import { BaseRepository } from './BaseRepository';
import type { ProgrammeGroup } from '../types';
import { query, where, getDocs } from 'firebase/firestore';

class ProgrammeGroupRepository extends BaseRepository<ProgrammeGroup> {
  constructor() {
    super('programmeGroups');
  }

  async getByProgrammeId(orgId: string, programmeId: string): Promise<ProgrammeGroup[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', orgId),
      where('programmeId', '==', programmeId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as ProgrammeGroup);
  }
}

export const programmeGroupRepository = new ProgrammeGroupRepository();
