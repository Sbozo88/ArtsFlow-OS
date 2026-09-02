import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { organisationSettingsService, DEFAULT_SETTINGS } from '../services/organisationSettingsService';
import type { OrganisationSettings } from '../types';

export function useOrganisationSettings() {
  const { organisationId, authUser } = useAuth();
  const [settings, setSettings] = useState<OrganisationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!organisationId) {
      return;
    }

    const docRef = doc(db, 'organisationSettings', organisationId);
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const defaults = DEFAULT_SETTINGS(organisationId);
          const data = snap.data() as Partial<OrganisationSettings>;
          setSettings({
            ...defaults,
            ...data,
            profile: { ...defaults.profile, ...(data.profile || {}) },
            branding: { ...defaults.branding, ...(data.branding || {}) },
            programmes: { ...defaults.programmes, ...(data.programmes || {}) },
            attendance: { ...defaults.attendance, ...(data.attendance || {}) },
            finance: { ...defaults.finance, ...(data.finance || {}) },
            staff: { ...defaults.staff, ...(data.staff || {}) },
            consent: { ...defaults.consent, ...(data.consent || {}) },
            transport: { ...defaults.transport, ...(data.transport || {}) },
            communication: { ...defaults.communication, ...(data.communication || {}) },
            automation: { ...defaults.automation, ...(data.automation || {}) },
            documents: { ...defaults.documents, ...(data.documents || {}) },
            system: { ...defaults.system, ...(data.system || {}) }
          });
        } else {
          // Initialize defaults
          setSettings(DEFAULT_SETTINGS(organisationId));
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error loading organisation settings:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [organisationId]);

  const updateSection = useCallback(
    async <K extends keyof OrganisationSettings>(section: K, data: Partial<OrganisationSettings[K]>) => {
      if (!organisationId || !authUser) throw new Error('Not authenticated.');
      await organisationSettingsService.updateSection(organisationId, authUser.uid, section, data);
    },
    [organisationId, authUser]
  );

  return {
    settings,
    loading,
    error,
    updateSection
  };
}
