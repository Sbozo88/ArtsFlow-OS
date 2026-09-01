import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ConsentTemplate } from '../types';
import { consentTemplateService } from '../services/consentTemplateService';

export const useConsentTemplates = () => {
  const [templates, setTemplates] = useState<ConsentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId) return;
    try {
      const data = await consentTemplateService.getTemplates(organisationId);
      setTemplates(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [organisationId]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const init = async () => {
      try {
        const data = await consentTemplateService.getTemplates(organisationId);
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
  }, [organisationId]);

  return { templates, loading, error, refresh: loadData };
};
