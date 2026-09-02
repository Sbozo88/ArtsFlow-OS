import { BaseRepository } from './BaseRepository';
import type { Charge } from '../types';

export class ChargeRepository extends BaseRepository<Charge> {
  constructor() {
    super('charges');
  }
}

export const chargeRepository = new ChargeRepository();
