import { BaseRepository } from './BaseRepository';
import type { Invoice } from '../types';
import { query, where, getDocs } from 'firebase/firestore';

export class InvoiceRepository extends BaseRepository<Invoice> {
  constructor() {
    super('invoices');
  }

  async getByLearnerId(orgId: string, learnerId: string): Promise<Invoice[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', orgId),
      where('learnerId', '==', learnerId),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Invoice);
  }

  async getByLearner(orgId: string, learnerId: string): Promise<Invoice[]> {
    return this.getByLearnerId(orgId, learnerId);
  }
}

export const invoiceRepository = new InvoiceRepository();
