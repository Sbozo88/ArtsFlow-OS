import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { AuthUser, OrganisationMembership, PlatformRole } from '../types';
import { organisationMembershipRepository } from '../repositories/organisationMembershipRepository';

interface AuthContextType {
  user: FirebaseUser | null;
  authUser: AuthUser | null;
  organisationId: string | null;
  activeMembership: OrganisationMembership | null;
  memberships: OrganisationMembership[];
  switchOrganisation: (orgId: string) => Promise<void>;
  loading: boolean;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  authUser: null,
  organisationId: null,
  activeMembership: null,
  memberships: [],
  switchOrganisation: async () => {},
  loading: true,
  logout: async () => {},
  refreshAuth: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [activeMembership, setActiveMembership] = useState<OrganisationMembership | null>(null);
  const [memberships, setMemberships] = useState<OrganisationMembership[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserDoc = async (
    uid: string,
    email: string | null,
    displayName: string | null,
    targetOrgId?: string | null
  ) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      const userData = userDoc.exists() ? userDoc.data() : null;

      // 1. Resolve Platform Role
      const platformRole: PlatformRole = userData?.platformRole || (userData?.role === 'super_admin' ? 'super_admin' : null);

      // 2. Fetch User Memberships
      let userMemberships: OrganisationMembership[] = [];
      try {
        userMemberships = await organisationMembershipRepository.getByUserId(uid);
      } catch (err) {
        console.warn('Could not query organisationMemberships, falling back to user document:', err);
      }

      setMemberships(userMemberships);

      // 3. Resolve Active Membership
      let resolvedMembership: OrganisationMembership | null = null;
      if (userMemberships.length > 0) {
        if (targetOrgId) {
          resolvedMembership = userMemberships.find(m => m.organisationId === targetOrgId) || null;
        }
        if (!resolvedMembership) {
          resolvedMembership =
            userMemberships.find(m => m.isDefaultOrganisation && m.membershipStatus === 'active') ||
            userMemberships.find(m => m.membershipStatus === 'active') ||
            userMemberships[0];
        }
      }

      setActiveMembership(resolvedMembership);

      // 4. Resolve Organisation ID and Role (with legacy fallback)
      let resolvedOrgId: string | null = null;
      let resolvedRole = userData?.role;

      if (resolvedMembership) {
        resolvedOrgId = resolvedMembership.organisationId;
        resolvedRole = resolvedMembership.role;
      } else if (userData?.organisationId) {
        // Fallback: Legacy v1.0 user document
        resolvedOrgId = userData.organisationId;
        resolvedRole = userData.role;
      }

      setOrganisationId(resolvedOrgId);

      // 5. Account status determination
      const isAccountDisabled = userData?.status === 'disabled' || (resolvedMembership && (resolvedMembership.membershipStatus === 'disabled' || resolvedMembership.membershipStatus === 'revoked'));

      setAuthUser({
        uid,
        email,
        displayName,
        role: resolvedRole,
        platformRole,
        accountStatus: isAccountDisabled ? 'disabled' : 'active',
        activeMembershipId: resolvedMembership?.id
      });
    } catch (e) {
      console.error('Error fetching user document & memberships:', e);
      setOrganisationId(null);
      setActiveMembership(null);
      setMemberships([]);
    }
  };

  const switchOrganisation = async (newOrgId: string) => {
    if (user) {
      await fetchUserDoc(user.uid, user.email, user.displayName, newOrgId);
    }
  };

  const refreshAuth = async () => {
    if (user) {
      await fetchUserDoc(user.uid, user.email, user.displayName, organisationId);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserDoc(currentUser.uid, currentUser.email, currentUser.displayName);
      } else {
        setAuthUser(null);
        setOrganisationId(null);
        setActiveMembership(null);
        setMemberships([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authUser,
        organisationId,
        activeMembership,
        memberships,
        switchOrganisation,
        loading,
        logout,
        refreshAuth
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
