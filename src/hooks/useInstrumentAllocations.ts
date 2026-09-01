import { useState, useEffect } from 'react';
import { instrumentAllocationRepository } from '../repositories/instrumentAllocationRepository';
import { useAuth } from '../contexts/AuthContext';
import type { InstrumentAllocation } from '../types';
import { query, where, onSnapshot } from 'firebase/firestore';

export const useInstrumentAllocations = () => {
  const [allocations, setAllocations] = useState<InstrumentAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organisationId } = useAuth();

  useEffect(() => {
    if (!organisationId) {
      return;
    }

    const q = query(
      instrumentAllocationRepository.getCollection(),
      where('organisationId', '==', organisationId),
      where('status', '!=', 'deleted')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as InstrumentAllocation);
      setAllocations(data);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching allocations:', err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organisationId]);

  return { allocations, loading, error };
};
