import { BaseRepository } from './BaseRepository';
import type { FinanceAdjustment } from '../types';

export class FinanceAdjustmentRepository extends BaseRepository<FinanceAdjustment> {
  constructor() {
    super('financeAdjustments');
  }
}

export const financeAdjustmentRepository = new FinanceAdjustmentRepository();
