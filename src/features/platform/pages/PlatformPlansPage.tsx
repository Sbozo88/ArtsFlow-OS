import React, { useEffect, useState, useMemo } from 'react';
import {
  Package,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Archive,
  Copy,
  Layers,
  Check,
  X
} from 'lucide-react';
import { subscriptionPlanService } from '../../../services/subscriptionPlanService';
import { platformOrganisationService } from '../../../services/platformOrganisationService';
import { planPriceRepository } from '../../../repositories/planPriceRepository';
import { buildStandardPlanPrices } from '../../../config/planPricesRegistry';
import { STANDARD_PLATFORM_FEATURES } from '../../../config/platformFeaturesRegistry';
import { useAuth } from '../../../contexts/AuthContext';
import type { SubscriptionPlan, PlanStatus, PlanEntitlement, PlanPrice } from '../../../types';

export const PlatformPlansPage: React.FC = () => {
  const { authUser } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [prices, setPrices] = useState<PlanPrice[]>([]);
  const [orgCounts, setOrgCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State for Plan Builder
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    planStatus: 'active' as PlanStatus,
    isPublic: true,
    recommended: false,
    selectedFeatures: new Set<string>([
      'core.learners',
      'core.guardians',
      'core.staff',
      'core.programmes',
      'core.groups',
      'core.attendance'
    ]),
    learnerLimit: '' as string,
    staffLimit: '' as string
  });

  // Entitlements Viewer Modal
  const [viewPlan, setViewPlan] = useState<SubscriptionPlan | null>(null);
  const [viewEntitlements, setViewEntitlements] = useState<PlanEntitlement[]>([]);
  const [viewLoading, setViewLoading] = useState(false);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const [allPlans, orgs, allPrices] = await Promise.all([
        subscriptionPlanService.listPlans(),
        platformOrganisationService.listOrganisations(),
        planPriceRepository.getAll()
      ]);
      setPlans(allPlans);
      setPrices(allPrices);

      // Compute org counts per plan
      const counts: Record<string, number> = {};
      for (const org of orgs) {
        const pId = org.assignedPlanId || 'plan_legacy_full';
        counts[pId] = (counts[pId] || 0) + 1;
      }
      setOrgCounts(counts);
    } catch (err) {
      setError((err as Error).message || 'Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedPrices = async () => {
    try {
      setLoading(true);
      setError('');
      const defaultPrices = buildStandardPlanPrices(authUser?.uid || 'super_admin');
      for (const p of defaultPrices) {
        await planPriceRepository.save(p);
      }
      await handleRefresh();
    } catch (err) {
      setError((err as Error).message || 'Failed to initialize default standard prices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      subscriptionPlanService.listPlans(),
      platformOrganisationService.listOrganisations(),
      planPriceRepository.getAll()
    ])
      .then(([allPlans, orgs, allPrices]) => {
        if (isMounted) {
          setPlans(allPlans);
          setPrices(allPrices);
          const counts: Record<string, number> = {};
          for (const org of orgs) {
            const pId = org.assignedPlanId || 'plan_legacy_full';
            counts[pId] = (counts[pId] || 0) + 1;
          }
          setOrgCounts(counts);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError((err as Error).message || 'Failed to load subscription plans');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (statusFilter !== 'all' && p.planStatus !== statusFilter) return false;
      const term = search.trim().toLowerCase();
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term))
      );
    });
  }, [plans, search, statusFilter]);

  const toggleFeature = (key: string) => {
    setFormData((prev) => {
      const next = new Set(prev.selectedFeatures);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return { ...prev, selectedFeatures: next };
    });
  };

  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      planStatus: 'active',
      isPublic: true,
      recommended: false,
      selectedFeatures: new Set([
        'core.learners',
        'core.guardians',
        'core.staff',
        'core.programmes',
        'core.groups',
        'core.attendance'
      ]),
      learnerLimit: '',
      staffLimit: ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setFormError('Plan Name and Plan Code are required.');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const entitlementsPayload: Record<string, boolean | { enabled: boolean; limitValue?: number | null }> = {};
      for (const feat of STANDARD_PLATFORM_FEATURES) {
        if (feat.featureType === 'limit') {
          if (feat.key === 'limits.learners' && formData.learnerLimit) {
            entitlementsPayload[feat.key] = {
              enabled: true,
              limitValue: parseInt(formData.learnerLimit, 10) || null
            };
          } else if (feat.key === 'limits.staff_users' && formData.staffLimit) {
            entitlementsPayload[feat.key] = {
              enabled: true,
              limitValue: parseInt(formData.staffLimit, 10) || null
            };
          } else {
            entitlementsPayload[feat.key] = { enabled: true, limitValue: null };
          }
        } else {
          entitlementsPayload[feat.key] = formData.selectedFeatures.has(feat.key);
        }
      }

      await subscriptionPlanService.createPlan(authUser?.uid || 'super_admin', {
        name: formData.name.trim(),
        code: formData.code.trim().toLowerCase(),
        description: formData.description.trim() || undefined,
        planStatus: formData.planStatus,
        isPublic: formData.isPublic,
        recommended: formData.recommended,
        entitlements: entitlementsPayload
      });

      setIsModalOpen(false);
      await handleRefresh();
    } catch (err) {
      setFormError((err as Error).message || 'Failed to create plan');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleArchive = async (plan: SubscriptionPlan) => {
    if (plan.code === 'legacy_full') {
      alert('The Legacy Full Access plan cannot be archived.');
      return;
    }

    if (!window.confirm(`Are you sure you want to archive plan '${plan.name}'? Existing organisations will retain it, but it cannot be newly assigned.`)) {
      return;
    }

    try {
      await subscriptionPlanService.archivePlan(authUser?.uid || 'super_admin', plan.id);
      await handleRefresh();
    } catch (err) {
      alert((err as Error).message || 'Failed to archive plan');
    }
  };

  const handleDuplicate = (plan: SubscriptionPlan) => {
    setFormData({
      name: `${plan.name} (Copy)`,
      code: `${plan.code}_copy`,
      description: plan.description || '',
      planStatus: 'draft',
      isPublic: false,
      recommended: false,
      selectedFeatures: new Set([
        'core.learners',
        'core.guardians',
        'core.staff',
        'core.programmes',
        'core.groups',
        'core.attendance'
      ]),
      learnerLimit: '',
      staffLimit: ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleViewEntitlements = async (plan: SubscriptionPlan) => {
    setViewPlan(plan);
    setViewLoading(true);
    try {
      const ents = await subscriptionPlanService.getPlanEntitlements(plan.id);
      setViewEntitlements(ents);
    } catch (err) {
      alert((err as Error).message || 'Failed to load plan entitlements');
    } finally {
      setViewLoading(false);
    }
  };

  // Group features by category for the Plan Builder modal
  const categorizedFeatures = useMemo(() => {
    const groups: Record<string, typeof STANDARD_PLATFORM_FEATURES> = {};
    for (const feat of STANDARD_PLATFORM_FEATURES) {
      if (feat.featureType === 'limit') continue; // Handled separately
      if (!groups[feat.category]) groups[feat.category] = [];
      groups[feat.category].push(feat);
    }
    return groups;
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-400" />
            Subscription Plans
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Commercial product packages, modular capability entitlements, and organization limits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            title="Refresh plans"
            aria-label="Refresh plans"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {prices.length === 0 && (
            <button
              type="button"
              onClick={handleSeedPrices}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              Initialize Standard Prices
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Plan
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-red-200 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Plan Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/60 p-4 border border-slate-700/70 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search plans by name, code, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Plans Table */}
      <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/60 border-b border-slate-700/60 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Plan Name & Code</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Standard Pricing</th>
                <th className="px-6 py-4">Visibility</th>
                <th className="px-6 py-4">Assigned Organisations</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40 text-slate-300">
              {loading && plans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading subscription plans...
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No subscription plans found.
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => {
                  const assignedCount = orgCounts[plan.id] || 0;
                  return (
                    <tr key={plan.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              <span>{plan.name}</span>
                              {plan.recommended && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                  Most Popular
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                              <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/60 font-mono text-[11px] text-slate-300">
                                {plan.code}
                              </code>
                              {plan.description && <span className="truncate max-w-xs">{plan.description}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            plan.planStatus === 'active'
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                              : plan.planStatus === 'draft'
                              ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                              : plan.planStatus === 'archived'
                              ? 'text-slate-400 bg-slate-700/20 border-slate-600'
                              : 'text-red-400 bg-red-500/10 border-red-500/30'
                          }`}
                        >
                          {plan.planStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const planMonthly = prices.find((p) => p.planId === plan.id && p.billingInterval === 'monthly');
                          const planAnnual = prices.find((p) => p.planId === plan.id && p.billingInterval === 'annual');
                          if (!planMonthly && !planAnnual) {
                            return <span className="text-xs text-slate-500">Unpriced / Custom</span>;
                          }
                          return (
                            <div className="text-xs text-slate-300 space-y-0.5">
                              {planMonthly && (
                                <div className="font-medium">
                                  {planMonthly.currency} {(planMonthly.amount / 100).toFixed(2)}/mo
                                </div>
                              )}
                              {planAnnual && (
                                <div className="text-slate-400 text-[11px]">
                                  {planAnnual.currency} {(planAnnual.amount / 100).toFixed(2)}/yr
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-300">
                          {plan.isPublic ? 'Public Catalog' : 'Internal / Dedicated'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-xs font-semibold text-white">
                          {assignedCount} {assignedCount === 1 ? 'school' : 'schools'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewEntitlements(plan)}
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs"
                            title="View Entitlements"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(plan)}
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs"
                            title="Duplicate Plan"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {plan.planStatus !== 'archived' && plan.code !== 'legacy_full' && (
                            <button
                              type="button"
                              onClick={() => handleArchive(plan)}
                              className="p-1.5 text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 rounded-lg text-xs"
                              title="Archive Plan"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Builder Modal (Section 35-37) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-400" />
                  Plan Builder
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure plan identity, modular entitlements, and soft capacity limits.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 bg-red-900/30 border border-red-700/50 rounded-xl text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePlan} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Professional Arts"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Plan Code * (Identifier)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. professional_arts"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary of target school profile and included features"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.planStatus}
                    onChange={(e) => setFormData({ ...formData, planStatus: e.target.value as PlanStatus })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isPublic" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Publicly Available
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="recommended"
                    checked={formData.recommended}
                    onChange={(e) => setFormData({ ...formData, recommended: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="recommended" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Recommended Badge
                  </label>
                </div>
              </div>

              {/* Module Feature Groups */}
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider text-indigo-400">
                  Included Feature Entitlements
                </h4>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                  {Object.entries(categorizedFeatures).map(([cat, feats]) => (
                    <div key={cat} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                        {cat}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {feats.map((f) => {
                          const isChecked = formData.selectedFeatures.has(f.key);
                          return (
                            <label
                              key={f.key}
                              className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-indigo-600/10 border-indigo-500/40 text-white'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleFeature(f.key)}
                                className="mt-0.5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div>
                                <div className="font-semibold">{f.name}</div>
                                <div className="text-[11px] text-slate-500 font-mono">{f.key}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Capacity Limits Foundation */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider text-indigo-400">
                  Capacity Limits (Leave blank for Unlimited)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Learner Limit (Active Students)
                    </label>
                    <input
                      type="number"
                      value={formData.learnerLimit}
                      onChange={(e) => setFormData({ ...formData, learnerLimit: e.target.value })}
                      placeholder="Unlimited"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Staff User Seat Limit
                    </label>
                    <input
                      type="number"
                      value={formData.staffLimit}
                      onChange={(e) => setFormData({ ...formData, staffLimit: e.target.value })}
                      placeholder="Unlimited"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                >
                  {formSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Entitlements Modal */}
      {viewPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Entitlements for {viewPlan.name}
                </h3>
                <p className="text-xs text-slate-400">Plan Code: {viewPlan.code}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewPlan(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewLoading ? (
              <div className="py-8 text-center text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                Loading entitlements...
              </div>
            ) : viewEntitlements.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No explicitly saved entitlements found for this plan in database. Default registry values apply.
              </div>
            ) : (
              <div className="divide-y divide-slate-800 text-xs">
                {viewEntitlements.map((ent) => (
                  <div key={ent.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-mono text-white">{ent.featureKey}</div>
                      {ent.limitValue !== null && ent.limitValue !== undefined && (
                        <div className="text-slate-400 text-[11px]">
                          Limit: {ent.limitValue}
                        </div>
                      )}
                    </div>
                    <div>
                      {ent.enabled ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Enabled
                        </span>
                      ) : (
                        <span className="text-slate-500">Disabled</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setViewPlan(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
