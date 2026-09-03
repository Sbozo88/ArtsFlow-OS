import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Activity,
  AlertTriangle,
  Lock,
  CreditCard
} from 'lucide-react';
import { customerActivationService } from '../../../services/platform/customerActivationService';
import { foundingPartnerService } from '../../../services/platform/foundingPartnerService';
import { platformSupportService } from '../../../services/platform/platformSupportService';
import { useAuth } from '../../../contexts/AuthContext';
import type {
  Organisation,
  ConversionReadinessSummary,
  ActivationScoreResult
} from '../../../types';

interface ConversionReadinessCardProps {
  organisation: Organisation;
  onRefresh: () => void;
}

export const ConversionReadinessCard: React.FC<ConversionReadinessCardProps> = ({
  organisation,
  onRefresh
}) => {
  const { authUser } = useAuth();
  const [readiness, setReadiness] = useState<ConversionReadinessSummary | null>(null);
  const [_activation, setActivation] = useState<ActivationScoreResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Extend Trial Modal State
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [extendDays, setExtendDays] = useState(14);
  const [extendReason, setExtendReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [r, act] = await Promise.all([
        customerActivationService.getConversionReadiness(organisation.id),
        customerActivationService.calculateActivationScore(organisation.id)
      ]);
      setReadiness(r);
      setActivation(act);
    } catch (err) {
      setActionError((err as Error).message || 'Failed to load conversion readiness');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organisation.id]);

  const handleToggleFoundingPartner = async () => {
    if (!authUser) return;
    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      if (organisation.isFoundingPartner) {
        await foundingPartnerService.removeFoundingPartner(
          authUser.uid,
          organisation.id,
          'Removed by Super Admin'
        );
        setActionSuccess('Removed organisation from Founding Partner Programme.');
      } else {
        await foundingPartnerService.assignFoundingPartner(authUser.uid, organisation.id);
        setActionSuccess('Assigned Founding Partner slot with 12-month price protection!');
      }
      onRefresh();
      await loadData();
    } catch (err) {
      setActionError((err as Error).message || 'Failed to update Founding Partner status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvertSubscription = async (planId: 'plan_starter' | 'plan_professional') => {
    if (!authUser) return;
    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await foundingPartnerService.convertFoundingPartnerSubscription(
        authUser.uid,
        organisation.id,
        planId,
        'monthly'
      );
      setActionSuccess(
        `Successfully converted to active ${planId === 'plan_starter' ? 'Starter' : 'Professional'} subscription!`
      );
      onRefresh();
      await loadData();
    } catch (err) {
      setActionError((err as Error).message || 'Failed to convert subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExtendTrial = async () => {
    if (!authUser || !extendReason.trim()) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await platformSupportService.extendTrial(
        organisation.id,
        authUser.uid,
        extendDays,
        extendReason.trim()
      );
      setActionSuccess(`Trial extended by ${extendDays} days.`);
      setExtendModalOpen(false);
      setExtendReason('');
      onRefresh();
      await loadData();
    } catch (err) {
      setActionError((err as Error).message || 'Failed to extend trial');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !readiness) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse">
        <div className="h-5 bg-slate-800 rounded w-1/3 mb-4" />
        <div className="h-24 bg-slate-800/40 rounded-xl" />
      </div>
    );
  }

  const isFounding = Boolean(organisation.isFoundingPartner);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">
              Customer Activation & Commercial Conversion Panel
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic plan recommendation, operational activation score, and Founding Partner conversion.
          </p>
        </div>

        {/* Founding Partner Badge / Button */}
        <div className="flex items-center gap-2">
          {isFounding ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Founding Partner #{organisation.foundingPartnerNumber || '01'}</span>
              </span>
              <button
                type="button"
                onClick={handleToggleFoundingPartner}
                disabled={submitting}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleToggleFoundingPartner}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Assign Founding Partner</span>
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Trial Progress */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Trial Day</span>
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-white mt-1">
            Day {readiness.trialDay} <span className="text-xs font-normal text-slate-500">/ 14</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {readiness.trialDaysRemaining} days remaining
          </div>
        </div>

        {/* Activation Score */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Activation Score</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 mt-1">
            {readiness.activationScore} <span className="text-xs font-normal text-slate-500">/ 100</span>
          </div>
          <div className="text-[11px] font-semibold text-slate-300 capitalize mt-0.5">
            {readiness.activationLevel.replace('_', ' ')}
          </div>
        </div>

        {/* Onboarding Readiness */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Onboarding</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-white mt-1">{readiness.onboardingPercentage}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {readiness.isOnboardingComplete ? 'Complete' : 'In Progress'}
          </div>
        </div>

        {/* Price Protection */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Price Lock</span>
            <Lock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-amber-400 mt-1">
            {isFounding ? '12 Months' : 'Standard'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {isFounding ? 'Guaranteed Rate' : 'Public Matrix'}
          </div>
        </div>
      </div>

      {/* Suggested Plan Card */}
      <div className="p-4 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 rounded-xl border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Recommended Conversion Plan:
            </span>
            <span className="font-extrabold text-white text-sm bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
              {readiness.suggestedPlanName}
            </span>
          </div>
          <p className="text-xs text-slate-300">{readiness.rationale}</p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs text-slate-400">Monthly Investment</div>
          <div className="text-lg font-black text-white">
            {isFounding ? (
              <span className="text-amber-400">
                R{readiness.foundingMonthlyPrice}
                <span className="text-xs font-normal text-slate-400"> /mo</span>
              </span>
            ) : (
              <span>
                R{readiness.standardMonthlyPrice}
                <span className="text-xs font-normal text-slate-400"> /mo</span>
              </span>
            )}
          </div>
          {isFounding && (
            <div className="text-[10px] text-slate-500 line-through">
              Standard R{readiness.standardMonthlyPrice}/mo
            </div>
          )}
        </div>
      </div>

      {/* Conversion Actions */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Conversion Actions
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Activate Starter */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleConvertSubscription('plan_starter')}
            className="p-3.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-left transition-all group cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs">Convert to Starter</span>
              <CreditCard className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xs text-slate-400 mt-1.5">
              {isFounding ? (
                <span className="text-amber-400 font-bold">R399 / mo (Founding Rate)</span>
              ) : (
                <span>R499 / mo (Standard Rate)</span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Up to 100 learners • Core features</div>
          </button>

          {/* Activate Professional */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleConvertSubscription('plan_professional')}
            className="p-3.5 rounded-xl border border-indigo-500/40 bg-indigo-950/30 hover:bg-indigo-950/50 text-left transition-all group cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-200 text-xs">Convert to Professional</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xs text-slate-400 mt-1.5">
              {isFounding ? (
                <span className="text-amber-400 font-bold">R799 / mo (Founding Rate)</span>
              ) : (
                <span className="text-white font-bold">R999 / mo (Standard Rate)</span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Up to 500 learners • Events • Transport
            </div>
          </button>

          {/* Extend Trial */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => setExtendModalOpen(true)}
            className="p-3.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-left transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 text-xs">Extend Trial</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xs text-slate-400 mt-1.5">+7 or +14 Days Grace</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Requires audit log rationale</div>
          </button>
        </div>
      </div>

      {/* Trial Extension Modal */}
      {extendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-base">Extend Professional Trial</h3>
            <p className="text-xs text-slate-400">
              Grant additional trial days for {organisation.name}. An audit log entry will be recorded.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Additional Days</label>
              <select
                value={extendDays}
                onChange={(e) => setExtendDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value={7}>+7 Days (1 Week)</option>
                <option value={14}>+14 Days (2 Weeks)</option>
                <option value={30}>+30 Days (1 Month)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason / Justification
              </label>
              <textarea
                rows={2}
                required
                placeholder="e.g. Founding partner awaiting school governing body meeting approval"
                value={extendReason}
                onChange={(e) => setExtendReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setExtendModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || !extendReason.trim()}
                onClick={handleExtendTrial}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
              >
                {submitting ? 'Extending...' : 'Confirm Extension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
