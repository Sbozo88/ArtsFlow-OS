import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Communication, CommunicationType, CommunicationStatus, CommunicationChannel } from '../types';
import { communicationService } from '../services/communicationService';

export const useCommunications = (filters?: {
  communicationType?: CommunicationType;
  communicationStatus?: CommunicationStatus;
  channel?: CommunicationChannel;
  relatedEntityType?: string;
  relatedEntityId?: string;
}) => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId) return;
    try {
      const data = await communicationService.getCommunications(organisationId, filters);
      setCommunications(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [
    organisationId, 
    filters?.communicationType, 
    filters?.communicationStatus, 
    filters?.channel, 
    filters?.relatedEntityType, 
    filters?.relatedEntityId
  ]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const init = async () => {
      try {
        const data = await communicationService.getCommunications(organisationId, filters);
        if (mounted) {
          setCommunications(data);
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
    filters?.communicationType, 
    filters?.communicationStatus, 
    filters?.channel, 
    filters?.relatedEntityType, 
    filters?.relatedEntityId
  ]);

  return { communications, loading, error, refresh: loadData };
};
