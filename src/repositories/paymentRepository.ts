import { BaseRepository } from './BaseRepository';
import type { Payment } from '../types';

export class PaymentRepository extends BaseRepository<Payment> {
  constructor() {
    super('payments');
  }
}

export const paymentRepository = new PaymentRepository();
