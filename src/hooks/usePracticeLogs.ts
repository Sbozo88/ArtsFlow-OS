import { useState, useEffect } from 'react';
import { practiceLogRepository } from '../repositories/practiceLogRepository';
import { useAuth } from '../contexts/AuthContext';
import type { PracticeLog } from '../types';
import { query, where, onSnapshot } from 'firebase/firestore';

export const usePracticeLogs = () => {
  const [practiceLogs, setPracticeLogs] = useState<PracticeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organisationId } = useAuth();

  useEffect(() => {
    if (!organisationId) {
      return;
    }

    const q = query(
      practiceLogRepository.getCollection(),
      where('organisationId', '==', organisationId),
      where('status', '!=', 'deleted')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as PracticeLog);
      setPracticeLogs(data);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching practice logs:', err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organisationId]);

  return { practiceLogs, loading, error };
};
