import React, { useEffect, useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  RefreshCw,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  PauseCircle,
  Building2,
  ChevronRight,
  X,
  Calendar,
  AlertCircle,
  Zap
} from 'lucide-react';
import { subscriptionRepository } from '../../../repositories/subscriptionRepository';
import { subscriptionPlanRepository } from '../../../repositories/subscriptionPlanRepository';
import { organisationRepository } from '../../../repositories/organisationRepository';
import { saasSubscriptionService } from '../../../services/billing/saasSubscriptionService';
import { subscriptionLifecycleRunner, type LifecycleRunResult } from '../../../services/billing/subscriptionLifecycleRunner';
import { useAuth } from '../../../contexts/AuthContext';
import type {
  Subscription,
  SubscriptionStatus,
  BillingMode,
  BillingInterval,
  SubscriptionPlan,
  Organisation
} from '../../../types';

export const PlatformSubscriptionsPage: React.FC = () => {
  const { authUser } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Form State
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [billingMode, setBillingMode] = useState<BillingMode>('manual');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [currency, setCurrency] = useState('ZAR');
  const [priceInMajor, setPriceInMajor] = useState<number>(499);
  const [trialDays, setTrialDays] = useState<number>(14);
  const [createReason, setCreateReason] = useState('');
  const [createNotes, setCreateNotes] = useState('');

  // Cancel form
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(true);
  const [cancelReason, setCancelReason] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [subsData, plansData, orgsData] = await Promise.all([
        subscriptionRepository.getAll(),
        subscriptionPlanRepository.getAll(),
        organisationRepository.getAll()
      ]);

      setSubscriptions(subsData);
      setPlans(plansData);
      setOrganisations(orgsData);

      if (plansData.length > 0 && !selectedPlanId) {
        setSelectedPlanId(plansData[0].id);
      }
      if (orgsData.length > 0 && !selectedOrgId) {
        setSelectedOrgId(orgsData[0].id);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  // On-demand Lifecycle Runner state
  const [runningLifecycle, setRunningLifecycle] = useState(false);
  const [lifecycleResult, setLifecycleResult] = useState<LifecycleRunResult | null>(null);

  const handleRunLifecycleCheck = async () => {
    try {
      setRunningLifecycle(true);
      setError(null);
      const res = await subscriptionLifecycleRunner.runDailyLifecycleCheck();
      setLifecycleResult(res);
      await loadData();
    } catch (err) {
      setError((err as Error).message || 'Failed to execute subscription lifecycle runner');
    } finally {
      setRunningLifecycle(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [subsData, plansData, orgsData] = await Promise.all([
          subscriptionRepository.getAll(),
          subscriptionPlanRepository.getAll(),
          organisationRepository.getAll()
        ]);

        if (isMounted) {
          setSubscriptions(subsData);
          setPlans(plansData);
          setOrganisations(orgsData);

          if (plansData.length > 0 && !selectedPlanId) {
            setSelectedPlanId(plansData[0].id);
          }
          if (orgsData.length > 0 && !selectedOrgId) {
            setSelectedOrgId(orgsData[0].id);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError((err as Error).message || 'Failed to load subscription data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const planMap = useMemo(() => {
    const map = new Map<string, SubscriptionPlan>();
    for (const p of plans) map.set(p.id, p);
    return map;
  }, [plans]);

  const orgMap = useMemo(() => {
    const map = new Map<string, Organisation>();
    for (const o of organisations) map.set(o.id, o);
    return map;
  }, [organisations]);

  // KPIs
  const stats = useMemo(() => {
    let active = 0;
    let trialing = 0;
    let pastDue = 0;
    let expired = 0;
    let cancelled = 0;

    for (const s of subscriptions) {
      if (s.subscriptionStatus === 'active') active++;
      else if (s.subscriptionStatus === 'trialing') trialing++;
      else if (s.subscriptionStatus === 'past_due') pastDue++;
      else if (s.subscriptionStatus === 'expired') expired++;
      else if (s.subscriptionStatus === 'cancelled') cancelled++;
    }

    return { total: subscriptions.length, active, trialing, pastDue, expired, cancelled };
  }, [subscriptions]);

  // Filtered subscriptions
  const filteredSubs = useMemo(() => {
    return subscriptions.filter((s) => {
      if (statusFilter !== 'all' && s.subscriptionStatus !== statusFilter) return false;
      if (modeFilter !== 'all' && s.billingMode !== modeFilter) return false;
      if (planFilter !== 'all' && s.planId !== planFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const org = orgMap.get(s.organisationId);
        const orgName = org?.name.toLowerCase() || '';
        const providerCust = s.providerCustomerId?.toLowerCase() || '';
        const providerSub = s.providerSubscriptionId?.toLowerCase() || '';
        return (
          orgName.includes(q) ||
          providerCust.includes(q) ||
          providerSub.includes(q) ||
          s.id.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [subscriptions, statusFilter, modeFilter, planFilter, searchQuery, orgMap]);

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedOrgId) {
      setFormError('Please select an organisation.');
      return;
    }
    if (!selectedPlanId) {
      setFormError('Please select a plan.');
      return;
    }

    try {
      setSubmitting(true);
      const actorId = authUser?.uid || 'super_admin';

      if (billingMode === 'manual') {
        if (!createReason.trim()) {
          setFormError('A mandatory justification reason is required for manual subscriptions.');
          return;
        }
        await saasSubscriptionService.createManualSubscription(actorId, selectedOrgId, {
          planId: selectedPlanId,
          billingInterval,
          currency,
          priceAmount: Math.round(priceInMajor * 100), // convert to minor units
          reason: createReason.trim(),
          notes: createNotes.trim() || undefined
        });
      } else if (billingMode === 'complimentary') {
        if (!createReason.trim()) {
          setFormError('A mandatory justification reason is required for complimentary access.');
          return;
        }
        await saasSubscriptionService.createComplimentarySubscription(actorId, selectedOrgId, {
          planId: selectedPlanId,
          reason: createReason.trim(),
          notes: createNotes.trim() || undefined
        });
      } else {
        // Trial creation
        await saasSubscriptionService.createTrial(actorId, selectedOrgId, {
          planId: selectedPlanId,
          trialDays: Number(trialDays) || 14,
          notes: createNotes.trim() || undefined
        });
      }

      setShowCreateModal(false);
      setCreateReason('');
      setCreateNotes('');
      await loadData();
    } catch (err) {
      setFormError((err as Error).message || 'Failed to create subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedSub) return;
    if (!cancelReason.trim()) {
      setFormError('Cancellation reason is required.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const actorId = authUser?.uid || 'super_admin';

      await saasSubscriptionService.cancelSubscription(actorId, selectedSub.id, {
        cancelAtPeriodEnd,
        reason: cancelReason.trim()
      });

      setShowCancelModal(false);
      setShowDetailModal(false);
      setCancelReason('');
      await loadData();
    } catch (err) {
      setFormError((err as Error).message || 'Failed to cancel subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReactivate = async (subId: string) => {
    try {
      setSubmitting(true);
      const actorId = authUser?.uid || 'super_admin';
      await saasSubscriptionService.reactivateSubscription(actorId, subId);
      setShowDetailModal(false);
      await loadData();
    } catch (err) {
      alert((err as Error).message || 'Failed to reactivate subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active
          </span>
        );
      case 'trialing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Trialing
          </span>
        );
      case 'past_due':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            Past Due
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <PauseCircle className="w-3.5 h-3.5" />
            Paused
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            Expired
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  const getBillingModeBadge = (mode: BillingMode) => {
    switch (mode) {
      case 'provider':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Provider
          </span>
        );
      case 'manual':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Manual
          </span>
        );
      case 'complimentary':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
            Complimentary
          </span>
        );
      case 'legacy':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-700 text-slate-300">
            Legacy
          </span>
        );
      default:
        return null;
    }
  };

  const formatMoney = (amountInCents: number, curr: string) => {
    if (!amountInCents) return 'Free';
    return `${curr} ${(amountInCents / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">SaaS Subscriptions</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Manage customer subscription lifecycles, commercial trials, manual billing modes, and renewals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunLifecycleCheck}
            disabled={runningLifecycle || loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
            title="Run daily subscription lifecycle check to expire overdue trials, apply past-due grace restrictions, and process period-end cancellations"
          >
            <Zap className={`w-4 h-4 ${runningLifecycle ? 'animate-spin text-amber-400' : 'text-amber-400'}`} />
            <span>{runningLifecycle ? 'Checking...' : 'Run Lifecycle Check'}</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setFormError(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Subscription</span>
          </button>
        </div>
      </div>

      {lifecycleResult && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">Daily Lifecycle Check Completed</p>
              <p className="text-xs text-emerald-400/90 mt-0.5">
                Processed at {new Date(lifecycleResult.processedAt).toLocaleTimeString()} —{' '}
                <span className="font-medium">{lifecycleResult.expiredTrials}</span> trial(s) expired,{' '}
                <span className="font-medium">{lifecycleResult.pastDueRestricted}</span> past-due tenant(s) restricted,{' '}
                <span className="font-medium">{lifecycleResult.periodEndCancelled}</span> subscription(s) concluded.
              </p>
            </div>
          </div>
          <button
            onClick={() => setLifecycleResult(null)}
            className="p-1 hover:bg-emerald-500/20 text-emerald-400 rounded transition-colors"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total</div>
          <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Active</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.active}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-amber-400 font-medium uppercase tracking-wider">Trialing</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{stats.trialing}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-rose-400 font-medium uppercase tracking-wider">Past Due</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{stats.pastDue}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Cancelled/Exp</div>
          <div className="text-2xl font-bold text-slate-400 mt-1">{stats.cancelled + stats.expired}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search organisation, provider ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Past Due</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Billing Modes</option>
              <option value="provider">Provider</option>
              <option value="manual">Manual</option>
              <option value="complimentary">Complimentary</option>
              <option value="legacy">Legacy</option>
            </select>
          </div>

          <div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Plans</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Organisation</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Mode</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Period / Trial End</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading subscriptions...
                  </td>
                </tr>
              ) : filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No subscriptions match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => {
                  const org = orgMap.get(sub.organisationId);
                  const plan = planMap.get(sub.planId);

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedSub(sub);
                        setShowDetailModal(true);
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-500" />
                          <span>{org?.name || sub.organisationId}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{sub.id}</div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-200">
                          {plan?.name || sub.planId}
                        </span>
                      </td>

                      <td className="px-6 py-4">{getStatusBadge(sub.subscriptionStatus)}</td>

                      <td className="px-6 py-4">{getBillingModeBadge(sub.billingMode)}</td>

                      <td className="px-6 py-4 text-slate-300 font-medium">
                        {formatMoney(sub.priceAmount, sub.currency)}
                        <span className="text-xs text-slate-500 ml-1">/{sub.billingInterval}</span>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-400">
                        {sub.subscriptionStatus === 'trialing' && sub.trialEndsAt ? (
                          <div className="flex items-center gap-1 text-amber-400 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Ends {new Date(sub.trialEndsAt).toLocaleDateString()}</span>
                          </div>
                        ) : sub.currentPeriodEnd ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                        {sub.cancelAtPeriodEnd && (
                          <div className="text-rose-400 text-[11px] font-semibold mt-0.5">
                            Cancels at period end
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className="text-indigo-400 hover:text-indigo-300 font-medium text-xs flex items-center justify-end gap-1">
                          Details <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE SUBSCRIPTION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">Create Commercial Subscription</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Organisation *
                </label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                >
                  {organisations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.tenantStatus || 'active'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Subscription Plan *
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Commercial Mode *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBillingMode('manual')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                      billingMode === 'manual'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Manual Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingMode('complimentary')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                      billingMode === 'complimentary'
                        ? 'bg-teal-600/20 border-teal-500 text-teal-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Complimentary
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingMode('legacy')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                      billingMode === 'legacy'
                        ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Trial Mode
                  </button>
                </div>
              </div>

              {billingMode === 'manual' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Interval
                    </label>
                    <select
                      value={billingInterval}
                      onChange={(e) => setBillingInterval(e.target.value as BillingInterval)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Currency
                    </label>
                    <input
                      type="text"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Price ({currency})
                    </label>
                    <input
                      type="number"
                      value={priceInMajor}
                      onChange={(e) => setPriceInMajor(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      min={0}
                    />
                  </div>
                </div>
              )}

              {billingMode === 'legacy' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Trial Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={trialDays}
                    onChange={(e) => setTrialDays(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    min={1}
                    max={90}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Mandatory Audit Reason *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Enterprise pilot agreement signed offline"
                  value={createReason}
                  onChange={(e) => setCreateReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required={billingMode !== 'legacy'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Internal Notes (Optional)
                </label>
                <textarea
                  placeholder="Additional commercial context..."
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
                >
                  {submitting ? 'Creating...' : 'Create Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBSCRIPTION DETAIL MODAL */}
      {showDetailModal && selectedSub && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold text-white">Subscription Details</h2>
                </div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">{selectedSub.id}</div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <div className="text-xs text-slate-500">Organisation</div>
                <div className="font-semibold text-white mt-0.5">
                  {orgMap.get(selectedSub.organisationId)?.name || selectedSub.organisationId}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Commercial Plan</div>
                <div className="font-semibold text-indigo-400 mt-0.5">
                  {planMap.get(selectedSub.planId)?.name || selectedSub.planId}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Status</div>
                <div className="mt-1">{getStatusBadge(selectedSub.subscriptionStatus)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Billing Mode</div>
                <div className="mt-1">{getBillingModeBadge(selectedSub.billingMode)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Price</div>
                <div className="font-semibold text-white mt-0.5">
                  {formatMoney(selectedSub.priceAmount, selectedSub.currency)} / {selectedSub.billingInterval}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Provider</div>
                <div className="text-slate-300 mt-0.5">{selectedSub.providerType || 'Manual'}</div>
              </div>
            </div>

            {/* Trial dates */}
            {selectedSub.subscriptionStatus === 'trialing' && selectedSub.trialEndsAt && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-center justify-between">
                <div>
                  <div className="font-semibold">Active Trial</div>
                  <div className="text-[11px] text-amber-400/80">
                    Expires {new Date(selectedSub.trialEndsAt).toLocaleString()}
                  </div>
                </div>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
            )}

            {/* Period dates */}
            {selectedSub.currentPeriodEnd && (
              <div className="text-xs text-slate-400 space-y-1">
                <div>Period Start: {new Date(selectedSub.currentPeriodStart || '').toLocaleDateString()}</div>
                <div>Period End: {new Date(selectedSub.currentPeriodEnd).toLocaleDateString()}</div>
              </div>
            )}

            {/* Cancellation info */}
            {selectedSub.cancelledAt && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs space-y-1 text-rose-300">
                <div className="font-semibold">Cancelled on {new Date(selectedSub.cancelledAt).toLocaleString()}</div>
                {selectedSub.cancellationReason && (
                  <div className="text-[11px] text-rose-400/80">Reason: {selectedSub.cancellationReason}</div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              {['active', 'trialing', 'past_due'].includes(selectedSub.subscriptionStatus) ? (
                <button
                  onClick={() => {
                    setCancelReason('');
                    setShowCancelModal(true);
                  }}
                  className="px-4 py-2 bg-rose-600/20 border border-rose-500/30 hover:bg-rose-600/30 text-rose-300 text-sm font-semibold rounded-lg transition-colors"
                >
                  Cancel Subscription
                </button>
              ) : selectedSub.subscriptionStatus === 'cancelled' ? (
                <button
                  onClick={() => handleReactivate(selectedSub.id)}
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Reactivate Subscription
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {showCancelModal && selectedSub && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Cancel Subscription</h3>
            </div>

            <p className="text-xs text-slate-400">
              Cancelling a commercial subscription preserves all operational data. Select whether cancellation takes effect immediately or at period end.
            </p>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <div className="space-y-3 text-sm">
              <label className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={cancelAtPeriodEnd}
                  onChange={(e) => setCancelAtPeriodEnd(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-semibold text-white text-xs">Cancel at Period End (Recommended)</div>
                  <div className="text-[11px] text-slate-500">
                    Organisation remains active until {selectedSub.currentPeriodEnd ? new Date(selectedSub.currentPeriodEnd).toLocaleDateString() : 'period end'}
                  </div>
                </div>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Mandatory Cancellation Reason *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Customer decided not to renew"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={submitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
              >
                {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
