import { useState, useEffect } from 'react';
import { instrumentAllocationRepository } from '../repositories/instrumentAllocationRepository';
import { useAuth } from '../contexts/AuthContext';
import type { InstrumentAllocation } from '../types';
import { query, where, onSnapshot } from 'firebase/firestore';

export const useLearnerInstruments = (learnerId?: string) => {
  const [allocations, setAllocations] = useState<InstrumentAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organisationId } = useAuth();

  useEffect(() => {
    if (!organisationId || !learnerId) {
      return;
    }

    const q = query(
      instrumentAllocationRepository.getCollection(),
      where('organisationId', '==', organisationId),
      where('learnerId', '==', learnerId),
      where('status', '!=', 'deleted')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as InstrumentAllocation);
      setAllocations(data);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching learner allocations:', err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organisationId, learnerId]);

  return { allocations, loading, error };
};
