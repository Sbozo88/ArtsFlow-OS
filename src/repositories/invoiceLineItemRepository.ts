import { BaseRepository } from './BaseRepository';
import type { InvoiceLineItem } from '../types';
import { query, where, getDocs } from 'firebase/firestore';

export class InvoiceLineItemRepository extends BaseRepository<InvoiceLineItem> {
  constructor() {
    super('invoiceLineItems');
  }

  async getByInvoiceId(orgId: string, invoiceId: string): Promise<InvoiceLineItem[]> {
    const q = query(
      this.getCollection(),
      where('organisationId', '==', orgId),
      where('invoiceId', '==', invoiceId),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as InvoiceLineItem);
  }

  async getByInvoice(orgId: string, invoiceId: string): Promise<InvoiceLineItem[]> {
    return this.getByInvoiceId(orgId, invoiceId);
  }
}

export const invoiceLineItemRepository = new InvoiceLineItemRepository();
