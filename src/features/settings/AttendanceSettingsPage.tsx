import React, { useState } from 'react';
import { CheckSquare, Save, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { SettingsNav } from './components/SettingsNav';
import { useOrganisationSettings } from '../../hooks/useOrganisationSettings';
import type { OrganisationAttendanceSettings } from '../../types';

interface FormProps {
  initialData: OrganisationAttendanceSettings;
  onSave: (data: OrganisationAttendanceSettings) => Promise<void>;
}

const AttendanceSettingsForm: React.FC<FormProps> = ({ initialData, onSave }) => {
  const [formData, setFormData] = useState<OrganisationAttendanceSettings>(initialData);
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
      setError(e.message || 'Failed to update attendance settings.');
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
              Participation Rules
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Attendance Settings & Formulas</h1>
          <p className="text-sm text-slate-500">
            Configure attendance alert thresholds, chronic absence triggers, and scoring rules for your organisation.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Attendance settings successfully saved!</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thresholds Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Attendance Alert Thresholds</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Low Attendance Threshold (%) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={formData.lowAttendanceThresholdPercent}
                  onChange={e => setFormData({ ...formData, lowAttendanceThresholdPercent: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="absolute right-3 top-2 text-slate-400 text-sm font-bold">%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Learners and groups below this compliance rate trigger operational alerts in Phase 5A Analytics.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Consecutive Absence Trigger *
              </label>
              <input
                type="number"
                min="1"
                max="30"
                required
                value={formData.consecutiveAbsenceThreshold}
                onChange={e => setFormData({ ...formData, consecutiveAbsenceThreshold: parseInt(e.target.value, 10) || 3 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Number of missed sessions in a row before a follow-up task is dispatched.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Minimum Sessions for Rate Alert
              </label>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={formData.minimumSessionsForAttendanceAlert}
                onChange={e => setFormData({ ...formData, minimumSessionsForAttendanceAlert: parseInt(e.target.value, 10) || 3 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Minimum session history required before evaluating low attendance rate alerts.
              </p>
            </div>
          </div>
        </div>

        {/* Scoring Formula Rules Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Scoring & Calculation Formula</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.lateCountsAsPresent}
                onChange={e => setFormData({ ...formData, lateCountsAsPresent: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <div>
                <div className="text-sm font-bold text-slate-900">Count "Late" as Full Attendance Credit</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  When enabled, learners arriving late receive full positive attendance credit in overall rates.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.excusedCountsInDenominator}
                onChange={e => setFormData({ ...formData, excusedCountsInDenominator: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <div>
                <div className="text-sm font-bold text-slate-900">Include "Excused" in Denominator</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  When disabled (recommended default), excused sessions are excluded from total sessions count, causing no penalty to the learner.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.attendanceAutomationEnabled}
                onChange={e => setFormData({ ...formData, attendanceAutomationEnabled: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <div>
                <div className="text-sm font-bold text-slate-900">Enable Automated Attendance Evaluators</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Permit Phase 5B automation engine to run chronic absence and low attendance checks.
                </div>
              </div>
            </label>
          </div>

          <div className="p-3.5 bg-indigo-50/60 border border-indigo-200/60 rounded-xl flex items-start gap-3 mt-4">
            <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <div className="text-xs text-indigo-900 leading-relaxed">
              <strong>Current Attendance Formula:</strong> Rate = (Present {formData.lateCountsAsPresent ? '+ Late' : ''}) / (Present + Late + Absent {formData.excusedCountsInDenominator ? '+ Excused' : ''}) &times; 100
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
            <span>{saving ? 'Saving...' : 'Save Attendance Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export const AttendanceSettingsPage: React.FC = () => {
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
      <AttendanceSettingsForm
        initialData={settings.attendance}
        onSave={data => updateSection('attendance', data)}
      />
    </div>
  );
};
