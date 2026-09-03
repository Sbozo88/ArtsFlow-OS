import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { OrganisationMembership, PlatformRole, AuthRole } from '../types';

export interface PlatformUserSummary {
  uid: string;
  email: string;
  displayName?: string;
  platformRole?: PlatformRole;
  legacyRole?: AuthRole;
  status?: string;
  createdAt?: string;
  memberships: Array<{
    id: string;
    organisationId: string;
    role: string;
    membershipStatus: string;
    isDefaultOrganisation?: boolean;
  }>;
}

export const platformUserService = {
  /**
   * Aggregates platform user identity records with their active/historical organisation memberships.
   */
  async listPlatformUsers(): Promise<PlatformUserSummary[]> {
    const usersSnap = await getDocs(collection(db, 'users'));
    const membershipsSnap = await getDocs(collection(db, 'organisationMemberships'));

    const membershipsByUser = new Map<string, OrganisationMembership[]>();

    membershipsSnap.forEach((d) => {
      const m = d.data() as OrganisationMembership;
      const list = membershipsByUser.get(m.userId) || [];
      list.push(m);
      membershipsByUser.set(m.userId, list);
    });

    const results: PlatformUserSummary[] = [];

    usersSnap.forEach((d) => {
      const data = d.data() as {
        uid?: string;
        email?: string;
        displayName?: string;
        role?: AuthRole;
        platformRole?: PlatformRole;
        status?: string;
        createdAt?: string;
      };

      const uid = d.id || data.uid || '';
      const userMemberships = membershipsByUser.get(uid) || [];

      results.push({
        uid,
        email: data.email || 'No email',
        displayName: data.displayName || undefined,
        platformRole: data.platformRole || (data.role === 'super_admin' ? 'super_admin' : null),
        legacyRole: data.role,
        status: data.status || 'active',
        createdAt: data.createdAt,
        memberships: userMemberships.map((m) => ({
          id: m.id,
          organisationId: m.organisationId,
          role: m.role,
          membershipStatus: m.membershipStatus,
          isDefaultOrganisation: m.isDefaultOrganisation
        }))
      });
    });

    return results;
  }
};
