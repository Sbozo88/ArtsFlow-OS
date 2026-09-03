import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { customerLifecycleService } from '../services/customerLifecycleService';
import type { CustomerLifecycleState } from '../types';

export function useCustomerLifecycle() {
  const { organisationId } = useAuth();
  const [lifecycle, setLifecycle] = useState<CustomerLifecycleState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLifecycle = useCallback(async () => {
    if (!organisationId) {
      setLifecycle(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const state = await customerLifecycleService.getLifecycleState(organisationId);
      setLifecycle(state);
      setError(null);
    } catch (err: any) {
      console.warn('Could not fetch customer lifecycle state:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [organisationId]);

  useEffect(() => {
    fetchLifecycle();

    if (!organisationId) return;

    // Real-time listener on organisation document to react promptly to status changes
    const orgDocRef = doc(db, 'organisations', organisationId);
    const unsubOrg = onSnapshot(orgDocRef, () => {
      fetchLifecycle();
    }, (err) => {
      console.warn('Error listening to organisation status changes:', err);
    });

    return () => {
      unsubOrg();
    };
  }, [organisationId, fetchLifecycle]);

  return {
    lifecycle,
    loading,
    error,
    refresh: fetchLifecycle
  };
}
