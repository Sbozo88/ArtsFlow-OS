import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Users,
  Layers,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
  HardDrive,
  Mail,
  Zap,
  ShieldAlert,
  CreditCard
} from 'lucide-react';
import { commercialAnalyticsService } from '../../../services/platform/commercialAnalyticsService';
import type { CommercialAnalyticsSummary } from '../../../types';

export const PlatformAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<CommercialAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await commercialAnalyticsService.getCommercialAnalytics();
      setData(res);
    } catch (err) {
      setError((err as Error).message || 'Failed to load commercial analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            Commercial Analytics & Platform Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time MRR, subscription tier distribution, customer retention, and platform usage aggregation.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-800/40 rounded-xl border border-slate-700/40" />
          ))}
        </div>
      )}

      {data && (
        <>
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/60 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Monthly Recurring (MRR)</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white tracking-tight">
                {formatCurrency(data.mrr)}
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <span>ARR:</span>
                <span className="text-slate-200 font-medium">{formatCurrency(data.arr)}</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/60 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Paid Subscriptions</span>
                <CreditCard className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-3xl font-bold text-white tracking-tight">
                {data.activePaidSubscriptions}
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <span>Active trials:</span>
                <span className="text-amber-300 font-medium">{data.trialSubscriptions}</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/60 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Trial Conversion</span>
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-3xl font-bold text-white tracking-tight">
                {data.trialToPaidConversionRate}%
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <span>ARPA:</span>
                <span className="text-slate-200 font-medium">{formatCurrency(data.averageRevenuePerAccount)} / mo</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/60 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Churn Rate</span>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-3xl font-bold text-white tracking-tight">
                {data.churnRate}%
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <span>Past-due accounts:</span>
                <span className="text-rose-400 font-medium">{data.pastDueSubscriptions}</span>
              </div>
            </div>
          </div>

          {/* Revenue by Plan Tier */}
          <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/60 shadow-lg">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-indigo-400" />
              Subscription Distribution & Revenue by Tier
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.values(data.revenueByPlan).map((metric) => (
                <div
                  key={metric.planId}
                  className="p-4 rounded-lg bg-slate-900/60 border border-slate-700/40 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{metric.planName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                        {metric.planId}
                      </span>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-white">
                      {formatCurrency(metric.mrr)}
                      <span className="text-xs font-normal text-slate-400 ml-1">/mo</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>{metric.activeCount} active</span>
                    <span>{metric.trialCount} trialing</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Capacity & Usage Aggregation */}
          <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/60 shadow-lg">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-400" />
              Platform-Wide Usage & Resource Consumption
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-700/40">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium">Total Learners</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {data.platformUsageAggregate.totalLearners.toLocaleString()}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-700/40">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-medium">Staff Members</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {data.platformUsageAggregate.totalStaffUsers.toLocaleString()}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-700/40">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <HardDrive className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-medium">Storage Consumed</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {(data.platformUsageAggregate.totalStorageMb / 1024).toFixed(1)} GB
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-700/40">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Mail className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-medium">Monthly Messages</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {data.platformUsageAggregate.totalMonthlyCommunications.toLocaleString()}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-700/40">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium">Automation Executions</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {data.platformUsageAggregate.totalAutomationRuns.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Tenants At Risk */}
          <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/60 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  Operational & Commercial Accounts At Risk
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Organisations requiring intervention due to failed billing, imminent trial expiration, or account suspension.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                {data.tenantsAtRisk.length} flagged
              </span>
            </div>

            {data.tenantsAtRisk.length === 0 ? (
              <div className="p-8 text-center rounded-lg bg-slate-900/40 border border-slate-700/30 text-slate-400 text-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                No customer accounts are currently at risk. All billing and trial statuses are in good standing.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Organisation</th>
                      <th className="py-3 px-4">Risk Category</th>
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Diagnostic Context</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {data.tenantsAtRisk.map((risk) => (
                      <tr key={risk.organisationId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-medium text-white">
                          {risk.organisationName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 uppercase">
                            {risk.riskType.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              risk.severity === 'critical'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            }`}
                          >
                            {risk.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-300 max-w-md">
                          {risk.detail}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/platform/organisations/${risk.organisationId}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            Support Console
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
