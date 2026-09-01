import { useState, useEffect } from 'react';
import { musicAssessmentRepository } from '../repositories/musicAssessmentRepository';
import { useAuth } from '../contexts/AuthContext';
import type { MusicAssessment } from '../types';
import { query, where, onSnapshot } from 'firebase/firestore';

export const useMusicAssessments = () => {
  const [assessments, setAssessments] = useState<MusicAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organisationId } = useAuth();

  useEffect(() => {
    if (!organisationId) {
      return;
    }

    const q = query(
      musicAssessmentRepository.getCollection(),
      where('organisationId', '==', organisationId),
      where('status', '!=', 'deleted')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as MusicAssessment);
      setAssessments(data);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching assessments:', err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organisationId]);

  return { assessments, loading, error };
};
