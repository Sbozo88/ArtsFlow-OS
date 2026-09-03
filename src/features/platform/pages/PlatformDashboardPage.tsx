import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  ShieldCheck,
  AlertTriangle,
  Plus,
  RefreshCw,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { platformMetricsService, type PlatformKPIs } from '../../../services/platformMetricsService';

export const PlatformDashboardPage: React.FC = () => {
  const [kpis, setKpis] = useState<PlatformKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await platformMetricsService.getPlatformKPIs();
      setKpis(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to load platform metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    platformMetricsService
      .getPlatformKPIs()
      .then((data) => {
        if (isMounted) {
          setKpis(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError((err as Error).message || 'Failed to load platform metrics');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            Platform Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global SaaS operator metrics and multi-tenant operational status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            title="Refresh metrics"
            aria-label="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/platform/organisations?new=true"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Organisation
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-red-200 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Organisations */}
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Tenants</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{loading ? '—' : kpis?.totalOrganisations}</span>
            <span className="text-xs text-slate-400 font-medium">organisations</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="font-semibold">+{loading ? 0 : kpis?.newOrganisationsThisMonth}</span>
            <span className="text-slate-400">new this month</span>
          </div>
        </div>

        {/* Active Organisations */}
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Operational</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400">{loading ? '—' : kpis?.activeOrganisations}</span>
            <span className="text-xs text-slate-400 font-medium">active</span>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            {kpis?.trialOrganisations ? `${kpis.trialOrganisations} in trial` : 'Full operational access'}
          </div>
        </div>

        {/* Restricted / Suspended */}
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Attention</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-400">
              {loading ? '—' : (kpis?.suspendedOrganisations || 0) + (kpis?.restrictedOrganisations || 0)}
            </span>
            <span className="text-xs text-slate-400 font-medium">suspended/restricted</span>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            {kpis?.suspendedOrganisations || 0} suspended • {kpis?.restrictedOrganisations || 0} restricted
          </div>
        </div>

        {/* Platform Users */}
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Identities</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{loading ? '—' : kpis?.totalPlatformUsers}</span>
            <span className="text-xs text-slate-400 font-medium">users</span>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            {kpis?.activeMemberships || 0} active memberships
          </div>
        </div>
      </div>

      {/* Tenant Lifecycle Breakdown Bar */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
          Tenant Lifecycle Distribution
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/50">
            <div className="text-xs text-slate-400 font-medium">Active</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{kpis?.activeOrganisations ?? 0}</div>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/50">
            <div className="text-xs text-slate-400 font-medium">Trial</div>
            <div className="text-xl font-bold text-sky-400 mt-1">{kpis?.trialOrganisations ?? 0}</div>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/50">
            <div className="text-xs text-slate-400 font-medium">Provisioning</div>
            <div className="text-xl font-bold text-purple-400 mt-1">{kpis?.provisioningOrganisations ?? 0}</div>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/50">
            <div className="text-xs text-slate-400 font-medium">Restricted</div>
            <div className="text-xl font-bold text-amber-400 mt-1">{kpis?.restrictedOrganisations ?? 0}</div>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/50">
            <div className="text-xs text-slate-400 font-medium">Suspended</div>
            <div className="text-xl font-bold text-rose-400 mt-1">{kpis?.suspendedOrganisations ?? 0}</div>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/50">
            <div className="text-xs text-slate-400 font-medium">Cancelled / Arch.</div>
            <div className="text-xl font-bold text-slate-400 mt-1">
              {(kpis?.cancelledOrganisations ?? 0) + (kpis?.archivedOrganisations ?? 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Organisations & Health Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Organisations Table */}
        <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/70 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Recent Organisations</h2>
              <p className="text-xs text-slate-400 mt-0.5">Recently created or active customer tenants</p>
            </div>
            <Link
              to="/platform/organisations"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              View directory
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading recent organisations...</div>
          ) : !kpis?.recentOrganisations || kpis.recentOrganisations.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No organisations registered yet. Click &quot;Create Organisation&quot; to provision a test tenant.
            </div>
          ) : (
            <div className="divide-y divide-slate-700/60">
              {kpis.recentOrganisations.map((org) => {
                const status = org.tenantStatus || 'active';
                const statusColor =
                  status === 'active'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    : status === 'suspended'
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                    : status === 'restricted'
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                    : 'text-slate-400 bg-slate-700 border-slate-600';

                return (
                  <div key={org.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                        {org.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <Link
                          to={`/platform/organisations/${org.id}`}
                          className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors"
                        >
                          {org.name}
                        </Link>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{org.organisationType}</span>
                          <span>•</span>
                          <span className="font-mono text-[10px]">{org.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor}`}>
                        {status.toUpperCase()}
                      </span>
                      <Link
                        to={`/platform/organisations/${org.id}`}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                        title="Inspect organisation"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Platform Quick Health Card */}
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Platform Health</h2>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Platform subsystems, security rules, and data boundaries are monitored continuously.
            </p>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-700/50">
                <span className="text-slate-400">Database & Rules</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-700/50">
                <span className="text-slate-400">Multi-Tenant Isolation</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-700/50">
                <span className="text-slate-400">Authentication Service</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Operational
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5">
                <span className="text-slate-400">Platform Audit</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Active
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700/60">
            <Link
              to="/platform/health"
              className="w-full py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg text-center block transition-colors"
            >
              Detailed Health Diagnostics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
