import { customerFeedbackRepository } from '../repositories/customerFeedbackRepository';
import { organisationRepository } from '../repositories/organisationRepository';
import { auditService } from './auditService';
import type {
  CustomerFeedbackRecord,
  CustomerFeedbackCategory,
  CustomerFeedbackStatus
} from '../types';

export interface SubmitFeedbackInput {
  organisationId: string;
  category: CustomerFeedbackCategory;
  rating: number; // 1 to 5
  comment: string;
  improvements?: string;
  canContact?: boolean;
  submittedByName?: string;
  submittedByEmail?: string;
}

export class FeedbackService {
  /**
   * Submits structured feedback from an authenticated tenant user.
   */
  async submitFeedback(
    actorId: string,
    input: SubmitFeedbackInput
  ): Promise<CustomerFeedbackRecord> {
    if (!input.comment || input.comment.trim() === '') {
      throw new Error('Please provide your feedback comments.');
    }

    if (!input.rating || input.rating < 1 || input.rating > 5) {
      throw new Error('Rating must be between 1 and 5 stars.');
    }

    const org = await organisationRepository.getById(input.organisationId);
    if (!org) {
      throw new Error(`Organisation '${input.organisationId}' not found.`);
    }

    const now = new Date().toISOString();
    const id = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const feedbackRecord: CustomerFeedbackRecord = {
      id,
      organisationId: input.organisationId,
      organisationName: org.name,
      submittedBy: actorId,
      submittedByName: input.submittedByName || 'Academy User',
      submittedByEmail: input.submittedByEmail || org.primaryAdminEmail,
      category: input.category,
      rating: Math.round(input.rating),
      comment: input.comment.trim(),
      improvements: input.improvements?.trim(),
      canContact: input.canContact ?? true,
      status: 'new',
      createdAt: now,
      updatedAt: now
    };

    await customerFeedbackRepository.save(feedbackRecord);

    await auditService.log({
      organisationId: input.organisationId,
      actorId,
      action: 'CUSTOMER_SUBMIT_FEEDBACK',
      entityType: 'customerFeedback',
      entityId: id,
      scopeType: 'organisation',
      reason: `Submitted customer feedback (${input.category}, ${input.rating} stars)`,
      after: {
        category: input.category,
        rating: input.rating
      }
    });

    return feedbackRecord;
  }

  /**
   * Lists feedback submitted by a specific organisation.
   */
  async listOrganisationFeedback(organisationId: string): Promise<CustomerFeedbackRecord[]> {
    return customerFeedbackRepository.getByOrganisation(organisationId);
  }

  /**
   * Lists all feedback across all organisations for Platform Super Admin review.
   */
  async listAllFeedback(filters?: {
    status?: CustomerFeedbackStatus | 'all';
    category?: CustomerFeedbackCategory | 'all';
    minRating?: number;
  }): Promise<CustomerFeedbackRecord[]> {
    const all = await customerFeedbackRepository.getAll();

    return all.filter((item) => {
      if (filters?.status && filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }
      if (filters?.category && filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }
      if (filters?.minRating && item.rating < filters.minRating) {
        return false;
      }
      return true;
    });
  }

  /**
   * Updates feedback review status and internal notes (Platform Super Admin only).
   */
  async updateFeedbackStatus(
    actorId: string,
    feedbackId: string,
    status: CustomerFeedbackStatus,
    internalNotes?: string
  ): Promise<void> {
    const record = await customerFeedbackRepository.getById(feedbackId);
    if (!record) {
      throw new Error(`Feedback record '${feedbackId}' not found.`);
    }

    await customerFeedbackRepository.updateStatus(feedbackId, status, actorId, internalNotes);

    await auditService.log({
      organisationId: 'platform',
      actorId,
      action: 'PLATFORM_UPDATE_FEEDBACK_STATUS',
      entityType: 'customerFeedback',
      entityId: feedbackId,
      scopeType: 'platform',
      reason: `Updated feedback status to '${status}'`,
      after: { status, internalNotes }
    });
  }
}

export const feedbackService = new FeedbackService();
