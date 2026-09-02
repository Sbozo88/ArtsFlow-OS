import React, { useState } from 'react';
import { CreditCard, Save, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { SettingsNav } from './components/SettingsNav';
import { useOrganisationSettings } from '../../hooks/useOrganisationSettings';
import type { OrganisationFinanceSettings } from '../../types';

interface FormProps {
  initialData: OrganisationFinanceSettings;
  onSave: (data: OrganisationFinanceSettings) => Promise<void>;
}

const FinanceSettingsForm: React.FC<FormProps> = ({ initialData, onSave }) => {
  const [formData, setFormData] = useState<OrganisationFinanceSettings>(initialData);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const invoicePrefixClean = formData.invoicePrefix.endsWith('-') ? formData.invoicePrefix : `${formData.invoicePrefix}-`;
  const receiptPrefixClean = formData.receiptPrefix.endsWith('-') ? formData.receiptPrefix : `${formData.receiptPrefix}-`;
  const invoiceSample = `${invoicePrefixClean}${currentYear}-${'1'.padStart(formData.invoiceSequencePadding || 6, '0')}`;
  const receiptSample = `${receiptPrefixClean}${currentYear}-${'1'.padStart(formData.receiptSequencePadding || 6, '0')}`;

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
      setError(e.message || 'Failed to update finance settings.');
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
              Billing & Payments
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Finance & Invoicing Settings</h1>
          <p className="text-sm text-slate-500">
            Customise invoice and receipt sequence formats, currency, payment allocation rules, and tax defaults.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Finance settings successfully saved!</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Document Numbering Formats Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Document Numbering & Sequences</h2>
              <p className="text-xs text-slate-500">
                Settings apply to newly generated invoices and receipts. Historical records retain their original numbers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Invoice Number Prefix *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. INV-"
                value={formData.invoicePrefix}
                onChange={e => setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span>Sample:</span>
                <span className="font-mono font-bold text-indigo-600">{invoiceSample}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Invoice Sequence Padding (Digits) *
              </label>
              <input
                type="number"
                min="3"
                max="10"
                required
                value={formData.invoiceSequencePadding}
                onChange={e => setFormData({ ...formData, invoiceSequencePadding: parseInt(e.target.value, 10) || 6 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Number of zero-padded digits (e.g. 6 &rarr; 000001).</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Receipt Number Prefix *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. REC-"
                value={formData.receiptPrefix}
                onChange={e => setFormData({ ...formData, receiptPrefix: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span>Sample:</span>
                <span className="font-mono font-bold text-indigo-600">{receiptSample}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Receipt Sequence Padding (Digits) *
              </label>
              <input
                type="number"
                min="3"
                max="10"
                required
                value={formData.receiptSequencePadding}
                onChange={e => setFormData({ ...formData, receiptSequencePadding: parseInt(e.target.value, 10) || 6 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Payment Terms & Currency Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Payment Terms & Allocations</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Default Invoice Payment Window (Days) *
              </label>
              <input
                type="number"
                min="0"
                max="180"
                required
                value={formData.defaultInvoiceDueDays}
                onChange={e => setFormData({ ...formData, defaultInvoiceDueDays: parseInt(e.target.value, 10) || 30 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Due date is auto-calculated as issueDate + this value.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Fiscal Period Start Month
              </label>
              <select
                value={formData.financePeriodStartMonth}
                onChange={e => setFormData({ ...formData, financePeriodStartMonth: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value={1}>January (Calendar Year)</option>
                <option value={3}>March (SA School / Tax Year)</option>
                <option value={7}>July</option>
                <option value={9}>September (Academic Year)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.allowUnallocatedPayments}
                onChange={e => setFormData({ ...formData, allowUnallocatedPayments: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <div>
                <div className="text-sm font-bold text-slate-900">Allow Unallocated Payments / Account Credits</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Permit recording incoming payments before an invoice is issued, storing them safely as unallocated learner balances.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Tax / VAT Settings Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Tax & VAT Configuration</h2>
          </div>

          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={formData.taxEnabled}
              onChange={e => setFormData({ ...formData, taxEnabled: e.target.checked })}
              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <div>
              <div className="text-sm font-bold text-slate-900">Enable Tax / VAT on Invoices</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Check if your organisation is VAT-registered and charges tax on programme fees.
              </div>
            </div>
          </label>

          {formData.taxEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tax Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. VAT, GST, Sales Tax"
                  value={formData.taxLabel}
                  onChange={e => setFormData({ ...formData, taxLabel: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Default Tax Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formData.defaultTaxRate}
                    onChange={e => setFormData({ ...formData, defaultTaxRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 text-sm font-bold">%</span>
                </div>
              </div>
            </div>
          )}

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 mt-3">
            <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-600">
              ArtsFlow OS ensures financial immutability. Invoice sequences are safely tracked with transaction locks, preventing race conditions or duplicate numbering.
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
            <span>{saving ? 'Saving...' : 'Save Finance Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export const FinanceSettingsPage: React.FC = () => {
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
      <FinanceSettingsForm
        initialData={settings.finance}
        onSave={data => updateSection('finance', data)}
      />
    </div>
  );
};
