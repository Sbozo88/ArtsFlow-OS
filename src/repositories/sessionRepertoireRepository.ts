import { BaseRepository } from './BaseRepository';
import type { SessionRepertoire } from '../types';
import { query, where, getDocs } from 'firebase/firestore';

class SessionRepertoireRepository extends BaseRepository<SessionRepertoire> {
  constructor() {
    super('sessionRepertoire');
  }

  async getBySessionId(orgId: string, sessionId: string): Promise<SessionRepertoire[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', orgId),
      where('sessionId', '==', sessionId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as SessionRepertoire);
  }
}

export const sessionRepertoireRepository = new SessionRepertoireRepository();
