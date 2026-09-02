import React, { useState } from 'react';
import { 
  Building2, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  Mail, 
  MapPin 
} from 'lucide-react';
import { SettingsNav } from './components/SettingsNav';
import { useOrganisationSettings } from '../../hooks/useOrganisationSettings';
import type { OrganisationProfileSettings, OrganisationType } from '../../types';

const COMMON_TIMEZONES = [
  'Africa/Johannesburg',
  'Africa/Cairo',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Toronto',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney'
];

const CURRENCIES = [
  { code: 'ZAR', label: 'ZAR — South African Rand' },
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'KES', label: 'KES — Kenyan Shilling' },
  { code: 'NGN', label: 'NGN — Nigerian Naira' }
];

const ORGANISATION_TYPES: { type: OrganisationType; label: string }[] = [
  { type: 'school_arts_programme', label: 'School Arts Programme' },
  { type: 'community_arts_project', label: 'Community Arts Project' },
  { type: 'music_school', label: 'Music School' },
  { type: 'dance_school', label: 'Dance School' },
  { type: 'arts_organisation', label: 'Arts Organisation / Theatre' },
  { type: 'academy', label: 'Academy / Conservatory' },
  { type: 'nonprofit', label: 'Nonprofit Organisation' },
  { type: 'other', label: 'Other Arts Project' }
];

interface FormProps {
  initialData: OrganisationProfileSettings;
  onSave: (data: OrganisationProfileSettings) => Promise<void>;
}

const OrganisationProfileForm: React.FC<FormProps> = ({ initialData, onSave }) => {
  const [formData, setFormData] = useState<OrganisationProfileSettings>(initialData);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await onSave(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const e = err as Error;
      setError(e.message || 'Failed to update organisation profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Core Identity
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Organisation Profile</h1>
          <p className="text-sm text-slate-500">
            Manage official organisation registration, contact details, timezone, and operational defaults.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Organisation profile settings successfully saved!</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity & Legal Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Legal Identity</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Organisation Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Organisation Type *
              </label>
              <select
                value={formData.organisationType}
                onChange={e => setFormData({ ...formData, organisationType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {ORGANISATION_TYPES.map(t => (
                  <option key={t.type} value={t.type}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Registration Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 2021/123456/08"
                value={formData.registrationNumber || ''}
                onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tax / VAT Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 4010293847"
                value={formData.taxNumber || ''}
                onChange={e => setFormData({ ...formData, taxNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Regional & Timezone Defaults */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Globe className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Regional & Timezone Preferences</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Timezone *
              </label>
              <select
                value={formData.timezone}
                onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs"
              >
                {COMMON_TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">Used for sessions, timetables, due dates, and reporting.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Default Currency *
              </label>
              <select
                value={formData.defaultCurrency}
                onChange={e => setFormData({ ...formData, defaultCurrency: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Locale *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. en-ZA, en-GB, en-US"
                value={formData.locale}
                onChange={e => setFormData({ ...formData, locale: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Mail className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Official Contact Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="admin@organisation.org"
                value={formData.email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone / Mobile Number
              </label>
              <input
                type="tel"
                placeholder="+27 (0) 11 123 4567"
                value={formData.phone || ''}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Website URL
              </label>
              <input
                type="url"
                placeholder="https://organisation.org"
                value={formData.website || ''}
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Physical Address */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Physical Address</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                placeholder="Street address or P.O. Box"
                value={formData.addressLine1 || ''}
                onChange={e => setFormData({ ...formData, addressLine1: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                placeholder="Apartment, suite, unit, building, floor"
                value={formData.addressLine2 || ''}
                onChange={e => setFormData({ ...formData, addressLine2: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                City
              </label>
              <input
                type="text"
                placeholder="e.g. Johannesburg, Cape Town"
                value={formData.city || ''}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Province / State
              </label>
              <input
                type="text"
                placeholder="e.g. Gauteng, Western Cape"
                value={formData.provinceState || ''}
                onChange={e => setFormData({ ...formData, provinceState: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Postal Code
              </label>
              <input
                type="text"
                placeholder="e.g. 2000"
                value={formData.postalCode || ''}
                onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Country
              </label>
              <input
                type="text"
                placeholder="e.g. South Africa"
                value={formData.country}
                onChange={e => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export const OrganisationProfilePage: React.FC = () => {
  const { settings, loading, updateSection } = useOrganisationSettings();

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <SettingsNav />
      <OrganisationProfileForm
        initialData={settings.profile}
        onSave={data => updateSection('profile', data)}
      />
    </div>
  );
};
