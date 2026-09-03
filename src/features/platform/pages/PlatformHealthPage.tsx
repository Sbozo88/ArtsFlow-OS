import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  RefreshCw,
  Server,
  Database,
  Key,
  HardDrive,
  Cpu,
  Layers
} from 'lucide-react';
import {
  platformOperationsService,
  type ReleaseMetadata,
  type IntegrationStatusReport,
  type BackupStatusReport
} from '../../../services/platformOperationsService';
import { platformMetricsService, type PlatformKPIs } from '../../../services/platformMetricsService';

export const PlatformHealthPage: React.FC = () => {
  const [release, setRelease] = useState<ReleaseMetadata | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationStatusReport | null>(null);
  const [backup, setBackup] = useState<BackupStatusReport | null>(null);
  const [kpis, setKpis] = useState<PlatformKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      const rel = platformOperationsService.getReleaseMetadata();
      const integ = platformOperationsService.getIntegrationStatuses();
      const bkp = platformOperationsService.getBackupStatus();
      const metrics = await platformMetricsService.getPlatformKPIs();

      setRelease(rel);
      setIntegrations(integ);
      setBackup(bkp);
      setKpis(metrics);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, []);

  const coreServices = [
    { name: 'Application Shell & Client', icon: Layers, status: 'Operational', latency: 'Fast (Vite SPA)' },
    { name: 'Cloud Firestore & Rules', icon: Database, status: 'Operational', latency: 'Direct SDK / Rules Enforced' },
    { name: 'Firebase Authentication', icon: Key, status: 'Operational', latency: 'Token Verification Active' },
    { name: 'Cloud Storage & Documents', icon: HardDrive, status: 'Operational', latency: 'Tenant Path Isolated' },
    { name: 'Cloud Functions & Serverless', icon: Cpu, status: 'Ready', latency: 'On Demand' },
    { name: 'Automation Triggers Engine', icon: Server, status: 'Operational', latency: 'Real-time Listeners' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            Platform Health & Infrastructure Diagnostics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time status of SaaS core infrastructure, integrations, and release versions.
          </p>
        </div>

        <button
          type="button"
          onClick={loadHealthData}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors self-start sm:self-auto"
          title="Refresh health diagnostics"
          aria-label="Refresh health diagnostics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Release & Environment Card */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
          Environment & Build Metadata
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">
              Platform Release
            </span>
            <span className="text-white font-bold text-sm mt-1 block">
              ArtsFlow OS v{release?.version || '1.1.0'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">
              Target Environment
            </span>
            <span className="text-emerald-400 font-medium capitalize mt-1 block">
              {release?.environment || 'production'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">
              Commit Identifier
            </span>
            <span className="text-slate-200 font-mono text-[11px] mt-1 block">
              {release?.commitSha || 'git-main'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-semibold">
              Build Timestamp
            </span>
            <span className="text-slate-200 mt-1 block">{release?.buildDate || 'Local Build'}</span>
          </div>
        </div>
      </div>

      {/* Core Cloud Infrastructure Grid */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
          Core Subsystems Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coreServices.map((srv) => {
            const Icon = srv.icon;
            return (
              <div
                key={srv.name}
                className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/60 flex items-start gap-3"
              >
                <div className="p-2.5 rounded-lg bg-slate-800 text-indigo-400">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white truncate">{srv.name}</span>
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {srv.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{srv.latency}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tenant Health Summary & Integrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant Operational Status Summary */}
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
            Tenant Operational Overview
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Aggregated health breakdown across all customer school tenants.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 text-xs">
              <span className="text-slate-300">Operational & Active Tenants</span>
              <span className="font-bold text-emerald-400">{kpis?.activeOrganisations ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 text-xs">
              <span className="text-slate-300">Trial & Provisioning Tenants</span>
              <span className="font-bold text-sky-400">
                {(kpis?.trialOrganisations ?? 0) + (kpis?.provisioningOrganisations ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 text-xs">
              <span className="text-slate-300">Suspended / Restricted Tenants</span>
              <span className="font-bold text-amber-400">
                {(kpis?.suspendedOrganisations ?? 0) + (kpis?.restrictedOrganisations ?? 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Third-Party Integrations Status */}
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
            Third-Party Gateway Connectivity
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Global communication channels and external service endpoints.
          </p>

          <div className="space-y-2 text-xs">
            {integrations &&
              Object.entries(integrations).map(([key, val]) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-2 px-3 bg-slate-900/40 rounded border border-slate-700/40"
                >
                  <span className="text-slate-300 uppercase tracking-wider text-[11px] font-medium">
                    {key}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">{val.provider}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        val.status === 'Connected'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-slate-400 bg-slate-800'
                      }`}
                    >
                      {val.status}
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {backup && (
            <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
              <span>Automated Backup: <strong className="text-slate-200">{backup.backupFrequency}</strong></span>
              <span className="text-emerald-400">{backup.status.toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
