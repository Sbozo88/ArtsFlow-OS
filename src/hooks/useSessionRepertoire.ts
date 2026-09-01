import { useState, useEffect } from 'react';
import { sessionRepertoireRepository } from '../repositories/sessionRepertoireRepository';
import { useAuth } from '../contexts/AuthContext';
import type { SessionRepertoire } from '../types';
import { query, where, onSnapshot } from 'firebase/firestore';

export const useSessionRepertoire = (sessionId?: string) => {
  const [sessionRepertoire, setSessionRepertoire] = useState<SessionRepertoire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { organisationId } = useAuth();

  useEffect(() => {
    if (!organisationId || !sessionId) {
      return;
    }

    const q = query(
      sessionRepertoireRepository.getCollection(),
      where('organisationId', '==', organisationId),
      where('sessionId', '==', sessionId),
      where('status', '!=', 'deleted')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as SessionRepertoire);
      setSessionRepertoire(data);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching session repertoire:', err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organisationId, sessionId]);

  return { sessionRepertoire, loading, error };
};
