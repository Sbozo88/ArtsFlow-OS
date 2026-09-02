import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { guardianPortalService } from '../services/guardianPortalService';
import type { GuardianConsentDetailDto } from '../types';

export function useGuardianConsent(learnerId?: string | null) {
  const { authUser, organisationId } = useAuth();
  const [consents, setConsents] = useState<GuardianConsentDetailDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    if (!authUser || !organisationId) return;

    const fetchConsents = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await guardianPortalService.getConsentList(organisationId, authUser.uid, learnerId || undefined);
        if (mounted) {
          setConsents(data);
        }
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchConsents();
    return () => { mounted = false; };
  }, [authUser, organisationId, learnerId, refreshIndex]);

  const refresh = async () => {
    setRefreshIndex(prev => prev + 1);
  };

  const submitConsent = async (
    requestId: string,
    input: {
      participationApproved: boolean;
      transportApproved?: boolean;
      indemnityAccepted?: boolean;
      medicalDeclaration?: string;
      additionalInfo?: string;
    }
  ) => {
    if (!authUser || !organisationId) throw new Error('Not authenticated.');
    const result = await guardianPortalService.submitConsent(organisationId, authUser.uid, requestId, input);
    await refresh();
    return result;
  };

  return { consents, loading, error, submitConsent, refresh };
}
