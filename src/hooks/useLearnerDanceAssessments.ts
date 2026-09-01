import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { danceAssessmentService } from '../services/danceAssessmentService';
import type { DanceAssessment } from '../types';

export function useLearnerDanceAssessments(learnerId: string | undefined) {
  const { organisationId } = useAuth();
  const [assessments, setAssessments] = useState<DanceAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!organisationId || !learnerId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const fetch = async () => {
      try {
        setLoading(true);
        const data = await danceAssessmentService.getAssessments(organisationId);
        const filtered = data.filter(a => a.learnerId === learnerId);
        if (mounted) { setAssessments(filtered); setError(null); }
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [organisationId, learnerId]);

  return { assessments, loading, error };
}
