import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DocumentTemplate, DocumentType } from '../types';
import { documentTemplateService } from '../services/documentTemplateService';

export const useDocumentTemplates = (documentType?: DocumentType) => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId) return;
    try {
      const data = await documentTemplateService.getTemplates(organisationId, documentType);
      setTemplates(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [organisationId, documentType]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const init = async () => {
      try {
        const data = await documentTemplateService.getTemplates(organisationId, documentType);
        if (mounted) {
          setTemplates(data);
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
  }, [organisationId, documentType]);

  return { templates, loading, error, refresh: loadData };
};
