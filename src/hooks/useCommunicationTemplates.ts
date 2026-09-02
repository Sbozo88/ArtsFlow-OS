import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CommunicationTemplate, TemplateCategory } from '../types';
import { communicationTemplateService } from '../services/communicationTemplateService';

export const useCommunicationTemplates = (category?: TemplateCategory) => {
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId) return;
    try {
      const data = await communicationTemplateService.getTemplates(organisationId, category);
      setTemplates(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [organisationId, category]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const init = async () => {
      try {
        const data = await communicationTemplateService.getTemplates(organisationId, category);
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
  }, [organisationId, category]);

  return { templates, loading, error, refresh: loadData };
};
