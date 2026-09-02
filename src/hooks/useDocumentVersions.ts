import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DocumentVersion } from '../types';
import { documentVersionService } from '../services/documentVersionService';

export const useDocumentVersions = (documentId?: string) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId || !documentId) return;
    try {
      const data = await documentVersionService.getDocumentVersions(organisationId, documentId);
      setVersions(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [organisationId, documentId]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId || !documentId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const init = async () => {
      try {
        const data = await documentVersionService.getDocumentVersions(organisationId, documentId);
        if (mounted) {
          setVersions(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();
    return () => { mounted = false; };
  }, [organisationId, documentId]);

  return { versions, loading, error, refresh: loadData };
};
