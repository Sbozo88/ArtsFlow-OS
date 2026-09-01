import { BaseRepository } from './BaseRepository';
import { TransportPassenger } from '../types';

class TransportPassengerRepository extends BaseRepository<TransportPassenger> {
  constructor() {
    super('transportPassengers');
  }
}

export const transportPassengerRepository = new TransportPassengerRepository();
