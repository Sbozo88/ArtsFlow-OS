import React from 'react';
import {
  Users,
  UserCheck,
  HardDrive,
  Mail,
  Zap,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useUsageMetering } from '../../../hooks/useUsageMetering';
import type { LimitMeterKey } from '../../../types';

const METER_ICONS: Record<LimitMeterKey, React.ComponentType<{ className?: string }>> = {
  'limits.learners': Users,
  'limits.staff_users': UserCheck,
  'limits.storage_mb': HardDrive,
  'limits.monthly_communications': Mail,
  'limits.automation_runs': Zap
};

export const UsageMetersCard: React.FC = () => {
  const { summary, loading, syncing, syncUsage } = useUsageMetering();

  if (loading && !summary) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500 shadow-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
        Loading usage and limits data…
      </div>
    );
  }

  if (!summary) return null;

  const meters = Object.values(summary.meters);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
      {/* Header with Sync button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Usage & Plan Limits</span>
            {summary.anyExceeded ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                Limit Exceeded
              </span>
            ) : summary.anyWarning ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Near Capacity
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Within Limits
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time tracking of consumption against current subscription tier. Billing cycle:{' '}
            <span className="text-slate-700 font-medium font-mono">{summary.billingPeriod}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => syncUsage()}
          disabled={syncing}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 rounded-lg border border-slate-200 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
          <span>{syncing ? 'Recalculating…' : 'Sync Counters'}</span>
        </button>
      </div>

      {/* Meter rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {meters.map((meter) => {
          const Icon = METER_ICONS[meter.key] || Zap;
          const isUnlimited = meter.limit === null;

          // Color classification
          let barColor = 'bg-indigo-600';
          let badgeColor = 'bg-slate-100 text-slate-700';

          if (meter.exceeded) {
            barColor = 'bg-rose-600';
            badgeColor = 'bg-rose-50 text-rose-700 border border-rose-200';
          } else if (meter.status === 'critical') {
            barColor = 'bg-rose-500';
            badgeColor = 'bg-rose-50 text-rose-700 border border-rose-200';
          } else if (meter.status === 'warning') {
            barColor = 'bg-amber-500';
            badgeColor = 'bg-amber-50 text-amber-700 border border-amber-200';
          } else if (meter.percentUsed > 0) {
            barColor = 'bg-emerald-600';
            badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
          }

          return (
            <div
              key={meter.key}
              className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{meter.name}</div>
                    <div className="text-[11px] text-slate-500">{meter.description}</div>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 ${badgeColor}`}>
                  {isUnlimited
                    ? 'Unlimited'
                    : meter.exceeded
                      ? 'Exceeded'
                      : `${meter.percentUsed}%`}
                </span>
              </div>

              {/* Progress Bar */}
              {!isUnlimited && (
                <div className="space-y-1">
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${barColor}`}
                      style={{ width: `${Math.min(100, meter.percentUsed)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>
                      {meter.current.toLocaleString()} {meter.unit} used
                    </span>
                    <span>
                      {meter.limit?.toLocaleString()} {meter.unit} cap
                    </span>
                  </div>
                </div>
              )}

              {isUnlimited && (
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                  <span>Current usage: {meter.current.toLocaleString()} {meter.unit}</span>
                  <span className="text-emerald-600 font-semibold">No cap on this plan</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
