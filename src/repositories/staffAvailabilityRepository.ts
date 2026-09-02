import { BaseRepository } from './BaseRepository';
import type { StaffAvailability, AvailabilityStatus } from '../types';

class StaffAvailabilityRepository extends BaseRepository<StaffAvailability> {
  constructor() {
    super('staffAvailability');
  }

  async getByStaffId(organisationId: string, staffId: string): Promise<StaffAvailability[]> {
    const items = await this.getByOrganisation(organisationId);
    return items.filter(a => a.staffId === staffId && a.availabilityStatus === 'active');
  }

  async getForDate(organisationId: string, staffId: string, date: string, dayOfWeek: number): Promise<StaffAvailability[]> {
    const items = await this.getByStaffId(organisationId, staffId);
    return items.filter(a => (a.date && a.date === date) || (a.dayOfWeek !== undefined && a.dayOfWeek === dayOfWeek));
  }

  async updateStatus(organisationId: string, actorId: string, id: string, availabilityStatus: AvailabilityStatus): Promise<void> {
    await this.update(organisationId, actorId, id, { availabilityStatus });
  }
}

export const staffAvailabilityRepository = new StaffAvailabilityRepository();
