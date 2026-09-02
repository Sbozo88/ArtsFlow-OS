import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { userInvitationService, InviteUserInput } from '../services/userInvitationService';
import type { OrganisationMembership, OrganisationInvitation, AuthRole } from '../types';

export function useOrganisationUsers() {
  const { organisationId, authUser } = useAuth();
  const [members, setMembers] = useState<OrganisationMembership[]>([]);
  const [invitations, setInvitations] = useState<OrganisationInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!organisationId) {
      return;
    }

    // Listen to memberships
    const memCol = collection(db, 'organisationMemberships');
    const memQuery = query(memCol, where('organisationId', '==', organisationId));
    const unsubMembers = onSnapshot(
      memQuery,
      (snap) => {
        const mems = snap.docs.map(d => d.data() as OrganisationMembership);
        setMembers(mems);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching memberships:', err);
        setError(err);
        setLoading(false);
      }
    );

    // Listen to invitations
    const invCol = collection(db, 'organisationInvitations');
    const invQuery = query(invCol, where('organisationId', '==', organisationId));
    const unsubInvitations = onSnapshot(
      invQuery,
      (snap) => {
        const invs = snap.docs
          .map(d => d.data() as OrganisationInvitation)
          .sort((a, b) => b.invitedAt.localeCompare(a.invitedAt));
        setInvitations(invs);
      },
      (err) => {
        console.error('Error fetching invitations:', err);
      }
    );

    return () => {
      unsubMembers();
      unsubInvitations();
    };
  }, [organisationId]);

  const inviteUser = useCallback(
    async (input: InviteUserInput) => {
      if (!organisationId || !authUser) throw new Error('Not authenticated.');
      await userInvitationService.inviteUser(organisationId, authUser.uid, input);
    },
    [organisationId, authUser]
  );

  const revokeInvitation = useCallback(
    async (invitationId: string) => {
      if (!organisationId || !authUser) throw new Error('Not authenticated.');
      await userInvitationService.revokeInvitation(organisationId, authUser.uid, invitationId);
    },
    [organisationId, authUser]
  );

  const changeRole = useCallback(
    async (membershipId: string, newRole: AuthRole) => {
      if (!organisationId || !authUser) throw new Error('Not authenticated.');
      await userInvitationService.changeUserRole(organisationId, authUser.uid, membershipId, newRole);
    },
    [organisationId, authUser]
  );

  const disableUser = useCallback(
    async (membershipId: string) => {
      if (!organisationId || !authUser) throw new Error('Not authenticated.');
      await userInvitationService.disableUser(organisationId, authUser.uid, membershipId);
    },
    [organisationId, authUser]
  );

  const restoreUser = useCallback(
    async (membershipId: string) => {
      if (!organisationId || !authUser) throw new Error('Not authenticated.');
      await userInvitationService.restoreUser(organisationId, authUser.uid, membershipId);
    },
    [organisationId, authUser]
  );

  return {
    members,
    invitations,
    loading,
    error,
    inviteUser,
    revokeInvitation,
    changeRole,
    disableUser,
    restoreUser
  };
}
