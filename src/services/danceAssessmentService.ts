import { danceAssessmentRepository } from '../repositories/danceAssessmentRepository';
import { auditService } from './auditService';
import type { DanceAssessment } from '../types';

export const danceAssessmentService = {
  async createAssessment(orgId: string, actorId: string, data: Omit<DanceAssessment, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>): Promise<DanceAssessment> {
    // Calculate overall score (mean of provided criteria)
    const criteria = [data.technique, data.timing, data.coordination, data.musicality, data.choreographyRetention, data.participation, data.performanceReadiness].filter(c => c !== undefined && c !== null) as number[];
    let overallScore: number | undefined;
    if (criteria.length > 0) {
      overallScore = criteria.reduce((a, b) => a + b, 0) / criteria.length;
    }

    const assessment = await danceAssessmentRepository.create(orgId, actorId, {
      ...data,
      overallScore
    });

    await auditService.log(orgId, actorId, 'CREATE_DANCE_ASSESSMENT', 'danceAssessment', assessment.id, null, assessment);
    return assessment;
  },

  async updateAssessment(orgId: string, actorId: string, docId: string, data: Partial<Omit<DanceAssessment, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>>): Promise<void> {
    const before = await danceAssessmentRepository.getById(orgId, docId);
    if (!before) throw new Error('Assessment not found');

    // Recalculate overall score
    const merged = { ...before, ...data };
    const criteria = [merged.technique, merged.timing, merged.coordination, merged.musicality, merged.choreographyRetention, merged.participation, merged.performanceReadiness].filter(c => c !== undefined && c !== null) as number[];
    let overallScore: number | undefined;
    if (criteria.length > 0) {
      overallScore = criteria.reduce((a, b) => a + b, 0) / criteria.length;
    }
    
    await danceAssessmentRepository.update(orgId, actorId, docId, { ...data, overallScore });
    const after = await danceAssessmentRepository.getById(orgId, docId);

    await auditService.log(orgId, actorId, 'UPDATE_DANCE_ASSESSMENT', 'danceAssessment', docId, before, after);
  },

  async getAssessments(orgId: string): Promise<DanceAssessment[]> {
    return danceAssessmentRepository.getByOrganisation(orgId);
  }
};
