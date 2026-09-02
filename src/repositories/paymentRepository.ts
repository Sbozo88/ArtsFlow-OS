import { BaseRepository } from './BaseRepository';
import type { Payment } from '../types';
import { query, where, getDocs } from 'firebase/firestore';

export class PaymentRepository extends BaseRepository<Payment> {
  constructor() {
    super('payments');
  }

  async getByLearnerId(orgId: string, learnerId: string): Promise<Payment[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', orgId),
      where('learnerId', '==', learnerId),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Payment);
  }

  async getByLearner(orgId: string, learnerId: string): Promise<Payment[]> {
    return this.getByLearnerId(orgId, learnerId);
  }
}

export const paymentRepository = new PaymentRepository();
