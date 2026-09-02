import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { guardianPortalService } from '../services/guardianPortalService';
import type { GuardianMessageDto } from '../types';

export function useGuardianMessages() {
  const { authUser, organisationId } = useAuth();
  const [messages, setMessages] = useState<GuardianMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    if (!authUser || !organisationId) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await guardianPortalService.getMessages(organisationId, authUser.uid);
        if (mounted) {
          setMessages(data);
        }
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchMessages();
    return () => { mounted = false; };
  }, [authUser, organisationId, refreshIndex]);

  const refresh = async () => {
    setRefreshIndex(prev => prev + 1);
  };

  return { messages, loading, error, refresh };
}
