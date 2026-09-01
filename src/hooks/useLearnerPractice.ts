import { useState, useEffect } from 'react';
import { practiceLogRepository } from '../repositories/practiceLogRepository';
import { useAuth } from '../contexts/AuthContext';
import type { PracticeLog } from '../types';
import { query, where, onSnapshot } from 'firebase/firestore';

export const useLearnerPractice = (learnerId?: string) => {
  const [practiceLogs, setPracticeLogs] = useState<PracticeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organisationId } = useAuth();

  useEffect(() => {
    if (!organisationId || !learnerId) {
      return;
    }

    const q = query(
      practiceLogRepository.getCollection(),
      where('organisationId', '==', organisationId),
      where('learnerId', '==', learnerId),
      where('status', '!=', 'deleted')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as PracticeLog);
      setPracticeLogs(data);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching learner practice:', err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organisationId, learnerId]);

  return { practiceLogs, loading, error };
};
