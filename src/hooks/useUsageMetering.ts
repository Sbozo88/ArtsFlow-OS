import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { usageMeteringService } from '../services/usageMeteringService';
import type { OrganisationUsageSummary, LimitMeterKey, LimitCheckResult } from '../types';

export function useUsageMetering() {
  const { organisationId, authUser } = useAuth();
  const [summary, setSummary] = useState<OrganisationUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!organisationId) {
      setSummary(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await usageMeteringService.getUsageMeters(organisationId);
      setSummary(res);
      setError(null);
    } catch (err: any) {
      console.warn('Could not fetch usage metering summary:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [organisationId]);

  const syncUsage = useCallback(async () => {
    if (!organisationId) return;
    try {
      setSyncing(true);
      const updated = await usageMeteringService.syncAllUsage(organisationId, authUser?.uid || 'user');
      setSummary(updated);
    } catch (err: any) {
      console.error('Failed to sync usage:', err);
    } finally {
      setSyncing(false);
    }
  }, [organisationId, authUser]);

  const checkLimit = useCallback(
    async (meterKey: LimitMeterKey, delta: number = 1): Promise<LimitCheckResult> => {
      if (!organisationId) {
        return {
          allowed: true,
          key: meterKey,
          current: 0,
          limit: null,
          projected: delta,
          percentUsed: 0,
          status: 'ok'
        };
      }
      return usageMeteringService.checkLimit(organisationId, meterKey, delta);
    },
    [organisationId]
  );

  useEffect(() => {
    fetchSummary();

    if (!organisationId) return;

    // Real-time listener on usage document
    const docId = `usage_${organisationId}`;
    const usageDocRef = doc(db, 'organisationUsage', docId);
    const unsub = onSnapshot(usageDocRef, () => {
      fetchSummary();
    }, (err) => {
      console.warn('Error listening to organisation usage document:', err);
    });

    return () => {
      unsub();
    };
  }, [organisationId, fetchSummary]);

  return {
    summary,
    loading,
    syncing,
    error,
    refresh: fetchSummary,
    syncUsage,
    checkLimit
  };
}
