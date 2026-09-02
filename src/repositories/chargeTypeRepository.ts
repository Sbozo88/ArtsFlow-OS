import { BaseRepository } from './BaseRepository';
import type { ChargeType } from '../types';

export class ChargeTypeRepository extends BaseRepository<ChargeType> {
  constructor() {
    super('chargeTypes');
  }
}

export const chargeTypeRepository = new ChargeTypeRepository();
