import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { guardianPortalService } from '../services/guardianPortalService';
import type { GuardianDocumentDto } from '../types';

export function useGuardianDocuments(learnerId?: string | null) {
  const { authUser, organisationId } = useAuth();
  const [documents, setDocuments] = useState<GuardianDocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    if (!authUser || !organisationId) return;

    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await guardianPortalService.getDocuments(organisationId, authUser.uid, learnerId || undefined);
        if (mounted) {
          setDocuments(data);
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

    fetchDocuments();
    return () => { mounted = false; };
  }, [authUser, organisationId, learnerId, refreshIndex]);

  const refresh = async () => {
    setRefreshIndex(prev => prev + 1);
  };

  return { documents, loading, error, refresh };
}
