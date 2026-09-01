import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { danceAssessmentService } from '../services/danceAssessmentService';
import type { DanceAssessment } from '../types';

export function useDanceAssessments() {
  const { organisationId } = useAuth();
  const [assessments, setAssessments] = useState<DanceAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const fetch = async () => {
      try {
        setLoading(true);
        const data = await danceAssessmentService.getAssessments(organisationId);
        if (mounted) { setAssessments(data); setError(null); }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [organisationId]);

  return { assessments, loading, error };
}
