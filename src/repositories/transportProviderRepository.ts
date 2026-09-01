import { BaseRepository } from './BaseRepository';
import { TransportProvider } from '../types';

class TransportProviderRepository extends BaseRepository<TransportProvider> {
  constructor() {
    super('transportProviders');
  }
}

export const transportProviderRepository = new TransportProviderRepository();
