import React from 'react';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  Activity,
  ShieldAlert
} from 'lucide-react';
import type { PilotKpis } from '../../../types';

interface PilotKpiBannerProps {
  kpis: PilotKpis | null;
  loading: boolean;
  onFilterNeedsAttention?: () => void;
  onFilterFounding?: () => void;
}

export const PilotKpiBanner: React.FC<PilotKpiBannerProps> = ({
  kpis,
  loading,
  onFilterNeedsAttention,
  onFilterFounding
}) => {
  if (loading || !kpis) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-5 animate-pulse">
        <div className="h-4 bg-slate-700/50 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-700/30 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const slotPercent = Math.min(100, Math.round((kpis.foundingSlotsAllocated / kpis.maxFoundingSlots) * 100));

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Founding Partner Pilot & Customer Activation Operations
            </h2>
            <p className="text-[11px] text-slate-400">First 10 commercial deployment cohort tracking</p>
          </div>
        </div>

        {/* Founding Slots Status */}
        <div
          onClick={onFilterFounding}
          className="flex items-center gap-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors"
        >
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Founding Quota</div>
            <div className="text-xs font-black text-white">
              {kpis.foundingSlotsAllocated} / {kpis.maxFoundingSlots} Slots
            </div>
          </div>
          <div className="w-16 bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                kpis.foundingSlotsAllocated >= kpis.maxFoundingSlots ? 'bg-amber-400' : 'bg-indigo-500'
              }`}
              style={{ width: `${slotPercent}%` }}
            />
          </div>
          {kpis.foundingSlotsAllocated >= kpis.maxFoundingSlots && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Full
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Active Trials */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Active Trials</span>
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1">{kpis.trialsActive}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">14-Day Professional</div>
        </div>

        {/* Trials Expiring Soon */}
        <div
          className={`border rounded-xl p-3 transition-colors ${
            kpis.trialsExpiringSoon > 0
              ? 'bg-amber-950/20 border-amber-500/40'
              : 'bg-slate-800/40 border-slate-700/60'
          }`}
        >
          <div className="flex items-center justify-between text-[11px]">
            <span className={kpis.trialsExpiringSoon > 0 ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
              Expiring Soon
            </span>
            <AlertTriangle
              className={`w-3.5 h-3.5 ${kpis.trialsExpiringSoon > 0 ? 'text-amber-400' : 'text-slate-400'}`}
            />
          </div>
          <div className="text-xl font-bold text-white mt-1">{kpis.trialsExpiringSoon}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">&le; 3 Days Remaining</div>
        </div>

        {/* Converted Paid */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Converted</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{kpis.customersConverted}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {kpis.starterCustomers} Starter • {kpis.professionalCustomers} Pro
          </div>
        </div>

        {/* Avg Activation Score */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Activation</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1">{kpis.averageActivationScore} / 100</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Cohort Average</div>
        </div>

        {/* Avg Feedback */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Customer CSAT</span>
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 mt-1">{kpis.averageFeedbackRating} ★</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Verified Feedback</div>
        </div>

        {/* Attention Alerts */}
        <div
          onClick={onFilterNeedsAttention}
          className={`border rounded-xl p-3 cursor-pointer transition-colors ${
            kpis.organisationsNeedingAttentionCount > 0
              ? 'bg-rose-950/25 border-rose-500/40 hover:bg-rose-950/40'
              : 'bg-slate-800/40 border-slate-700/60'
          }`}
        >
          <div className="flex items-center justify-between text-[11px]">
            <span
              className={
                kpis.organisationsNeedingAttentionCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'
              }
            >
              Needs Attention
            </span>
            <ShieldAlert
              className={`w-3.5 h-3.5 ${
                kpis.organisationsNeedingAttentionCount > 0 ? 'text-rose-400' : 'text-slate-400'
              }`}
            />
          </div>
          <div
            className={`text-xl font-bold mt-1 ${
              kpis.organisationsNeedingAttentionCount > 0 ? 'text-rose-400' : 'text-white'
            }`}
          >
            {kpis.organisationsNeedingAttentionCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Requires Founder Action</div>
        </div>
      </div>
    </div>
  );
};
