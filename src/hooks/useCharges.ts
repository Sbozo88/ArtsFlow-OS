import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Charge, ChargeStatus } from '../types';
import { chargeService } from '../services/chargeService';

export const useCharges = (filters?: {
  learnerId?: string;
  chargeStatus?: ChargeStatus;
  programmeId?: string;
  eventId?: string;
}) => {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId) return;
    try {
      const data = await chargeService.getCharges(organisationId, filters);
      setCharges(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, [organisationId, filters?.learnerId, filters?.chargeStatus, filters?.programmeId, filters?.eventId]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const init = async () => {
      try {
        const data = await chargeService.getCharges(organisationId, filters);
        if (mounted) {
          setCharges(data);
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
  }, [organisationId, filters?.learnerId, filters?.chargeStatus, filters?.programmeId, filters?.eventId]);

  return { charges, loading, error, refresh: loadData };
};
