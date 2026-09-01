import { useState, useEffect } from 'react';
import { repertoireRepository } from '../repositories/repertoireRepository';
import { useAuth } from '../contexts/AuthContext';
import type { Repertoire } from '../types';
import { query, where, onSnapshot } from 'firebase/firestore';

export const useRepertoire = () => {
  const [repertoire, setRepertoire] = useState<Repertoire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organisationId } = useAuth();

  useEffect(() => {
    if (!organisationId) {
      return;
    }

    const q = query(
      repertoireRepository.getCollection(),
      where('organisationId', '==', organisationId),
      where('status', '!=', 'deleted')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Repertoire);
      setRepertoire(data);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching repertoire:', err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organisationId]);

  return { repertoire, loading, error };
};
