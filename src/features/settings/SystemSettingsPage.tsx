import React, { useState } from 'react';
import {
  Sliders,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Info,
  ShieldCheck,
  Activity,
  Download,
  RefreshCw,
  Server,
  Radio
} from 'lucide-react';
import { SettingsNav } from './components/SettingsNav';
import { useOrganisationSettings } from '../../hooks/useOrganisationSettings';
import { useAuth } from '../../contexts/AuthContext';
import {
  platformOperationsService,
  type DataQualityReport,
  type IntegrationStatusReport
} from '../../services/platformOperationsService';
import type { OrganisationSystemSettings, OrganisationDocumentSettings } from '../../types';

interface FormProps {
  initialSystem: OrganisationSystemSettings;
  initialDocs: OrganisationDocumentSettings;
  onSave: (sys: OrganisationSystemSettings, docs: OrganisationDocumentSettings) => Promise<void>;
  organisationId: string;
}

const SystemSettingsForm: React.FC<FormProps> = ({ initialSystem, initialDocs, onSave, organisationId }) => {
  const [systemData, setSystemData] = useState<OrganisationSystemSettings>(initialSystem);
  const [docData, setDocData] = useState<OrganisationDocumentSettings>(initialDocs);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Platform operations state
  const [scanning, setScanning] = useState(false);
  const [dataQualityReport, setDataQualityReport] = useState<DataQualityReport | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const metadata = platformOperationsService.getReleaseMetadata();
  const integrations: IntegrationStatusReport = platformOperationsService.getIntegrationStatuses();
  const backup = platformOperationsService.getBackupStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await onSave(systemData, docData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const e = err as Error;
      setError(e.message || 'Failed to update system preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleRunScan = async () => {
    setScanning(true);
    try {
      const report = await platformOperationsService.runDataQualityScan(organisationId);
      setDataQualityReport(report);
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setScanning(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    setExportSuccess(false);
    try {
      const exportPayload = await platformOperationsService.exportOrganisationData(organisationId);
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `artsflow_export_${organisationId}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              System & Release
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              v{metadata.version}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">System Preferences & Platform Operations</h1>
          <p className="text-sm text-slate-500">
            Configure application display formats, upload quotas, monitor integration health, and audit data quality.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>System preferences successfully saved!</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* System Information & Release Metadata */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">System Information & Release Metadata</h2>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" /> Validation pending
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Product Version</p>
            <p className="text-sm font-black text-slate-800 mt-0.5 font-mono">{metadata.version}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Build Date</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5 font-mono">{metadata.buildDate}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Environment</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5 capitalize">{metadata.environment}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Schema Version</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5 font-mono">v{metadata.schemaVersion}</p>
          </div>
        </div>
        <p className="text-[11px] font-mono text-slate-500">
          Commit: {metadata.commitSha}
        </p>
      </div>

      {/* Integration Production Statuses */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">External Integration Adapters</h2>
          </div>
          <p className="text-xs text-slate-500">Core workflows operate independently of external services.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(integrations).map(([key, item]) => {
            const isConn = item.status === 'Connected';
            const isSand = item.status === 'Sandbox';
            return (
              <div key={key} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{key}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    isConn ? 'bg-emerald-100 text-emerald-800' :
                    isSand ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-600 mt-1">{item.provider}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{item.notes}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Platform Health, Diagnostics & Backups */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Platform Health, Data Quality & Backups</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRunScan}
              disabled={scanning}
              className="btn btn-secondary text-xs flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
              <span>{scanning ? 'Scanning...' : 'Scan Data Quality'}</span>
            </button>
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="btn btn-secondary text-xs flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting ? 'Exporting...' : 'Export Data (JSON)'}</span>
            </button>
          </div>
        </div>

        {exportSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Organisation data safely exported (credentials stripped). Check your browser downloads.</span>
          </div>
        )}

        {/* Backup Status Overview */}
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-slate-600" />
            <div>
              <p className="text-xs font-bold text-slate-800">Automated Firestore Snapshots</p>
              <p className="text-[11px] text-slate-500">{backup.backupFrequency} • Retention: {backup.retentionDays} days</p>
            </div>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase ${
            backup.status === 'operational'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}>
            {backup.status}
          </span>
        </div>
        <p className="text-[11px] text-slate-500">{backup.notes}</p>

        {/* Data Quality Report Results */}
        {dataQualityReport && (
          <div className="space-y-3 pt-2">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Data Quality Scan Result ({new Date(dataQualityReport.scannedAt).toLocaleTimeString()})
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scanned {dataQualityReport.totalRecordsScanned} total operational records.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-slate-900">{dataQualityReport.healthScore}%</span>
                <p className="text-[10px] font-bold uppercase text-slate-400">Integrity Score</p>
              </div>
            </div>

            {dataQualityReport.issues.length === 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero integrity anomalies detected! All relational cross-links and finance ledgers are healthy.</span>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                {dataQualityReport.issues.map((issue, idx) => (
                  <div key={idx} className="p-3 flex items-start gap-2.5 bg-white">
                    <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                      issue.severity === 'critical' || issue.severity === 'error' ? 'text-rose-600' : 'text-amber-600'
                    }`} />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{issue.message}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {issue.entityType.toUpperCase()} • ID: {issue.entityId}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Card for Preferences */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Display & Formatting Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Display & Localization Formats</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Default Landing Page *
              </label>
              <select
                value={systemData.defaultLandingPage}
                onChange={e => setSystemData({ ...systemData, defaultLandingPage: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="/dashboard">Executive Dashboard (/dashboard)</option>
                <option value="/learners">Learners Directory (/learners)</option>
                <option value="/programmes">Programmes & Groups (/programmes)</option>
                <option value="/attendance">Attendance Operations (/attendance)</option>
                <option value="/finance">Finance & Billing (/finance)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Date Format *
              </label>
              <select
                value={systemData.dateFormat}
                onChange={e => setSystemData({ ...systemData, dateFormat: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO standard)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (UK / SA standard)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (US standard)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Time Format *
              </label>
              <select
                value={systemData.timeFormat}
                onChange={e => setSystemData({ ...systemData, timeFormat: e.target.value as '24h' | '12h' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="24h">24-hour (14:30)</option>
                <option value="12h">12-hour AM/PM (2:30 PM)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Default Records Per Page *
              </label>
              <select
                value={systemData.recordsPerPage}
                onChange={e => setSystemData({ ...systemData, recordsPerPage: parseInt(e.target.value, 10) || 25 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value={10}>10 items</option>
                <option value={25}>25 items</option>
                <option value={50}>50 items</option>
                <option value={100}>100 items</option>
              </select>
            </div>
          </div>
        </div>

        {/* Document Upload Quotas Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Document Upload & Security Quotas</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Maximum Upload File Size (MB) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={docData.maximumUploadSizeMb}
                  onChange={e => setDocData({ ...docData, maximumUploadSizeMb: parseInt(e.target.value, 10) || 10 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="absolute right-3 top-2 text-slate-400 text-sm font-bold">MB</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Client-side file validator blocks uploads larger than this threshold before cloud transmission.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Standard Document Footer
              </label>
              <input
                type="text"
                placeholder="e.g. Confidential — ArtsFlow OS"
                value={docData.documentFooter || ''}
                onChange={e => setDocData({ ...docData, documentFooter: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export const SystemSettingsPage: React.FC = () => {
  const { organisationId } = useAuth();
  const { settings, loading, updateSection } = useOrganisationSettings();

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const handleSave = async (sys: OrganisationSystemSettings, docs: OrganisationDocumentSettings) => {
    await updateSection('system', sys);
    await updateSection('documents', docs);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <SettingsNav />
      <SystemSettingsForm
        initialSystem={settings.system}
        initialDocs={settings.documents}
        onSave={handleSave}
        organisationId={organisationId || 'default_org'}
      />
    </div>
  );
};
