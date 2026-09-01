import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ConsentRequest } from '../types';
import { consentRequestService } from '../services/consentRequestService';

export const useConsentRequests = (eventId?: string) => {
  const [requests, setRequests] = useState<ConsentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId) return;
    try {
      const data = await consentRequestService.getConsentRequests(organisationId, eventId);
      setRequests(data);
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
        const data = await consentRequestService.getConsentRequests(organisationId, eventId);
        if (mounted) {
          setRequests(data);
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

  return { requests, loading, error, refresh: loadData };
};
