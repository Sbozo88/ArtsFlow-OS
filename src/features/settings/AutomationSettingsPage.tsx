import React, { useState } from 'react';
import { Cpu, Save, CheckCircle2, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { SettingsNav } from './components/SettingsNav';
import { useOrganisationSettings } from '../../hooks/useOrganisationSettings';
import { useAuth } from '../../contexts/AuthContext';
import { automationRuleService } from '../../services/automation/automationRuleService';
import type { OrganisationAutomationSettings } from '../../types';

interface FormProps {
  initialData: OrganisationAutomationSettings;
  onSave: (data: OrganisationAutomationSettings) => Promise<void>;
  organisationId?: string;
  actorId?: string;
}

const AutomationSettingsForm: React.FC<FormProps> = ({ initialData, onSave, organisationId, actorId }) => {
  const [formData, setFormData] = useState<OrganisationAutomationSettings>(initialData);
  const [saving, setSaving] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInstallDefaults = async () => {
    if (!organisationId || !actorId) return;
    setInstalling(true);
    setFeedback(null);
    setError(null);

    try {
      const installed = await automationRuleService.installRecommendedRules(organisationId, actorId);
      if (installed.length === 0) {
        setFeedback('Recommended rules are already installed in this organisation.');
      } else {
        setFeedback(`Successfully installed ${installed.length} recommended automation rules!`);
      }
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setInstalling(false);
    }
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
      setError(e.message || 'Failed to update automation settings.');
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
              Workflow Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Automation Defaults & Policies</h1>
          <p className="text-sm text-slate-500">
            Configure automation execution safeguards, cooldown windows, dry-run safety modes, and rule packages.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Automation settings successfully saved!</span>
        </div>
      )}

      {feedback && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-2 text-indigo-800 text-sm font-semibold">
          <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Recommended Rules Installation Card */}
      <div className="mb-8 p-6 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Recommended Automation Pack</span>
          </div>
          <h2 className="text-lg font-bold text-white">Install Standard Operational Rules</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            Installs pre-built rules tailored to your organisation's thresholds: Chronic Absence Follow-Up, Low Attendance Warning, and Overdue Consent Alerts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleInstallDefaults}
          disabled={installing}
          className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow transition-all whitespace-nowrap disabled:opacity-50"
        >
          {installing ? 'Installing Rules...' : 'Install Recommended Rules'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Master Toggle & Cooldown Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Automation Engine Policies</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.automationEnabled}
                onChange={e => setFormData({ ...formData, automationEnabled: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <div>
                <div className="text-sm font-bold text-slate-900">Automation Engine Master Switch</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  When disabled, no background automation triggers or actions will be evaluated.
                </div>
              </div>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Default Cooldown Window (Hours) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  required
                  value={formData.defaultCooldownHours}
                  onChange={e => setFormData({ ...formData, defaultCooldownHours: parseInt(e.target.value, 10) || 24 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Prevents duplicate actions from firing for the same condition within this window.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Safety & Dry Run Defaults */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Safety & Dry-Run Modes</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.dryRunNewRulesByDefault}
                onChange={e => setFormData({ ...formData, dryRunNewRulesByDefault: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <div>
                <div className="text-sm font-bold text-slate-900">Create New Rules in "Dry-Run" Mode by Default</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Newly created rules will simulate evaluations and log matched entities without executing live actions until activated.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.notificationEscalationEnabled}
                onChange={e => setFormData({ ...formData, notificationEscalationEnabled: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <div>
                <div className="text-sm font-bold text-slate-900">Enable Notification Escalation for Unresolved Tasks</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Escalates overdue automated tasks to Programme Directors and Administrators.
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
            <span>{saving ? 'Saving...' : 'Save Automation Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export const AutomationSettingsPage: React.FC = () => {
  const { organisationId, authUser } = useAuth();
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
      <AutomationSettingsForm
        initialData={settings.automation}
        onSave={data => updateSection('automation', data)}
        organisationId={organisationId || undefined}
        actorId={authUser?.uid || undefined}
      />
    </div>
  );
};
