import React, { useState } from 'react';
import { SettingsNav } from './components/SettingsNav';
import { useOrganisationSettings } from '../../hooks/useOrganisationSettings';
import { Shield, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import type { OrganisationPortalSettings } from '../../types';

interface PortalSettingsFormProps {
  initialData: OrganisationPortalSettings;
  onSave: (data: OrganisationPortalSettings) => Promise<void>;
}

const PortalSettingsForm: React.FC<PortalSettingsFormProps> = ({ initialData, onSave }) => {
  const [formData, setFormData] = useState<OrganisationPortalSettings>(initialData);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await onSave(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            External Access & Security
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-1">Guardian Portal Settings</h1>
        <p className="text-sm text-slate-500">
          Control family self-service features, visibility permissions, finance exposure, and contact update policies.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Portal configuration saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Master Toggle */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Enable Guardian Portal Access</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                When disabled, all guardian logins and portal routes are immediately blocked.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.guardianPortalEnabled}
                onChange={e => setFormData({ ...formData, guardianPortalEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Feature Modules Visibility</h2>
          <p className="text-xs text-slate-500">Enable or disable specific sections shown inside the guardian portal.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-800">Attendance Module</div>
                <div className="text-[11px] text-slate-500">Session history, compliance % gauge</div>
              </div>
              <input
                type="checkbox"
                checked={formData.showAttendance}
                onChange={e => setFormData({ ...formData, showAttendance: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 ml-3"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-800">Finance & Invoices</div>
                <div className="text-[11px] text-slate-500">Balances, tax invoices, and receipts</div>
              </div>
              <input
                type="checkbox"
                checked={formData.showFinance}
                onChange={e => setFormData({ ...formData, showFinance: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 ml-3"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-800">Events & Performances</div>
                <div className="text-[11px] text-slate-500">Call times, rehearsals, and schedules</div>
              </div>
              <input
                type="checkbox"
                checked={formData.showEvents}
                onChange={e => setFormData({ ...formData, showEvents: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 ml-3"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-800">Consent Forms</div>
                <div className="text-[11px] text-slate-500">Digital signatures & approvals</div>
              </div>
              <input
                type="checkbox"
                checked={formData.showConsent}
                onChange={e => setFormData({ ...formData, showConsent: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 ml-3"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-800">Transport Plans</div>
                <div className="text-[11px] text-slate-500">Pickup, boarding, and bus routes</div>
              </div>
              <input
                type="checkbox"
                checked={formData.showTransport}
                onChange={e => setFormData({ ...formData, showTransport: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 ml-3"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-800">Documents Vault</div>
                <div className="text-[11px] text-slate-500">Certificates, reports, and notices</div>
              </div>
              <input
                type="checkbox"
                checked={formData.showDocuments}
                onChange={e => setFormData({ ...formData, showDocuments: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 ml-3"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-800">Broadcast Messages</div>
                <div className="text-[11px] text-slate-500">Notifications and updates</div>
              </div>
              <input
                type="checkbox"
                checked={formData.showMessages}
                onChange={e => setFormData({ ...formData, showMessages: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 ml-3"
              />
            </label>
          </div>
        </div>

        {/* Security & Financial Segregation */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Security & Isolation Rules</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-800">Financial Contact Segregation</div>
                <div className="text-[11px] text-slate-500">
                  Strictly restrict invoice and balance views to guardians flagged as financial contact (financialContact === true).
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.financeRequiresFinancialContact}
                onChange={e => setFormData({ ...formData, financeRequiresFinancialContact: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 ml-3"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-800">Detailed Attendance History</div>
                <div className="text-[11px] text-slate-500">Show session-by-session log instead of just summary compliance %</div>
              </div>
              <input
                type="checkbox"
                checked={formData.showAttendanceHistory}
                onChange={e => setFormData({ ...formData, showAttendanceHistory: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 ml-3"
              />
            </label>
          </div>
        </div>

        {/* Profile & Contact Policies */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Self-Service Profile Policies</h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-800">Allow Contact Updates</div>
                <div className="text-[11px] text-slate-500">Allow guardians to update phone, address, and comm preferences</div>
              </div>
              <input
                type="checkbox"
                checked={formData.allowContactUpdates}
                onChange={e => setFormData({ ...formData, allowContactUpdates: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 ml-3"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-800">Direct Profile Modification</div>
                <div className="text-[11px] text-slate-500">
                  Save immediately without requiring staff approval (otherwise creates change requests)
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.allowDirectProfileEdit}
                onChange={e => setFormData({ ...formData, allowDirectProfileEdit: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 ml-3"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Portal Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export const PortalSettingsPage: React.FC = () => {
  const { settings, updateSection, loading } = useOrganisationSettings();

  if (loading || !settings?.portal) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SettingsNav />
        <div className="max-w-4xl mx-auto px-4 py-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <SettingsNav />
      <PortalSettingsForm
        initialData={settings.portal}
        onSave={async data => {
          await updateSection('portal', data);
        }}
      />
    </div>
  );
};
