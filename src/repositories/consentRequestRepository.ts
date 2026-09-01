import { BaseRepository } from './BaseRepository';
import { ConsentRequest } from '../types';

class ConsentRequestRepository extends BaseRepository<ConsentRequest> {
  constructor() {
    super('consentRequests');
  }
}

export const consentRequestRepository = new ConsentRequestRepository();
