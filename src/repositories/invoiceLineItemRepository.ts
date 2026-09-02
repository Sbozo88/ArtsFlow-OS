import { BaseRepository } from './BaseRepository';
import type { InvoiceLineItem } from '../types';

export class InvoiceLineItemRepository extends BaseRepository<InvoiceLineItem> {
  constructor() {
    super('invoiceLineItems');
  }
}

export const invoiceLineItemRepository = new InvoiceLineItemRepository();
