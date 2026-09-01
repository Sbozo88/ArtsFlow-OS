import { BaseRepository } from './BaseRepository';
import { TransportVehicle } from '../types';

class TransportVehicleRepository extends BaseRepository<TransportVehicle> {
  constructor() {
    super('transportVehicles');
  }
}

export const transportVehicleRepository = new TransportVehicleRepository();
