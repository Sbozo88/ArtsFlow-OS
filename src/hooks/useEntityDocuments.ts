import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DocumentRecord } from '../types';
import { documentService } from '../services/documentService';

export const useEntityDocuments = (entityType?: string, entityId?: string) => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId || !entityType || !entityId) return;
    try {
      const data = await documentService.getEntityDocuments(organisationId, entityType, entityId);
      setDocuments(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [organisationId, entityType, entityId]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId || !entityType || !entityId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const init = async () => {
      try {
        const data = await documentService.getEntityDocuments(organisationId, entityType, entityId);
        if (mounted) {
          setDocuments(data);
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
  }, [organisationId, entityType, entityId]);

  return { documents, loading, error, refresh: loadData };
};
