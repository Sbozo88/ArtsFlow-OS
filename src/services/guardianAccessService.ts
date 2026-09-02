import { guardianPortalAccessRepository } from '../repositories/guardianPortalAccessRepository';
import { guardianRepository } from '../repositories/guardianRepository';
import { learnerGuardianRepository } from '../repositories/learnerGuardianRepository';
import { learnerRepository } from '../repositories/learnerRepository';
import { organisationSettingsService } from './organisationSettingsService';
import type { 
  Guardian, 
  GuardianPortalAccess, 
  Learner, 
  LearnerGuardian, 
  OrganisationPortalSettings 
} from '../types';

export class GuardianAccessError extends Error {
  code: string;
  constructor(message: string, code: string = 'FORBIDDEN') {
    super(`[${code}] ${message}`);
    this.name = 'GuardianAccessError';
    this.code = code;
  }
}

export interface ResolvedGuardianContext {
  portalAccess: GuardianPortalAccess;
  guardian: Guardian;
  linkedLearnerGuardians: LearnerGuardian[];
  linkedLearners: Learner[];
  portalSettings: OrganisationPortalSettings;
}

export const guardianAccessService = {
  /**
   * Resolves the authenticated user's portal access and linked guardian record.
   * Throws GuardianAccessError if user does not have active portal access.
   */
  async resolveGuardianContext(
    organisationId: string, 
    userId: string
  ): Promise<ResolvedGuardianContext> {
    const portalSettings = (await organisationSettingsService.getSettings(organisationId)).portal;
    if (!portalSettings?.guardianPortalEnabled) {
      throw new GuardianAccessError('The guardian portal is currently disabled for this organisation.', 'PORTAL_DISABLED');
    }

    const portalAccess = await guardianPortalAccessRepository.getByUserId(organisationId, userId);
    if (!portalAccess) {
      throw new GuardianAccessError('No guardian portal access record found for this user.', 'ACCESS_NOT_FOUND');
    }

    if (portalAccess.accessStatus === 'revoked') {
      throw new GuardianAccessError('Your guardian portal access has been revoked by administration.', 'ACCESS_REVOKED');
    }

    if (portalAccess.accessStatus === 'disabled') {
      throw new GuardianAccessError('Your guardian portal account is temporarily disabled.', 'ACCESS_DISABLED');
    }

    if (portalAccess.accessStatus !== 'active') {
      throw new GuardianAccessError('Your guardian portal account is not active.', 'ACCESS_INACTIVE');
    }

    const guardian = await guardianRepository.getById(organisationId, portalAccess.guardianId);
    if (!guardian || guardian.status === 'deleted') {
      throw new GuardianAccessError('Linked guardian record not found.', 'GUARDIAN_NOT_FOUND');
    }

    // Resolve active linked learner relationships
    const allRelationships = await learnerGuardianRepository.getLearnersForGuardian(organisationId, guardian.id);
    const activeRelationships = allRelationships.filter(rel => rel.status === 'active');

    // Load actual learner records
    const learners = await Promise.all(
      activeRelationships.map(async rel => {
        const l = await learnerRepository.getById(organisationId, rel.learnerId);
        return l && l.status === 'active' ? this.filterSafeLearner(l) : null;
      })
    );
    const validLearners = learners.filter((l): l is Learner => l !== null);

    return {
      portalAccess,
      guardian,
      linkedLearnerGuardians: activeRelationships,
      linkedLearners: validLearners,
      portalSettings
    };
  },

  /**
   * Verifies that the guardian has an active relationship to the given learner.
   * Throws GuardianAccessError if access is denied.
   */
  async assertLearnerAccess(
    organisationId: string,
    guardianId: string,
    learnerId: string
  ): Promise<{ learner: Learner; relationship: LearnerGuardian }> {
    const relationships = await learnerGuardianRepository.getLearnersForGuardian(organisationId, guardianId);
    const rel = relationships.find(r => r.learnerId === learnerId && r.status === 'active');

    if (!rel) {
      throw new GuardianAccessError('You do not have access to this learner.', 'FORBIDDEN_LEARNER');
    }

    const learner = await learnerRepository.getById(organisationId, learnerId);
    if (!learner || learner.status !== 'active') {
      throw new GuardianAccessError('Learner record is unavailable or inactive.', 'LEARNER_NOT_FOUND');
    }

    return { learner, relationship: rel };
  },

  /**
   * Checks whether the guardian is authorized to view financial records for the learner.
   */
  async assertFinancialAccess(
    organisationId: string,
    guardianId: string,
    learnerId: string
  ): Promise<boolean> {
    const { portalSettings } = await (async () => {
      const s = await organisationSettingsService.getSettings(organisationId);
      return { portalSettings: s.portal };
    })();

    if (!portalSettings?.showFinance) {
      throw new GuardianAccessError('Financial information is not accessible via the guardian portal.', 'FINANCE_DISABLED');
    }

    const { relationship } = await this.assertLearnerAccess(organisationId, guardianId, learnerId);

    if (portalSettings.financeRequiresFinancialContact && !relationship.financialContact) {
      throw new GuardianAccessError(
        'Billing and payment information is restricted to designated financial contacts.',
        'FINANCIAL_CONTACT_REQUIRED'
      );
    }

    return true;
  },

  /**
   * Checks whether a specific portal feature is enabled by organisation configuration.
   */
  assertFeatureEnabled(
    portalSettings: OrganisationPortalSettings,
    feature: keyof OrganisationPortalSettings
  ): void {
    if (!portalSettings[feature]) {
      throw new GuardianAccessError(`This portal module is currently disabled.`, 'FEATURE_DISABLED');
    }
  },

  /**
   * Strips internal staff notes and sensitive medical/confidential details from learner object.
   */
  filterSafeLearner(learner: Learner): Omit<Learner, 'notes' | 'medicalNotes' | 'emergencyInformation'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { notes, medicalNotes, emergencyInformation, ...safeLearner } = learner;
    return safeLearner;
  }
};
