import React, { useState } from 'react';
import { Palette, Save, CheckCircle2, AlertCircle, Upload, Eye, Image as ImageIcon } from 'lucide-react';
import { SettingsNav } from './components/SettingsNav';
import { useOrganisationSettings } from '../../hooks/useOrganisationSettings';
import { documentUploadService } from '../../services/documentUploadService';
import { useAuth } from '../../contexts/AuthContext';
import type { OrganisationBrandingSettings } from '../../types';

interface FormProps {
  initialData: OrganisationBrandingSettings;
  onSave: (data: OrganisationBrandingSettings) => Promise<void>;
  organisationId?: string;
  actorId?: string;
}

const BrandingSettingsForm: React.FC<FormProps> = ({ initialData, onSave, organisationId, actorId }) => {
  const [formData, setFormData] = useState<OrganisationBrandingSettings>(initialData);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organisationId || !actorId) return;

    setUploadingLogo(true);
    setError(null);

    try {
      const res = await documentUploadService.uploadDocument(
        organisationId,
        {
          file,
          name: `${formData.organisationDisplayName} Logo`,
          documentType: 'other'
        },
        actorId
      );

      setFormData(prev => ({
        ...prev,
        logoUrl: res.downloadUrl,
        logoStoragePath: res.storagePath
      }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploadingLogo(false);
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
      setError(e.message || 'Failed to update branding settings.');
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
              Visual Assets
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Branding, Logo & Document Styling</h1>
          <p className="text-sm text-slate-500">
            Customise organisation identity, colors, logo, and document headers for invoices and reports.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Branding settings successfully saved!</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo & Identity Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Palette className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Brand Identity & Logo</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Public Display Name *
              </label>
              <input
                type="text"
                required
                value={formData.organisationDisplayName}
                onChange={e => setFormData({ ...formData, organisationDisplayName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Short / Acronym Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. AFOS"
                value={formData.shortName || ''}
                onChange={e => setFormData({ ...formData, shortName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Logo Upload Section */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Organisation Logo
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden shrink-0">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Organisation Logo"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo File'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      disabled={uploadingLogo}
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                  </label>

                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: undefined, logoStoragePath: undefined })}
                      className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">PNG, JPG, or SVG. Maximum 5MB. Rendered in headers and printouts.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Palette Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Brand Palette</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Primary Brand Colour
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.primaryBrandColour || '#4f46e5'}
                  onChange={e => setFormData({ ...formData, primaryBrandColour: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                />
                <input
                  type="text"
                  value={formData.primaryBrandColour || '#4f46e5'}
                  onChange={e => setFormData({ ...formData, primaryBrandColour: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Secondary Accent Colour
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.secondaryBrandColour || '#0f172a'}
                  onChange={e => setFormData({ ...formData, secondaryBrandColour: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                />
                <input
                  type="text"
                  value={formData.secondaryBrandColour || '#0f172a'}
                  onChange={e => setFormData({ ...formData, secondaryBrandColour: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Document Headers & Footers Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Document Headers & Footers</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Document Header Subtitle / Tagline
              </label>
              <input
                type="text"
                placeholder="e.g. Empowering Youth Through Performing Arts"
                value={formData.documentHeaderText || ''}
                onChange={e => setFormData({ ...formData, documentHeaderText: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Document Footer Legal / Notice
              </label>
              <input
                type="text"
                placeholder="e.g. ArtsFlow OS • Non-Profit Organization Reg: 2021/000000/08"
                value={formData.documentFooterText || ''}
                onChange={e => setFormData({ ...formData, documentFooterText: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Live Document Preview */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <Eye className="w-3.5 h-3.5" />
              <span>Live Document Header Preview</span>
            </div>

            <div
              className="p-5 rounded-xl border bg-white shadow-sm"
              style={{ borderTop: `4px solid ${formData.primaryBrandColour || '#4f46e5'}` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {formData.logoUrl && (
                    <img src={formData.logoUrl} alt="Preview" className="h-10 w-auto object-contain" />
                  )}
                  <div>
                    <h3
                      className="text-base font-black"
                      style={{ color: formData.secondaryBrandColour || '#0f172a' }}
                    >
                      {formData.organisationDisplayName || 'Your Organisation'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {formData.documentHeaderText || 'Excellence in Arts Education'}
                    </p>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <span className="font-mono font-bold text-slate-700">INVOICE #INV-2026-000001</span>
                  <div>Official Tax Document</div>
                </div>
              </div>
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
            <span>{saving ? 'Saving...' : 'Save Branding Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export const BrandingSettingsPage: React.FC = () => {
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
      <BrandingSettingsForm
        initialData={settings.branding}
        onSave={data => updateSection('branding', data)}
        organisationId={organisationId || undefined}
        actorId={authUser?.uid || undefined}
      />
    </div>
  );
};
