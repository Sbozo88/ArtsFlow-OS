import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useActiveOrganisation } from './ActiveOrganisationContext';
import { entitlementResolverService } from '../services/entitlementResolverService';
import type { EffectiveEntitlement } from '../types';

export interface EntitlementContextType {
  entitlements: Record<string, EffectiveEntitlement>;
  hasFeature: (featureKey: string) => boolean;
  getLimit: (featureKey: string) => number | null;
  loading: boolean;
  error: string | null;
  refreshEntitlements: () => Promise<void>;
}

const EntitlementContext = createContext<EntitlementContextType>({
  entitlements: {},
  hasFeature: () => true, // default allow during uninitialized state
  getLimit: () => null,
  loading: true,
  error: null,
  refreshEntitlements: async () => {}
});

export const useEntitlements = () => useContext(EntitlementContext);

export const EntitlementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeOrganisationId: organisationId } = useActiveOrganisation();
  const [entitlements, setEntitlements] = useState<Record<string, EffectiveEntitlement>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntitlements = useCallback(async (orgId: string | null) => {
    if (!orgId) {
      setEntitlements({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await entitlementResolverService.getOrganisationEntitlements(orgId);
      setEntitlements(data);
    } catch (err) {
      console.error('[EntitlementProvider] Failed to load entitlements:', err);
      setError((err as Error).message || 'Failed to load organisation entitlements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!organisationId) {
      Promise.resolve().then(() => {
        if (isMounted) {
          setEntitlements({});
          setLoading(false);
        }
      });
      return () => {
        isMounted = false;
      };
    }

    entitlementResolverService
      .getOrganisationEntitlements(organisationId)
      .then((data) => {
        if (isMounted) {
          setEntitlements(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError((err as Error).message || 'Failed to load organisation entitlements');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [organisationId]);

  const refreshEntitlements = async () => {
    if (organisationId) {
      entitlementResolverService.invalidateCache(organisationId);
      await loadEntitlements(organisationId);
    }
  };

  const hasFeature = useCallback(
    (featureKey: string): boolean => {
      // If no organisation selected (e.g. platform routes), allow through to platform route guard
      if (!organisationId) return true;

      const ent = entitlements[featureKey];
      if (!ent) return false;
      return ent.enabled === true;
    },
    [organisationId, entitlements]
  );

  const getLimit = useCallback(
    (featureKey: string): number | null => {
      if (!organisationId) return null;
      const ent = entitlements[featureKey];
      if (!ent || !ent.enabled) return 0;
      return ent.limitValue !== undefined ? ent.limitValue : null;
    },
    [organisationId, entitlements]
  );

  return (
    <EntitlementContext.Provider
      value={{
        entitlements,
        hasFeature,
        getLimit,
        loading,
        error,
        refreshEntitlements
      }}
    >
      {children}
    </EntitlementContext.Provider>
  );
};
