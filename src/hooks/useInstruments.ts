import { useState, useEffect } from 'react';
import { instrumentRepository } from '../repositories/instrumentRepository';
import { useAuth } from '../contexts/AuthContext';
import type { Instrument } from '../types';
import { query, where, onSnapshot } from 'firebase/firestore';

export const useInstruments = () => {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organisationId } = useAuth();

  useEffect(() => {
    if (!organisationId) {
      return;
    }

    const q = query(
      instrumentRepository.getCollection(),
      where('organisationId', '==', organisationId),
      where('status', '!=', 'deleted')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Instrument);
      setInstruments(data);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching instruments:', err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organisationId]);

  return { instruments, loading, error };
};
