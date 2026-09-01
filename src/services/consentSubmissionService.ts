import { consentSubmissionRepository } from '../repositories/consentSubmissionRepository';
import { consentRequestRepository } from '../repositories/consentRequestRepository';
import { ConsentSubmission } from '../types';
import { auditService } from './auditService';

export const consentSubmissionService = {
  async getSubmissions(organisationId: string, eventId?: string): Promise<ConsentSubmission[]> {
    const all = await consentSubmissionRepository.getByOrganisation(organisationId);
    if (eventId) {
      return all.filter(s => s.eventId === eventId);
    }
    return all;
  },

  async getSubmission(organisationId: string, id: string): Promise<ConsentSubmission | null> {
    return consentSubmissionRepository.getById(organisationId, id);
  },

  async getSubmissionsForRequest(organisationId: string, consentRequestId: string): Promise<ConsentSubmission[]> {
    const all = await consentSubmissionRepository.getByOrganisation(organisationId);
    return all.filter(s => s.consentRequestId === consentRequestId);
  },

  async submitConsent(
    organisationId: string,
    data: Omit<ConsentSubmission, keyof import('../types').BaseRecord | 'organisationId' | 'submissionStatus'>,
    actorId: string
  ): Promise<ConsentSubmission> {
    const request = await consentRequestRepository.getById(organisationId, data.consentRequestId);
    if (!request) throw new Error('Consent request not found');

    // Check for previous active submissions on this request
    const existingSubmissions = await this.getSubmissionsForRequest(organisationId, data.consentRequestId);
    const activeExisting = existingSubmissions.filter(s => s.submissionStatus !== 'superseded');

    for (const oldSub of activeExisting) {
      // NEVER SILENTLY OVERWRITE - Mark old as superseded
      await consentSubmissionRepository.update(organisationId, actorId, oldSub.id, {
        submissionStatus: 'superseded',
        notes: (oldSub.notes ? oldSub.notes + ' | ' : '') + `Superseded by new submission at ${new Date().toISOString()}`
      } as never);

      await auditService.log(
        organisationId,
        actorId,
        'SUPERSEDE_CONSENT',
        'consentSubmissions',
        oldSub.id,
        oldSub,
        { ...oldSub, submissionStatus: 'superseded' }
      );
    }

    // Create the new submission
    const now = new Date().toISOString();
    const newSubmission = await consentSubmissionRepository.create(organisationId, actorId, {
      ...data,
      signatureTimestamp: data.signatureTimestamp || now,
      submissionStatus: data.participationApproved ? 'submitted' : 'declined'
    } as never);

    await auditService.log(
      organisationId,
      actorId,
      'SUBMIT_CONSENT',
      'consentSubmissions',
      newSubmission.id,
      undefined,
      newSubmission
    );

    // Update the request status
    await consentRequestRepository.update(organisationId, actorId, request.id, {
      requestStatus: data.participationApproved ? 'submitted' : 'declined',
      submittedAt: now
    } as never);

    return newSubmission;
  },

  async verifySubmission(
    organisationId: string,
    submissionId: string,
    verifierId: string,
    notes?: string
  ): Promise<void> {
    const submission = await this.getSubmission(organisationId, submissionId);
    if (!submission) throw new Error('Consent submission not found');

    const before = { ...submission };
    await consentSubmissionRepository.update(organisationId, verifierId, submissionId, {
      submissionStatus: 'verified',
      notes: notes || submission.notes
    } as never);

    const updated = await this.getSubmission(organisationId, submissionId);
    await auditService.log(
      organisationId,
      verifierId,
      'VERIFY_CONSENT',
      'consentSubmissions',
      submissionId,
      before,
      updated
    );

    // Mark request as approved
    const request = await consentRequestRepository.getById(organisationId, submission.consentRequestId);
    if (request) {
      await consentRequestRepository.update(organisationId, verifierId, request.id, {
        requestStatus: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewedBy: verifierId
      } as never);
    }
  },

  async declineSubmission(
    organisationId: string,
    submissionId: string,
    declinerId: string,
    reason?: string
  ): Promise<void> {
    const submission = await this.getSubmission(organisationId, submissionId);
    if (!submission) throw new Error('Consent submission not found');

    const before = { ...submission };
    await consentSubmissionRepository.update(organisationId, declinerId, submissionId, {
      submissionStatus: 'declined',
      notes: reason ? `${submission.notes ? submission.notes + ' | ' : ''}Declined: ${reason}` : submission.notes
    } as never);

    const updated = await this.getSubmission(organisationId, submissionId);
    await auditService.log(
      organisationId,
      declinerId,
      'DECLINE_CONSENT',
      'consentSubmissions',
      submissionId,
      before,
      updated
    );

    // Mark request as declined
    const request = await consentRequestRepository.getById(organisationId, submission.consentRequestId);
    if (request) {
      await consentRequestRepository.update(organisationId, declinerId, request.id, {
        requestStatus: 'declined',
        reviewedAt: new Date().toISOString(),
        reviewedBy: declinerId,
        notes: reason || request.notes
      } as never);
    }
  }
};
