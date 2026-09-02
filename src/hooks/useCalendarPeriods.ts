import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { calendarPeriodService, CreateCalendarPeriodInput } from '../services/calendarPeriodService';
import type { OrganisationCalendarPeriod } from '../types';

export function useCalendarPeriods(year?: number) {
  const { organisationId, authUser } = useAuth();
  const [periods, setPeriods] = useState<OrganisationCalendarPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!organisationId) {
      return;
    }

    const colRef = collection(db, 'organisationCalendarPeriods');
    const q = query(colRef, where('organisationId', '==', organisationId));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs
          .map(d => d.data() as OrganisationCalendarPeriod)
          .filter(p => p.periodStatus !== 'archived')
          .sort((a, b) => a.startDate.localeCompare(b.startDate));

        if (year) {
          setPeriods(items.filter(p => p.calendarYear === year));
        } else {
          setPeriods(items);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching calendar periods:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [organisationId, year]);

  const today = new Date().toISOString().split('T')[0];
  const activePeriod = periods.find(p => p.startDate <= today && p.endDate >= today && p.periodStatus === 'active') || null;

  const createPeriod = useCallback(
    async (input: CreateCalendarPeriodInput) => {
      if (!organisationId || !authUser) throw new Error('Not authenticated.');
      return calendarPeriodService.createPeriod(organisationId, authUser.uid, input);
    },
    [organisationId, authUser]
  );

  const updatePeriod = useCallback(
    async (id: string, updates: Partial<CreateCalendarPeriodInput>) => {
      if (!organisationId || !authUser) throw new Error('Not authenticated.');
      await calendarPeriodService.updatePeriod(organisationId, authUser.uid, id, updates);
    },
    [organisationId, authUser]
  );

  const archivePeriod = useCallback(
    async (id: string) => {
      if (!organisationId || !authUser) throw new Error('Not authenticated.');
      await calendarPeriodService.archivePeriod(organisationId, authUser.uid, id);
    },
    [organisationId, authUser]
  );

  return {
    periods,
    activePeriod,
    loading,
    error,
    createPeriod,
    updatePeriod,
    archivePeriod
  };
}
