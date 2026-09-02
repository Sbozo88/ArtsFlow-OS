import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChargeType } from '../types';
import { chargeTypeService } from '../services/chargeTypeService';

export const useChargeTypes = () => {
  const [chargeTypes, setChargeTypes] = useState<ChargeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organisationId } = useAuth();

  const loadData = useCallback(async () => {
    if (!organisationId) return;
    try {
      const data = await chargeTypeService.getChargeTypes(organisationId);
      setChargeTypes(data);
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
        const data = await chargeTypeService.getChargeTypes(organisationId);
        if (mounted) {
          setChargeTypes(data);
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

  return { chargeTypes, loading, error, refresh: loadData };
};
