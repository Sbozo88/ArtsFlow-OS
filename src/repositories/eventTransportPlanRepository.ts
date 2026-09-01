import { BaseRepository } from './BaseRepository';
import { EventTransportPlan } from '../types';

class EventTransportPlanRepository extends BaseRepository<EventTransportPlan> {
  constructor() {
    super('eventTransportPlans');
  }
}

export const eventTransportPlanRepository = new EventTransportPlanRepository();
