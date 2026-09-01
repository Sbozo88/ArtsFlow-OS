import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TransportProvider } from '../types';
import { transportProviderService } from '../services/transportProviderService';

export const useTransportProviders = () => {
  const [providers, setProviders] = useState<TransportProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId) return;
    try {
      const data = await transportProviderService.getProviders(organisationId);
      setProviders(data);
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
        const data = await transportProviderService.getProviders(organisationId);
        if (mounted) {
          setProviders(data);
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

  return { providers, loading, error, refresh: loadData };
};
