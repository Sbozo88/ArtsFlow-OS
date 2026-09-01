import { organisationRepository } from '../repositories/organisationRepository';
import { auditService } from './auditService';
import type { Organisation } from '../types';

export const organisationService = {
  async createOrganisation(orgId: string, actorId: string, data: Omit<Organisation, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>): Promise<Organisation> {
    // We override create here because Organisation doesn't have an organisationId itself usually, 
    // or it's its own ID. We will set orgId = orgId.
    
    // Check if exists
    const existing = await organisationRepository.getById(orgId, orgId);
    if (existing) return existing;

    const org = await organisationRepository.create(orgId, actorId, {
      ...data,
      id: orgId // Ensure ID matches
    } as Parameters<typeof organisationRepository.create>[2]);

    await auditService.log(orgId, actorId, 'CREATE', 'organisation', orgId, undefined, org);
    return org;
  },

  async getOrganisation(orgId: string): Promise<Organisation | null> {
    return organisationRepository.getById(orgId, orgId);
  }
};
