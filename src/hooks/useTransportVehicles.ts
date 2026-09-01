import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TransportVehicle } from '../types';
import { transportVehicleService } from '../services/transportVehicleService';

export const useTransportVehicles = (providerId?: string) => {
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId) return;
    try {
      const data = await transportVehicleService.getVehicles(organisationId, providerId);
      setVehicles(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [organisationId, providerId]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const init = async () => {
      try {
        const data = await transportVehicleService.getVehicles(organisationId, providerId);
        if (mounted) {
          setVehicles(data);
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
  }, [organisationId, providerId]);

  return { vehicles, loading, error, refresh: loadData };
};
