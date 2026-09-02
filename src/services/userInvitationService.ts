import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { organisationInvitationRepository } from '../repositories/organisationInvitationRepository';
import { organisationMembershipRepository } from '../repositories/organisationMembershipRepository';
import { staffRepository } from '../repositories/staffRepository';
import { auditService } from './auditService';
import type { 
  OrganisationInvitation, 
  OrganisationMembership, 
  AuthRole 
} from '../types';

export interface InviteUserInput {
  email: string;
  role: AuthRole;
}

function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export const userInvitationService = {
  /**
   * Dispatches an invitation for an email to join an organisation with a designated role.
   */
  async inviteUser(
    organisationId: string,
    actorId: string,
    input: InviteUserInput
  ): Promise<OrganisationInvitation> {
    const email = input.email.toLowerCase().trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('A valid email address is required.');
    }

    // Check if an active/pending invitation already exists
    const existing = await organisationInvitationRepository.getByEmail(organisationId, email);
    const now = new Date().toISOString();
    const pending = existing.find(inv => inv.invitationStatus === 'pending' && inv.expiresAt > now);

    if (pending) {
      throw new Error(`An active invitation for ${email} is already pending.`);
    }

    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const invitation = await organisationInvitationRepository.create(organisationId, actorId, {
      email,
      role: input.role,
      invitationStatus: 'pending',
      invitedBy: actorId,
      invitedAt: now,
      expiresAt,
      token
    });

    await auditService.log(
      organisationId,
      actorId,
      'INVITE_USER',
      'organisationInvitation',
      invitation.id,
      undefined,
      { email, role: input.role, expiresAt }
    );

    return invitation;
  },

  async getInvitations(organisationId: string): Promise<OrganisationInvitation[]> {
    const all = await organisationInvitationRepository.getByOrganisation(organisationId);
    return all.sort((a, b) => b.invitedAt.localeCompare(a.invitedAt));
  },

  async revokeInvitation(organisationId: string, actorId: string, id: string): Promise<void> {
    const existing = await organisationInvitationRepository.getById(organisationId, id);
    if (!existing) throw new Error(`Invitation ${id} not found.`);

    await organisationInvitationRepository.updateStatus(organisationId, actorId, id, 'revoked');

    await auditService.log(
      organisationId,
      actorId,
      'REVOKE_INVITATION',
      'organisationInvitation',
      id,
      existing,
      { invitationStatus: 'revoked' }
    );
  },

  /**
   * Accepts an invitation using a secure token.
   * Enforces server-side assigned role from invitation doc (prevents role tampering).
   */
  async acceptInvitation(
    token: string,
    acceptingUser: { uid: string; email: string; displayName?: string }
  ): Promise<OrganisationMembership> {
    const invitation = await organisationInvitationRepository.getByToken(token);
    if (!invitation) {
      throw new Error('Invalid or expired invitation token.');
    }

    const now = new Date().toISOString();
    if (invitation.invitationStatus !== 'pending') {
      throw new Error(`Invitation is already ${invitation.invitationStatus}.`);
    }

    if (invitation.expiresAt < now) {
      await organisationInvitationRepository.updateStatus(invitation.organisationId, 'system', invitation.id, 'expired');
      throw new Error('This invitation has expired. Please request a new invitation.');
    }

    // 1. Mark invitation as accepted
    await organisationInvitationRepository.updateStatus(
      invitation.organisationId,
      acceptingUser.uid,
      invitation.id,
      'accepted',
      {
        acceptedAt: now,
        acceptedByUserId: acceptingUser.uid
      }
    );

    // 2. Create or update OrganisationMembership
    const existingMembership = await organisationMembershipRepository.getByUserAndOrg(
      acceptingUser.uid,
      invitation.organisationId
    );

    let membership: OrganisationMembership;
    if (existingMembership) {
      await organisationMembershipRepository.updateRole(
        invitation.organisationId,
        acceptingUser.uid,
        existingMembership.id,
        invitation.role
      );
      membership = { ...existingMembership, role: invitation.role, membershipStatus: 'active' };
    } else {
      membership = await organisationMembershipRepository.create(
        invitation.organisationId,
        acceptingUser.uid,
        {
          userId: acceptingUser.uid,
          email: acceptingUser.email.toLowerCase().trim(),
          displayName: acceptingUser.displayName || undefined,
          role: invitation.role,
          membershipStatus: 'active',
          joinedAt: now
        }
      );
    }

    // 3. Update Firestore users collection doc for the user
    try {
      await setDoc(doc(db, 'users', acceptingUser.uid), {
        email: acceptingUser.email,
        displayName: acceptingUser.displayName || null,
        organisationId: invitation.organisationId,
        role: invitation.role,
        updatedAt: now
      }, { merge: true });
    } catch (err) {
      console.warn('Could not update users document:', err);
    }

    await auditService.log(
      invitation.organisationId,
      acceptingUser.uid,
      'ACCEPT_INVITATION',
      'organisationMembership',
      membership.id,
      undefined,
      { role: invitation.role, email: acceptingUser.email }
    );

    return membership;
  },

  /**
   * Lists all organisation memberships (users with active or disabled access).
   */
  async getMemberships(organisationId: string): Promise<OrganisationMembership[]> {
    const memberships = await organisationMembershipRepository.getByOrganisation(organisationId);
    
    // Also merge in staff info if needed for enriched display
    const staffList = await staffRepository.getByOrganisation(organisationId);
    return memberships.map(m => {
      const match = staffList.find(s => s.email?.toLowerCase() === m.email?.toLowerCase());
      if (match && !m.displayName) {
        return { ...m, displayName: `${match.firstName} ${match.lastName}` };
      }
      return m;
    });
  },

  /**
   * Modifies an organisation user's role with protection against removing the last administrator.
   */
  async changeUserRole(
    organisationId: string,
    actorId: string,
    membershipId: string,
    newRole: AuthRole
  ): Promise<void> {
    const existing = await organisationMembershipRepository.getById(organisationId, membershipId);
    if (!existing) throw new Error(`Membership ${membershipId} not found.`);

    if (existing.role === 'organisation_admin' && newRole !== 'organisation_admin') {
      // Check if this is the last admin
      const all = await organisationMembershipRepository.getByOrganisation(organisationId);
      const adminCount = all.filter(m => m.role === 'organisation_admin' && m.membershipStatus === 'active').length;
      if (adminCount <= 1) {
        throw new Error('Cannot change role: Organisation must have at least one active Administrator.');
      }
    }

    await organisationMembershipRepository.updateRole(organisationId, actorId, membershipId, newRole);

    // Update users doc in background
    try {
      await updateDoc(doc(db, 'users', existing.userId), {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
    } catch {
      // Best-effort doc sync
    }

    await auditService.log(
      organisationId,
      actorId,
      'CHANGE_USER_ROLE',
      'organisationMembership',
      membershipId,
      existing,
      { previousRole: existing.role, newRole }
    );
  },

  /**
   * Disables user access to the organisation.
   */
  async disableUser(organisationId: string, actorId: string, membershipId: string): Promise<void> {
    const existing = await organisationMembershipRepository.getById(organisationId, membershipId);
    if (!existing) throw new Error(`Membership ${membershipId} not found.`);

    if (existing.userId === actorId) {
      throw new Error('Self-disabling is not permitted.');
    }

    if (existing.role === 'organisation_admin') {
      const all = await organisationMembershipRepository.getByOrganisation(organisationId);
      const activeAdmins = all.filter(m => m.role === 'organisation_admin' && m.membershipStatus === 'active');
      if (activeAdmins.length <= 1) {
        throw new Error('Cannot disable the last active Administrator.');
      }
    }

    await organisationMembershipRepository.updateStatus(organisationId, actorId, membershipId, 'disabled');

    await auditService.log(
      organisationId,
      actorId,
      'DISABLE_USER',
      'organisationMembership',
      membershipId,
      existing,
      { membershipStatus: 'disabled' }
    );
  },

  /**
   * Restores user access to the organisation.
   */
  async restoreUser(organisationId: string, actorId: string, membershipId: string): Promise<void> {
    const existing = await organisationMembershipRepository.getById(organisationId, membershipId);
    if (!existing) throw new Error(`Membership ${membershipId} not found.`);

    await organisationMembershipRepository.updateStatus(organisationId, actorId, membershipId, 'active');

    await auditService.log(
      organisationId,
      actorId,
      'RESTORE_USER',
      'organisationMembership',
      membershipId,
      existing,
      { membershipStatus: 'active' }
    );
  }
};
