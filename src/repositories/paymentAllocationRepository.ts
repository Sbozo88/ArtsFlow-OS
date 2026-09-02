import { BaseRepository } from './BaseRepository';
import type { PaymentAllocation } from '../types';

export class PaymentAllocationRepository extends BaseRepository<PaymentAllocation> {
  constructor() {
    super('paymentAllocations');
  }
}

export const paymentAllocationRepository = new PaymentAllocationRepository();
