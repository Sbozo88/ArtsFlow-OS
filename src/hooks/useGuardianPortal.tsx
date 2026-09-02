import React, { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { guardianAccessService, ResolvedGuardianContext, GuardianAccessError } from '../services/guardianAccessService';
import type { Learner } from '../types';

interface GuardianPortalContextType {
  context: ResolvedGuardianContext | null;
  loading: boolean;
  error: GuardianAccessError | Error | null;
  selectedLearnerId: string | null;
  setSelectedLearnerId: (id: string) => void;
  selectedLearner: Learner | null;
  refresh: () => Promise<void>;
}

const GuardianPortalContext = createContext<GuardianPortalContextType>({
  context: null,
  loading: true,
  error: null,
  selectedLearnerId: null,
  setSelectedLearnerId: () => {},
  selectedLearner: null,
  refresh: async () => {}
});

export const useGuardianPortal = () => useContext(GuardianPortalContext);

export const GuardianPortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authUser, organisationId } = useAuth();
  const [context, setContext] = useState<ResolvedGuardianContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<GuardianAccessError | Error | null>(null);
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    if (!authUser || !organisationId) return;

    const loadPortalData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await guardianAccessService.resolveGuardianContext(organisationId, authUser.uid);
        if (mounted) {
          setContext(res);
          if (res.linkedLearners.length > 0) {
            setSelectedLearnerId(prev => {
              if (prev && res.linkedLearners.some(l => l.id === prev)) return prev;
              return res.linkedLearners[0].id;
            });
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setContext(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPortalData();
    return () => { mounted = false; };
  }, [authUser, organisationId, refreshIndex]);

  const selectedLearner = context?.linkedLearners.find(l => l.id === selectedLearnerId) || null;

  const handleRefresh = async () => {
    setRefreshIndex(prev => prev + 1);
  };

  return (
    <GuardianPortalContext.Provider
      value={{
        context,
        loading,
        error,
        selectedLearnerId,
        setSelectedLearnerId,
        selectedLearner,
        refresh: handleRefresh
      }}
    >
      {children}
    </GuardianPortalContext.Provider>
  );
};
