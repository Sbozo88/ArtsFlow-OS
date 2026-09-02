import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CommunicationRecipient } from '../types';
import { communicationService } from '../services/communicationService';

export const useCommunicationRecipients = (communicationId?: string) => {
  const [recipients, setRecipients] = useState<CommunicationRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId || !communicationId) return;
    try {
      const data = await communicationService.getRecipientsForCommunication(organisationId, communicationId);
      setRecipients(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [organisationId, communicationId]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId || !communicationId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const init = async () => {
      try {
        const data = await communicationService.getRecipientsForCommunication(organisationId, communicationId);
        if (mounted) {
          setRecipients(data);
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
  }, [organisationId, communicationId]);

  return { recipients, loading, error, refresh: loadData };
};
