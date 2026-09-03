import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { AuthUser, OrganisationMembership, PlatformRole } from '../types';
import { organisationMembershipRepository } from '../repositories/organisationMembershipRepository';
import { organisationRepository } from '../repositories/organisationRepository';
import { userPreferencesRepository } from '../repositories/userPreferencesRepository';
import { tenantAccessService } from '../services/tenantAccessService';
import { tenantContextService } from '../services/tenantContextService';
import { entitlementResolverService } from '../services/entitlementResolverService';
import { organisationSettingsService } from '../services/organisationSettingsService';

interface AuthContextType {
  user: FirebaseUser | null;
  authUser: AuthUser | null;
  organisationId: string | null;
  activeMembership: OrganisationMembership | null;
  memberships: OrganisationMembership[];
  switchOrganisation: (orgId: string) => Promise<void>;
  isSwitchingOrganisation: boolean;
  organisationError: string | null;
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
  isSwitchingOrganisation: false,
  organisationError: null,
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
  const [isSwitchingOrganisation, setIsSwitchingOrganisation] = useState(false);
  const [organisationError, setOrganisationError] = useState<string | null>(null);
  const resolutionGeneration = useRef(0);

  const fetchUserDoc = useCallback(async (
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

      const activeMemberships = userMemberships.filter(m => m.membershipStatus === 'active');

      // 3. Resolve Active Membership
      let resolvedMembership: OrganisationMembership | null = null;
      if (activeMemberships.length > 0) {
        if (targetOrgId) {
          resolvedMembership = activeMemberships.find(m => m.organisationId === targetOrgId) || null;
        }
        if (!resolvedMembership && !targetOrgId) {
          const preferences = await userPreferencesRepository.get(uid).catch(() => null);
          resolvedMembership =
            activeMemberships.find(m => m.organisationId === preferences?.lastActiveOrganisationId) ||
            activeMemberships.find(m => m.isDefaultOrganisation) ||
            (activeMemberships.length === 1 ? activeMemberships[0] : null);
        }
      }

      setMemberships(userMemberships);
      setActiveMembership(resolvedMembership);

      // 4. Resolve Organisation ID and Role (with legacy fallback)
      let resolvedOrgId: string | null = null;
      let resolvedRole = userData?.role;

      if (resolvedMembership) {
        resolvedOrgId = resolvedMembership.organisationId;
        resolvedRole = resolvedMembership.role;
      } else if (userMemberships.length === 0 && userData?.organisationId && userData?.role !== 'super_admin') {
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
  }, []);

  const switchOrganisation = async (newOrgId: string) => {
    if (!user || newOrgId === organisationId) return;
    const generation = ++resolutionGeneration.current;
    setIsSwitchingOrganisation(true);
    setOrganisationError(null);
    try {
      const membership = await organisationMembershipRepository.getByUserAndOrg(user.uid, newOrgId);
      const organisation = await organisationRepository.getById(newOrgId);
      const validation = tenantAccessService.validateAccess(membership, organisation);
      if (!validation.allowed) {
        throw new Error(tenantAccessService.getAccessError(validation.reason));
      }

      await userPreferencesRepository.setLastActiveOrganisation(user.uid, newOrgId);
      if (generation !== resolutionGeneration.current) return;

      if (organisationId) {
        entitlementResolverService.invalidateCache(organisationId);
        organisationSettingsService.invalidateCache(organisationId);
      }
      await fetchUserDoc(user.uid, user.email, user.displayName, newOrgId);
      await tenantContextService.recordOrganisationSwitch(user.uid, organisationId, newOrgId, user.uid);
    } catch (error) {
      if (generation === resolutionGeneration.current) {
        setOrganisationError((error as Error).message || "We couldn't switch organisations. Your current workspace has not changed.");
      }
      throw error;
    } finally {
      if (generation === resolutionGeneration.current) setIsSwitchingOrganisation(false);
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
  }, [fetchUserDoc]);

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
        isSwitchingOrganisation,
        organisationError,
        loading,
        logout,
        refreshAuth
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
