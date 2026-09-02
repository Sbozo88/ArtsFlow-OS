import React, { useState } from 'react';
import { MessageSquare, Save, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { SettingsNav } from './components/SettingsNav';
import { useOrganisationSettings } from '../../hooks/useOrganisationSettings';
import type { OrganisationCommunicationSettings } from '../../types';

interface FormProps {
  initialData: OrganisationCommunicationSettings;
  onSave: (data: OrganisationCommunicationSettings) => Promise<void>;
}

const CommunicationSettingsForm: React.FC<FormProps> = ({ initialData, onSave }) => {
  const [formData, setFormData] = useState<OrganisationCommunicationSettings>(initialData);
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
      setError(e.message || 'Failed to update communication settings.');
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
              Messaging & Outbox
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Communication Channels & Outbox Policy</h1>
          <p className="text-sm text-slate-500">
            Configure delivery preferences, reply-to addresses, automated dispatch safeguards, and signatures.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Communication settings successfully saved!</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Default Channels Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Default Messaging Channels</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Default Channel for Guardians *
              </label>
              <select
                value={formData.defaultGuardianChannel}
                onChange={e => setFormData({ ...formData, defaultGuardianChannel: e.target.value as 'email' | 'sms' | 'whatsapp' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">Pre-selected when creating notices or sending invoices.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Default Channel for Staff *
              </label>
              <select
                value={formData.defaultStaffChannel}
                onChange={e => setFormData({ ...formData, defaultStaffChannel: e.target.value as 'email' | 'in_app' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="email">Email</option>
                <option value="in_app">In-App Notifications</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reply-To Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. notices@organisation.org"
                value={formData.organisationReplyEmail || ''}
                onChange={e => setFormData({ ...formData, organisationReplyEmail: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                WhatsApp Default Country Dial Code
              </label>
              <input
                type="text"
                placeholder="+27"
                value={formData.whatsAppCountryCode || '+27'}
                onChange={e => setFormData({ ...formData, whatsAppCountryCode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Standard Email / Message Signature
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Kind regards, ArtsFlow Administration Team"
              value={formData.communicationSignature || ''}
              onChange={e => setFormData({ ...formData, communicationSignature: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>
        </div>

        {/* Safeguards & External Dispatch Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Automated Dispatch Safeguards</h2>
              <p className="text-xs text-slate-500">Control permissions for automated external broadcasts.</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.allowBulkGuardianCommunication}
                onChange={e => setFormData({ ...formData, allowBulkGuardianCommunication: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <div>
                <div className="text-sm font-bold text-slate-900">Enable Group / Bulk Broadcasts to Guardians</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Permits sending announcements to all guardians in an entire programme or group at once.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.allowFinanceCommunication}
                onChange={e => setFormData({ ...formData, allowFinanceCommunication: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <div>
                <div className="text-sm font-bold text-slate-900">Allow Finance & Invoicing Notices to Guardians</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Permits sending invoice summaries and payment receipts directly to guardians.
                </div>
              </div>
            </label>

            {/* Strict Safe-Default Toggle */}
            <label className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
              formData.allowAutomaticExternalSend
                ? 'border-amber-300 bg-amber-50/60'
                : 'border-slate-200 bg-slate-50/50'
            }`}>
              <input
                type="checkbox"
                checked={formData.allowAutomaticExternalSend}
                onChange={e => setFormData({ ...formData, allowAutomaticExternalSend: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">Permit Autonomous External Message Sending</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    formData.allowAutomaticExternalSend
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {formData.allowAutomaticExternalSend ? 'Autonomous Active' : 'Safe Mode (Queued for Approval)'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                  When disabled (recommended), automation rules draft notices into the Communication Outbox for human review before transmission. When enabled, approved rules may send directly.
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
            <span>{saving ? 'Saving...' : 'Save Communication Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export const CommunicationSettingsPage: React.FC = () => {
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
      <CommunicationSettingsForm
        initialData={settings.communication}
        onSave={data => updateSection('communication', data)}
      />
    </div>
  );
};
