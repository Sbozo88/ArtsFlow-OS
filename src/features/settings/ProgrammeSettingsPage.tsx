import React, { useState } from 'react';
import { Layers, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { SettingsNav } from './components/SettingsNav';
import { useOrganisationSettings } from '../../hooks/useOrganisationSettings';
import type { OrganisationProgrammeSettings, SessionType } from '../../types';

const PROGRAMME_TYPE_OPTIONS = [
  { id: 'music', label: 'Music (Instruments, Orchestras, Choirs)' },
  { id: 'dance', label: 'Dance (Ballet, Contemporary, Traditional)' },
  { id: 'drama', label: 'Drama & Acting' },
  { id: 'visual_arts', label: 'Visual Arts (Drawing, Painting, Sculpture)' },
  { id: 'theatre', label: 'Musical Theatre & Production' },
  { id: 'poetry', label: 'Creative Writing & Spoken Word' },
  { id: 'creative_arts', label: 'Multidisciplinary Creative Arts' },
  { id: 'other', label: 'Other Arts Discipline' }
];

interface FormProps {
  initialData: OrganisationProgrammeSettings;
  onSave: (data: OrganisationProgrammeSettings) => Promise<void>;
}

const ProgrammeSettingsForm: React.FC<FormProps> = ({ initialData, onSave }) => {
  const [formData, setFormData] = useState<OrganisationProgrammeSettings>(initialData);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleType = (typeId: string) => {
    const current = new Set(formData.allowedProgrammeTypes);
    if (current.has(typeId)) {
      if (current.size === 1) {
        setError('At least one programme discipline must remain enabled.');
        return;
      }
      current.delete(typeId);
    } else {
      current.add(typeId);
    }
    setFormData({ ...formData, allowedProgrammeTypes: Array.from(current) });
  };

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
      setError(e.message || 'Failed to update programme settings.');
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
              Curriculum & Classes
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Programme & Class Defaults</h1>
          <p className="text-sm text-slate-500">
            Configure allowed artistic disciplines, default class capacities, session durations, and group settings.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Programme settings successfully saved!</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Disciplines Selection Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Layers className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Supported Disciplines</h2>
              <p className="text-xs text-slate-500">Enable the artistic disciplines taught at your organisation.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {PROGRAMME_TYPE_OPTIONS.map((opt) => {
              const checked = formData.allowedProgrammeTypes.includes(opt.id);
              return (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                    checked
                      ? 'border-indigo-200 bg-indigo-50/50 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleType(opt.id)}
                    className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <div>
                    <div className="text-sm font-bold capitalize">{opt.id.replace('_', ' ')}</div>
                    <div className="text-xs text-slate-500">{opt.label}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Group & Session Defaults Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Group & Session Defaults</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Default Group / Class Capacity
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={formData.defaultGroupCapacity}
                onChange={e => setFormData({ ...formData, defaultGroupCapacity: parseInt(e.target.value, 10) || 15 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Pre-filled when creating new groups or ensembles.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Default Session Duration (Minutes)
              </label>
              <input
                type="number"
                min="15"
                step="15"
                max="480"
                value={formData.defaultSessionDurationMinutes}
                onChange={e => setFormData({ ...formData, defaultSessionDurationMinutes: parseInt(e.target.value, 10) || 60 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default length for sessions created on timetables.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Default Session Type
              </label>
              <select
                value={formData.defaultSessionType}
                onChange={e => setFormData({ ...formData, defaultSessionType: e.target.value as SessionType })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="rehearsal">Rehearsal</option>
                <option value="lesson">Lesson</option>
                <option value="workshop">Workshop</option>
                <option value="performance">Performance</option>
                <option value="assessment">Assessment</option>
                <option value="audition">Audition</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Default Venue / Room (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Hall A, Dance Studio 1"
                value={formData.defaultVenue || ''}
                onChange={e => setFormData({ ...formData, defaultVenue: e.target.value })}
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
            <span>{saving ? 'Saving...' : 'Save Programme Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export const ProgrammeSettingsPage: React.FC = () => {
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
      <ProgrammeSettingsForm
        initialData={settings.programmes}
        onSave={data => updateSection('programmes', data)}
      />
    </div>
  );
};
