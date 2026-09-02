import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DocumentRecord, DocumentType, DocumentStatus } from '../types';
import { documentService } from '../services/documentService';

export const useDocuments = (filters?: {
  documentType?: DocumentType;
  documentStatus?: DocumentStatus;
  relatedEntityType?: string;
  relatedEntityId?: string;
  search?: string;
}) => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId) return;
    try {
      const data = await documentService.getDocuments(organisationId, filters);
      setDocuments(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [
    organisationId,
    filters?.documentType,
    filters?.documentStatus,
    filters?.relatedEntityType,
    filters?.relatedEntityId,
    filters?.search
  ]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const init = async () => {
      try {
        const data = await documentService.getDocuments(organisationId, filters);
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
  }, [
    organisationId,
    filters?.documentType,
    filters?.documentStatus,
    filters?.relatedEntityType,
    filters?.relatedEntityId,
    filters?.search
  ]);

  return { documents, loading, error, refresh: loadData };
};
