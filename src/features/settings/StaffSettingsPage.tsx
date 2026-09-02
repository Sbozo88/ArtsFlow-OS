import React, { useState } from 'react';
import { Clock, Save, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { SettingsNav } from './components/SettingsNav';
import { useOrganisationSettings } from '../../hooks/useOrganisationSettings';
import type { OrganisationStaffSettings } from '../../types';

interface FormProps {
  initialData: OrganisationStaffSettings;
  onSave: (data: OrganisationStaffSettings) => Promise<void>;
}

const StaffSettingsForm: React.FC<FormProps> = ({ initialData, onSave }) => {
  const [formData, setFormData] = useState<OrganisationStaffSettings>(initialData);
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
      setError(e.message || 'Failed to update staff settings.');
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
              Staff Operations
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Staff, Timesheets & Workload Policies</h1>
          <p className="text-sm text-slate-500">
            Configure verification guardrails, self-approval prevention, work hours thresholds, and substitution policies.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Staff settings successfully saved!</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Timesheet Cycle & Thresholds Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Timesheet Cycles & Work Limits</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Default Timesheet Cycle Period *
              </label>
              <select
                value={formData.defaultTimesheetPeriod}
                onChange={e => setFormData({ ...formData, defaultTimesheetPeriod: e.target.value as 'weekly' | 'monthly' | 'custom' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="monthly">Monthly Cycle (Recommended)</option>
                <option value="weekly">Weekly Cycle</option>
                <option value="custom">Custom Date Range</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">Pre-selected when creating periodic timesheets.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Maximum Normal Daily Hours (Threshold) *
              </label>
              <input
                type="number"
                min="1"
                max="24"
                required
                value={formData.maximumNormalWorkHoursPerDay}
                onChange={e => setFormData({ ...formData, maximumNormalWorkHoursPerDay: parseInt(e.target.value, 10) || 12 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Daily work hours exceeding this limit trigger a High Workload warning on timesheets.
              </p>
            </div>
          </div>
        </div>

        {/* Verification & Approval Guardrails Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Verification & Approval Guardrails</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.preventSelfApproval}
                onChange={e => setFormData({ ...formData, preventSelfApproval: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <div>
                <div className="text-sm font-bold text-slate-900">Prevent Self-Approval of Timesheets (Strict Separation)</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Guarantees that a staff member or administrator cannot approve their own timesheet. Another verifier or admin must sign off.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.timesheetVerificationRequired}
                onChange={e => setFormData({ ...formData, timesheetVerificationRequired: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <div>
                <div className="text-sm font-bold text-slate-900">Require Two-Step Verification Prior to Approval</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Timesheets must first be marked "Verified" before an administrator can give final approval.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.manualWorkEntryAllowed}
                onChange={e => setFormData({ ...formData, manualWorkEntryAllowed: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <div>
                <div className="text-sm font-bold text-slate-900">Allow Manual Ad-Hoc Work Entries</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Permit staff to log administrative or rehearsal preparation hours not tied directly to a scheduled calendar session.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.substitutionApprovalRequired}
                onChange={e => setFormData({ ...formData, substitutionApprovalRequired: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <div>
                <div className="text-sm font-bold text-slate-900">Require Formal Confirmation for Teacher Substitutions</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Staff substitutions require confirmation from the substitute before calendar reassignment takes effect.
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Staff Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export const StaffSettingsPage: React.FC = () => {
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
      <StaffSettingsForm
        initialData={settings.staff}
        onSave={data => updateSection('staff', data)}
      />
    </div>
  );
};
