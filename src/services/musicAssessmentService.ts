import { musicAssessmentRepository } from '../repositories/musicAssessmentRepository';
import { learnerRepository } from '../repositories/learnerRepository';
import { staffRepository } from '../repositories/staffRepository';
import { auditService } from './auditService';
import type { MusicAssessment } from '../types';

export const musicAssessmentService = {
  async createAssessment(orgId: string, actorId: string, data: Omit<MusicAssessment, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>): Promise<MusicAssessment> {
    // Validate org isolation
    const learner = await learnerRepository.getById(orgId, data.learnerId);
    if (!learner) throw new Error('Learner not found');
    
    const teacher = await staffRepository.getById(orgId, data.teacherId);
    if (!teacher) throw new Error('Teacher not found');

    // Calculate overall score automatically
    const scores = [data.tone, data.technique, data.rhythm, data.reading, data.musicality, data.preparation, data.participation].filter(s => s !== undefined && s !== null) as number[];
    
    for (const s of scores) {
      if (s < 0 || s > 10) throw new Error('Scores must be between 0 and 10');
    }

    let calculatedOverall = data.overallScore;
    if (scores.length > 0 && calculatedOverall === undefined) {
      const sum = scores.reduce((a, b) => a + b, 0);
      calculatedOverall = Math.round((sum / scores.length) * 10) / 10;
    }

    const assessment = await musicAssessmentRepository.create(orgId, actorId, {
      ...data,
      overallScore: calculatedOverall
    });

    await auditService.log(orgId, actorId, 'ASSESS_MUSIC', 'musicAssessment', assessment.id, null, assessment);
    return assessment;
  },

  async updateAssessment(orgId: string, actorId: string, docId: string, data: Partial<Omit<MusicAssessment, 'id' | 'organisationId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>>): Promise<void> {
    const before = await musicAssessmentRepository.getById(orgId, docId);
    if (!before) throw new Error('Assessment not found');

    const merged = { ...before, ...data };
    
    // Recalculate score
    const scores = [merged.tone, merged.technique, merged.rhythm, merged.reading, merged.musicality, merged.preparation, merged.participation].filter(s => s !== undefined && s !== null) as number[];
    for (const s of scores) {
      if (s < 0 || s > 10) throw new Error('Scores must be between 0 and 10');
    }

    let calculatedOverall = data.overallScore !== undefined ? data.overallScore : before.overallScore;
    // Only auto-recalculate if user didn't explicitly pass overallScore in the update
    if (scores.length > 0 && data.overallScore === undefined) {
      const sum = scores.reduce((a, b) => a + b, 0);
      calculatedOverall = Math.round((sum / scores.length) * 10) / 10;
    }

    await musicAssessmentRepository.update(orgId, actorId, docId, {
      ...data,
      overallScore: calculatedOverall
    });

    const after = await musicAssessmentRepository.getById(orgId, docId);
    await auditService.log(orgId, actorId, 'UPDATE', 'musicAssessment', docId, before, after);
  },

  async deleteAssessment(orgId: string, actorId: string, docId: string): Promise<void> {
    const before = await musicAssessmentRepository.getById(orgId, docId);
    if (!before) throw new Error('Assessment not found');

    await musicAssessmentRepository.softDelete(orgId, actorId, docId);
    await auditService.log(orgId, actorId, 'DELETE', 'musicAssessment', docId, before, null);
  },

  async getAssessments(orgId: string): Promise<MusicAssessment[]> {
    return musicAssessmentRepository.getByOrganisation(orgId);
  }
};
