import { BaseRepository } from './BaseRepository';
import type { StaffSubstitution, SubstitutionStatus } from '../types';

class StaffSubstitutionRepository extends BaseRepository<StaffSubstitution> {
  constructor() {
    super('staffSubstitutions');
  }

  async getBySessionId(organisationId: string, sessionId: string): Promise<StaffSubstitution[]> {
    const items = await this.getByOrganisation(organisationId);
    return items.filter(s => s.sessionId === sessionId && s.substitutionStatus !== 'cancelled');
  }

  async getByStaffId(organisationId: string, staffId: string): Promise<StaffSubstitution[]> {
    const items = await this.getByOrganisation(organisationId);
    return items.filter(s => 
      (s.originalStaffId === staffId || s.substituteStaffId === staffId) && 
      s.substitutionStatus !== 'cancelled'
    );
  }

  async updateStatus(
    organisationId: string,
    actorId: string,
    id: string,
    substitutionStatus: SubstitutionStatus,
    updates?: Partial<StaffSubstitution>
  ): Promise<void> {
    await this.update(organisationId, actorId, id, {
      substitutionStatus,
      ...updates
    });
  }
}

export const staffSubstitutionRepository = new StaffSubstitutionRepository();
