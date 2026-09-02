import { BaseRepository } from './BaseRepository';
import type { Invoice } from '../types';

export class InvoiceRepository extends BaseRepository<Invoice> {
  constructor() {
    super('invoices');
  }
}

export const invoiceRepository = new InvoiceRepository();
