import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { organisationRepository } from '../repositories/organisationRepository';
import { tenantContextService } from '../services/tenantContextService';
import type { Organisation, OrganisationMembershipView, OrganisationRole } from '../types';

interface ActiveOrganisationContextValue {
  activeOrganisation: Organisation | null;
  activeOrganisationId: string | null;
  activeMembership: ReturnType<typeof useAuth>['activeMembership'];
  activeMembershipRole: OrganisationRole | null;
  availableOrganisations: OrganisationMembershipView[];
  switchOrganisation: (organisationId: string) => Promise<void>;
  setDefaultOrganisation: (organisationId: string) => Promise<void>;
  refreshOrganisationContext: () => Promise<void>;
  isResolvingOrganisation: boolean;
  isSwitchingOrganisation: boolean;
  organisationError: string | null;
}

const ActiveOrganisationContext = createContext<ActiveOrganisationContextValue | null>(null);

export function ActiveOrganisationProvider({ children }: { children: React.ReactNode }) {
  const authContext = useAuth();
  const {
    user, organisationId, activeMembership, memberships, switchOrganisation,
    refreshAuth, isSwitchingOrganisation, organisationError
  } = authContext;
  const [activeOrganisation, setActiveOrganisation] = useState<Organisation | null>(null);
  const [availableOrganisations, setAvailableOrganisations] = useState<OrganisationMembershipView[]>([]);
  const [isResolvingOrganisation, setIsResolvingOrganisation] = useState(true);
  const generation = useRef(0);

  const loadOrganisations = useCallback(async () => {
    const requestGeneration = ++generation.current;
    const active = memberships.filter((membership) => membership.membershipStatus === 'active');
    if (active.length === 0) {
      setAvailableOrganisations([]);
      setActiveOrganisation(null);
      setIsResolvingOrganisation(false);
      return;
    }

    try {
      const views = (await Promise.all(active.map(async (membership) => {
        const organisation = await organisationRepository.getById(membership.organisationId).catch(() => null);
        return organisation ? { membership, organisation } : null;
      }))).filter((view): view is OrganisationMembershipView => view !== null);

      if (requestGeneration !== generation.current) return;
      setAvailableOrganisations(views);
      setActiveOrganisation(views.find((view) => view.organisation.id === organisationId)?.organisation || null);
    } catch (err) {
      console.warn('[ActiveOrganisationContext] Error resolving organisations:', err);
    } finally {
      if (requestGeneration === generation.current) {
        setIsResolvingOrganisation(false);
      }
    }
  }, [memberships, organisationId]);

  useEffect(() => {
    let isMounted = true;
    const requestGeneration = ++generation.current;
    const active = memberships.filter((membership) => membership.membershipStatus === 'active');

    Promise.resolve().then(async () => {
      if (active.length === 0) {
        if (isMounted && requestGeneration === generation.current) {
          setAvailableOrganisations([]);
          setActiveOrganisation(null);
          setIsResolvingOrganisation(false);
        }
        return;
      }

      try {
        const results = await Promise.all(
          active.map(async (membership) => {
            const organisation = await organisationRepository.getById(membership.organisationId).catch(() => null);
            return organisation ? { membership, organisation } : null;
          })
        );

        if (!isMounted || requestGeneration !== generation.current) return;
        const views = results.filter((view): view is OrganisationMembershipView => view !== null);
        setAvailableOrganisations(views);
        setActiveOrganisation(views.find((view) => view.organisation.id === organisationId)?.organisation || null);
      } catch (err) {
        console.warn('[ActiveOrganisationContext] Error in organisation resolution effect:', err);
      } finally {
        if (isMounted && requestGeneration === generation.current) {
          setIsResolvingOrganisation(false);
        }
      }
    });

    return () => {
      isMounted = false;
      generation.current += 1;
    };
  }, [memberships, organisationId]);

  const setDefaultOrganisation = useCallback(async (targetOrganisationId: string) => {
    if (!user) throw new Error('You must be signed in to change your default organisation.');
    await tenantContextService.setDefaultOrganisation(user.uid, targetOrganisationId, user.uid);
    await refreshAuth();
  }, [user, refreshAuth]);

  const value = useMemo<ActiveOrganisationContextValue>(() => ({
    activeOrganisation,
    activeOrganisationId: organisationId,
    activeMembership,
    activeMembershipRole: (activeMembership?.role as OrganisationRole | undefined) || null,
    availableOrganisations,
    switchOrganisation,
    setDefaultOrganisation,
    refreshOrganisationContext: loadOrganisations,
    isResolvingOrganisation,
    isSwitchingOrganisation,
    organisationError
  }), [
    activeOrganisation, organisationId, activeMembership, availableOrganisations,
    switchOrganisation, setDefaultOrganisation, loadOrganisations,
    isResolvingOrganisation, isSwitchingOrganisation, organisationError
  ]);

  return <ActiveOrganisationContext.Provider value={value}>{children}</ActiveOrganisationContext.Provider>;
}

export function useActiveOrganisation(): ActiveOrganisationContextValue {
  const context = useContext(ActiveOrganisationContext);
  if (!context) throw new Error('useActiveOrganisation must be used within ActiveOrganisationProvider');
  return context;
}
