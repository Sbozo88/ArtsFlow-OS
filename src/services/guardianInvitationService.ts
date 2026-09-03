import { guardianInvitationRepository } from '../repositories/guardianInvitationRepository';
import { guardianPortalAccessRepository } from '../repositories/guardianPortalAccessRepository';
import { guardianRepository } from '../repositories/guardianRepository';
import { organisationRepository } from '../repositories/organisationRepository';
import { entitlementResolverService } from './entitlementResolverService';
import { auditService } from './auditService';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { 
  GuardianInvitation, 
  GuardianPortalAccess, 
  GuardianPortalAccessStatus 
} from '../types';

export interface InviteGuardianResult {
  invitation: GuardianInvitation;
  portalAccess: GuardianPortalAccess;
  invitationLink: string;
}

export interface TokenValidationResult {
  valid: boolean;
  error?: string;
  invitation?: GuardianInvitation;
  organisationName?: string;
  guardianName?: string;
  email?: string;
}

export const guardianInvitationService = {
  /**
   * Dispatches a secure portal invitation for a guardian.
   */
  async inviteGuardian(
    organisationId: string,
    guardianId: string,
    actorId: string,
    customExpiryDays: number = 7
  ): Promise<InviteGuardianResult> {
    const hasPortal = await entitlementResolverService.hasFeature(organisationId, 'guardian_portal');
    if (!hasPortal) {
      throw new Error(`Organisation is not entitled to feature 'guardian_portal'.`);
    }

    const guardian = await guardianRepository.getById(organisationId, guardianId);
    if (!guardian || guardian.status === 'deleted') {
      throw new Error('Guardian record not found.');
    }

    if (!guardian.email || !guardian.email.trim()) {
      throw new Error('Guardian must have a valid email address to receive portal invitation.');
    }

    // Revoke previous pending invitations for this guardian
    const previousInvites = await guardianInvitationRepository.getByGuardianId(organisationId, guardianId);
    for (const prev of previousInvites.filter(i => i.invitationStatus === 'pending')) {
      await guardianInvitationRepository.updateStatus(organisationId, actorId, prev.id, 'revoked');
    }

    // Generate secure token and expiry
    const token = `g_${crypto.randomUUID().replace(/-/g, '')}${Date.now().toString(36)}`;
    const expiresAt = new Date(Date.now() + customExpiryDays * 24 * 60 * 60 * 1000).toISOString();

    const invitation = await guardianInvitationRepository.create(organisationId, actorId, {
      guardianId,
      email: guardian.email.toLowerCase().trim(),
      token,
      expiresAt,
      invitationStatus: 'pending',
      invitedBy: actorId
    } as never);

    // Upsert or update portal access in 'invited' state
    let access = await guardianPortalAccessRepository.getByGuardianId(organisationId, guardianId);
    if (!access) {
      access = await guardianPortalAccessRepository.create(organisationId, actorId, {
        userId: '', // pending user claim upon acceptance
        guardianId,
        accessStatus: 'invited',
        invitedAt: new Date().toISOString()
      } as never);
    } else {
      await guardianPortalAccessRepository.updateAccessStatus(organisationId, actorId, access.id, 'invited', {
        invitedAt: new Date().toISOString()
      });
      access = (await guardianPortalAccessRepository.getById(organisationId, access.id))!;
    }

    await auditService.log(
      organisationId,
      actorId,
      'INVITE_GUARDIAN_PORTAL',
      'guardianInvitations',
      invitation.id,
      null,
      { guardianId, email: invitation.email, expiresAt }
    );

    const baseUrl = typeof window !== 'undefined' && window.location?.origin 
      ? window.location.origin 
      : 'https://artflow-os.web.app';
    const invitationLink = `${baseUrl}/portal/invite/${token}`;

    return { invitation, portalAccess: access, invitationLink };
  },

  /**
   * Validates an invitation token without consuming it.
   */
  async validateInvitationToken(token: string): Promise<TokenValidationResult> {
    if (!token || !token.trim()) {
      return { valid: false, error: 'Invitation token is missing.' };
    }

    const invitation = await guardianInvitationRepository.getByToken(token.trim());
    if (!invitation) {
      return { valid: false, error: 'Invalid or non-existent invitation token.' };
    }

    if (invitation.invitationStatus === 'accepted') {
      return { valid: false, error: 'This invitation has already been accepted.' };
    }

    if (invitation.invitationStatus === 'revoked') {
      return { valid: false, error: 'This invitation has been revoked by administration.' };
    }

    if (new Date(invitation.expiresAt).getTime() < Date.now()) {
      return { valid: false, error: 'This invitation has expired. Please contact administration for a new link.' };
    }

    const org = await organisationRepository.getById(invitation.organisationId, invitation.organisationId);
    const guardian = await guardianRepository.getById(invitation.organisationId, invitation.guardianId);

    return {
      valid: true,
      invitation,
      organisationName: org?.name || 'ArtsFlow Organisation',
      guardianName: guardian ? `${guardian.firstName} ${guardian.lastName}` : 'Guardian',
      email: invitation.email
    };
  },

  /**
   * Consumes an invitation token and links the authenticated Firebase User to the guardian record.
   */
  async acceptInvitation(token: string, userId: string): Promise<GuardianPortalAccess> {
    const validation = await this.validateInvitationToken(token);
    if (!validation.valid || !validation.invitation) {
      throw new Error(validation.error || 'Invalid invitation.');
    }

    const { invitation } = validation;
    const organisationId = invitation.organisationId;
    const guardianId = invitation.guardianId;
    const now = new Date().toISOString();

    // 1. Mark invitation as accepted
    await guardianInvitationRepository.updateStatus(organisationId, userId, invitation.id, 'accepted', {
      acceptedByUserId: userId,
      acceptedAt: now
    });

    // 2. Link User in guardianPortalAccess
    let access = await guardianPortalAccessRepository.getByGuardianId(organisationId, guardianId);
    if (access) {
      await guardianPortalAccessRepository.updateAccessStatus(organisationId, userId, access.id, 'active', {
        userId,
        acceptedAt: now,
        lastAccessAt: now
      });
      access = (await guardianPortalAccessRepository.getById(organisationId, access.id))!;
    } else {
      access = await guardianPortalAccessRepository.create(organisationId, userId, {
        userId,
        guardianId,
        accessStatus: 'active',
        acceptedAt: now,
        lastAccessAt: now
      } as never);
    }

    // 3. Update or sync user document with role: 'guardian' and organisationId
    try {
      const userDocRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        await updateDoc(userDocRef, {
          role: 'guardian',
          organisationId,
          guardianId
        });
      }
    } catch (e) {
      console.warn('Note: User document sync skipped or running in mock environment:', e);
    }

    await auditService.log(
      organisationId,
      userId,
      'ACTIVATE_GUARDIAN_PORTAL',
      'guardianPortalAccess',
      access.id,
      { status: 'invited' },
      { userId, guardianId, accessStatus: 'active' }
    );

    return access;
  },

  /**
   * Revokes portal access for a guardian.
   */
  async revokePortalAccess(
    organisationId: string,
    guardianId: string,
    actorId: string,
    reason?: string
  ): Promise<void> {
    const access = await guardianPortalAccessRepository.getByGuardianId(organisationId, guardianId);
    if (!access) throw new Error('Portal access record not found.');

    const before = { ...access };
    await guardianPortalAccessRepository.updateAccessStatus(organisationId, actorId, access.id, 'revoked', {
      revokedAt: new Date().toISOString(),
      revocationReason: reason || 'Revoked by administrator'
    });

    await auditService.log(
      organisationId,
      actorId,
      'REVOKE_GUARDIAN_PORTAL',
      'guardianPortalAccess',
      access.id,
      before,
      { accessStatus: 'revoked', revocationReason: reason }
    );
  },

  /**
   * Temporarily disables portal access for a guardian.
   */
  async disablePortalAccess(
    organisationId: string,
    guardianId: string,
    actorId: string
  ): Promise<void> {
    const access = await guardianPortalAccessRepository.getByGuardianId(organisationId, guardianId);
    if (!access) throw new Error('Portal access record not found.');

    const before = { ...access };
    await guardianPortalAccessRepository.updateAccessStatus(organisationId, actorId, access.id, 'disabled');

    await auditService.log(
      organisationId,
      actorId,
      'DISABLE_GUARDIAN_PORTAL',
      'guardianPortalAccess',
      access.id,
      before,
      { accessStatus: 'disabled' }
    );
  },

  /**
   * Restores disabled portal access to active.
   */
  async restorePortalAccess(
    organisationId: string,
    guardianId: string,
    actorId: string
  ): Promise<void> {
    const access = await guardianPortalAccessRepository.getByGuardianId(organisationId, guardianId);
    if (!access) throw new Error('Portal access record not found.');

    const before = { ...access };
    await guardianPortalAccessRepository.updateAccessStatus(organisationId, actorId, access.id, 'active');

    await auditService.log(
      organisationId,
      actorId,
      'RESTORE_GUARDIAN_PORTAL',
      'guardianPortalAccess',
      access.id,
      before,
      { accessStatus: 'active' }
    );
  },

  /**
   * Resolves the current portal access status and active invitation for a guardian.
   */
  async getGuardianPortalStatus(organisationId: string, guardianId: string): Promise<{
    status: GuardianPortalAccessStatus | 'none';
    access?: GuardianPortalAccess;
    pendingInvitation?: GuardianInvitation;
  }> {
    const access = await guardianPortalAccessRepository.getByGuardianId(organisationId, guardianId);
    const invites = await guardianInvitationRepository.getByGuardianId(organisationId, guardianId);
    const pendingInvitation = invites.find(i => i.invitationStatus === 'pending' && new Date(i.expiresAt).getTime() > Date.now());

    if (!access) {
      if (pendingInvitation) return { status: 'invited', pendingInvitation };
      return { status: 'none' };
    }

    return {
      status: access.accessStatus,
      access,
      pendingInvitation
    };
  }
};
