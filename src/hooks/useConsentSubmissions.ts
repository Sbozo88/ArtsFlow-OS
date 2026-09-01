import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ConsentSubmission } from '../types';
import { consentSubmissionService } from '../services/consentSubmissionService';

export const useConsentSubmissions = (eventId?: string) => {
  const [submissions, setSubmissions] = useState<ConsentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId) return;
    try {
      const data = await consentSubmissionService.getSubmissions(organisationId, eventId);
      setSubmissions(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [organisationId, eventId]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const init = async () => {
      try {
        const data = await consentSubmissionService.getSubmissions(organisationId, eventId);
        if (mounted) {
          setSubmissions(data);
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
  }, [organisationId, eventId]);

  return { submissions, loading, error, refresh: loadData };
};
