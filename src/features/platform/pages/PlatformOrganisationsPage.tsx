import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Search,
  Plus,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  X,
  Sparkles
} from 'lucide-react';
import {
  platformOrganisationService
} from '../../../services/platformOrganisationService';
import { organisationProvisioningService } from '../../../services/provisioning/organisationProvisioningService';
import { onboardingTemplateService } from '../../../services/onboarding/onboardingTemplateService';
import { subscriptionPlanRepository } from '../../../repositories/subscriptionPlanRepository';
import { organisationOnboardingRepository } from '../../../repositories/organisationOnboardingRepository';
import { useAuth } from '../../../contexts/AuthContext';
import { PilotKpiBanner } from '../components/PilotKpiBanner';
import { FoundingPartnerTrackerCard } from '../components/FoundingPartnerTrackerCard';
import { customerActivationService } from '../../../services/platform/customerActivationService';
import type {
  Organisation,
  TenantStatus,
  SubscriptionPlan,
  OrganisationTemplate,
  ProvisioningMode,
  PilotKpis,
  NeedsAttentionItem
} from '../../../types';

export const PlatformOrganisationsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pilot & Founding Partner State
  const [pilotKpis, setPilotKpis] = useState<PilotKpis | null>(null);
  const [attentionMap, setAttentionMap] = useState<Map<string, NeedsAttentionItem>>(new Map());
  const [quickFilter, setQuickFilter] = useState<'all' | 'trials' | 'onboarding' | 'founding' | 'attention' | 'converted'>('all');

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenantStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(searchParams.get('new') === 'true');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [templates, setTemplates] = useState<OrganisationTemplate[]>([]);
  const [onboardingMap, setOnboardingMap] = useState<Map<string, string>>(new Map());

  const [formData, setFormData] = useState({
    name: '',
    organisationType: 'music_and_dance',
    primaryAdminEmail: '',
    primaryAdminName: '',
    phone: '',
    address: '',
    country: 'South Africa',
    currency: 'ZAR',
    timezone: 'Africa/Johannesburg',
    planId: 'plan_professional',
    provisioningMode: 'trial' as ProvisioningMode,
    trialDays: 14,
    organisationTemplate: 'school_music'
  });

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const [list, plansData, obList, kpis, attentionItems] = await Promise.all([
        platformOrganisationService.listOrganisations(),
        subscriptionPlanRepository.getAll(),
        organisationOnboardingRepository.getAll(),
        customerActivationService.getPilotKpis().catch(() => null),
        customerActivationService.getNeedsAttentionList().catch(() => [])
      ]);
      setOrganisations(list);
      setPlans(plansData);
      setTemplates(onboardingTemplateService.listTemplates());
      setPilotKpis(kpis);
      const attMap = new Map<string, NeedsAttentionItem>();
      for (const item of attentionItems) {
        attMap.set(item.organisationId, item);
      }
      setAttentionMap(attMap);
      const map = new Map<string, string>();
      for (const ob of obList) {
        map.set(ob.organisationId, ob.onboardingStatus);
      }
      setOnboardingMap(map);
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch organisations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  // Filtered List
  const filteredOrganisations = useMemo(() => {
    return organisations.filter((org) => {
      // Quick Filters
      if (quickFilter === 'founding' && !org.isFoundingPartner) return false;
      if (quickFilter === 'attention' && !attentionMap.has(org.id)) return false;
      if (quickFilter === 'trials' && org.tenantStatus !== 'trial') return false;
      if (quickFilter === 'onboarding' && onboardingMap.get(org.id) === 'completed') return false;
      if (
        quickFilter === 'converted' &&
        org.foundingPartnerStatus !== 'converted' &&
        org.tenantStatus !== 'active'
      ) {
        return false;
      }

      const matchesStatus = statusFilter === 'all' || (org.tenantStatus || 'active') === statusFilter;
      const matchesType = typeFilter === 'all' || org.organisationType === typeFilter;
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        org.name.toLowerCase().includes(term) ||
        org.id.toLowerCase().includes(term) ||
        (org.primaryAdminEmail && org.primaryAdminEmail.toLowerCase().includes(term)) ||
        (org.slug && org.slug.toLowerCase().includes(term));

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [organisations, search, statusFilter, typeFilter, quickFilter, attentionMap, onboardingMap]);

  const handleOpenModal = () => {
    setModalOpen(true);
    setFormError(null);
    setDuplicateWarning(null);
    setSearchParams({ new: 'true' });
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSearchParams({});
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Organisation name is required.');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      // Check duplicates
      const dup = await platformOrganisationService.checkDuplicate(
        formData.name,
        formData.primaryAdminEmail || undefined
      );
      if (dup.isDuplicateName && !duplicateWarning) {
        setDuplicateWarning('An organisation with this name already exists. Submit again to confirm.');
        setFormSubmitting(false);
        return;
      }

      await organisationProvisioningService.provisionOrganisation(user?.uid || 'super_admin', {
        organisationName: formData.name.trim(),
        organisationType: formData.organisationType,
        primaryAdminEmail: formData.primaryAdminEmail.trim(),
        primaryAdminName: formData.primaryAdminName.trim() || undefined,
        contactPhone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        country: formData.country,
        currency: formData.currency,
        timezone: formData.timezone,
        planId: formData.planId || (plans[0]?.id ?? 'plan_professional'),
        provisioningMode: formData.provisioningMode,
        trialDays: formData.trialDays,
        organisationTemplate: formData.organisationTemplate || undefined
      });

      handleCloseModal();
      setFormData({
        name: '',
        organisationType: 'music_and_dance',
        primaryAdminEmail: '',
        primaryAdminName: '',
        phone: '',
        address: '',
        country: 'South Africa',
        currency: 'ZAR',
        timezone: 'Africa/Johannesburg',
        planId: 'plan_professional',
        provisioningMode: 'trial',
        trialDays: 14,
        organisationTemplate: 'school_music'
      });
      await handleRefresh();
    } catch (err) {
      setFormError((err as Error).message || 'Failed to provision organisation');
    } finally {
      setFormSubmitting(false);
    }
  };

  const getOnboardingBadge = (obStatus?: string) => {
    switch (obStatus) {
      case 'completed':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'ready_for_review':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'in_progress':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
      case 'not_started':
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const getStatusBadge = (status?: TenantStatus) => {
    const s = status || 'active';
    switch (s) {
      case 'active':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'trial':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
      case 'provisioning':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'restricted':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'suspended':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'cancelled':
        return 'text-slate-400 bg-slate-700/50 border-slate-600';
      case 'archived':
        return 'text-slate-500 bg-slate-800 border-slate-700';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-400" />
            Organisation Directory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Directory of all customer organisations and SaaS tenant lifecycle management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            title="Refresh directory"
            aria-label="Refresh directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Organisation
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-red-200 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Pilot KPI Banner */}
      <PilotKpiBanner
        kpis={pilotKpis}
        loading={loading}
        onFilterNeedsAttention={() => setQuickFilter('attention')}
        onFilterFounding={() => setQuickFilter('founding')}
      />

      {/* First 10 Founding Partner Tracker */}
      <FoundingPartnerTrackerCard organisations={organisations} />

      {/* Quick Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setQuickFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            quickFilter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          All Organisations ({organisations.length})
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter('founding')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            quickFilter === 'founding'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-800 text-amber-400 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Founding Partners ({organisations.filter((o) => o.isFoundingPartner).length})
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter('attention')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            quickFilter === 'attention'
              ? 'bg-rose-600 text-white'
              : 'bg-slate-800 text-rose-400 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Needs Attention ({attentionMap.size})
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter('trials')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            quickFilter === 'trials'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          Active Trials ({organisations.filter((o) => o.tenantStatus === 'trial').length})
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter('converted')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            quickFilter === 'converted'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-800 text-emerald-400 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          Converted Paid
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by organisation name, ID, slug, or admin email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TenantStatus | 'all')}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Tenant Statuses</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="provisioning">Provisioning</option>
            <option value="restricted">Restricted</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="music">Music</option>
            <option value="dance">Dance</option>
            <option value="music_and_dance">Music & Dance</option>
            <option value="drama">Drama</option>
            <option value="performing_arts">Performing Arts</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Organisation</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Tenant Status</th>
                <th className="py-3 px-4">Onboarding</th>
                <th className="py-3 px-4">Assigned Plan</th>
                <th className="py-3 px-4">Primary Admin</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    Loading organisations...
                  </td>
                </tr>
              ) : filteredOrganisations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    No organisations match your search or filters.
                  </td>
                </tr>
              ) : (
                filteredOrganisations.map((org) => {
                  const status = org.tenantStatus || 'active';
                  const obStatus = onboardingMap.get(org.id) || (status === 'provisioning' ? 'in_progress' : 'completed');
                  const planLabel = org.assignedPlanId ? org.assignedPlanId.replace(/^plan_/, '') : 'legacy_full';
                  return (
                    <tr key={org.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{org.name}</span>
                          {org.isFoundingPartner && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                              <span>#{org.foundingPartnerNumber || '01'} Founding</span>
                            </span>
                          )}
                          {attentionMap.has(org.id) && (
                            <span
                              className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1"
                              title={attentionMap.get(org.id)?.reason}
                            >
                              <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                              <span>Attention</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-400">{org.id}</span>
                          {org.slug && <span className="text-[10px] text-indigo-400 font-mono">/{org.slug}</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300 capitalize">
                        {org.organisationType.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(status)}`}>
                          {status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getOnboardingBadge(obStatus)}`}>
                          {obStatus.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-indigo-300">
                          {planLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {org.primaryAdminEmail || org.email || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/platform/organisations/${org.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <span>Manage</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Organisation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2 text-white font-bold">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span>Provision New Tenant Organisation</span>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-900/40 border border-red-700 text-xs text-red-200 rounded-lg">
                {formError}
              </div>
            )}

            {duplicateWarning && (
              <div className="p-3 bg-amber-900/40 border border-amber-700 text-xs text-amber-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{duplicateWarning}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Organisation Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setDuplicateWarning(null);
                  }}
                  placeholder="e.g. Cape Town Performing Arts Academy"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Organisation Type
                </label>
                <select
                  value={formData.organisationType}
                  onChange={(e) => setFormData({ ...formData, organisationType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="music_and_dance">Music & Dance</option>
                  <option value="music">Music</option>
                  <option value="dance">Dance</option>
                  <option value="drama">Drama</option>
                  <option value="performing_arts">Performing Arts</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Primary Admin Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.primaryAdminEmail}
                    onChange={(e) => setFormData({ ...formData, primaryAdminEmail: e.target.value })}
                    placeholder="admin@school.example.com"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Primary Admin Name
                  </label>
                  <input
                    type="text"
                    value={formData.primaryAdminName}
                    onChange={(e) => setFormData({ ...formData, primaryAdminName: e.target.value })}
                    placeholder="e.g. Principal Jane Doe"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Subscription Plan *
                  </label>
                  <select
                    value={formData.planId}
                    onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Provisioning Mode
                  </label>
                  <select
                    value={formData.provisioningMode}
                    onChange={(e) => setFormData({ ...formData, provisioningMode: e.target.value as ProvisioningMode })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="trial">14-Day Commercial Trial</option>
                    <option value="manual_active">Manual Contract (Active)</option>
                    <option value="complimentary">Complimentary Grant</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Organisation Template
                  </label>
                  <select
                    value={formData.organisationTemplate}
                    onChange={(e) => setFormData({ ...formData, organisationTemplate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">None (Generic)</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.code}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Currency & Country
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ZAR">ZAR (South Africa)</option>
                    <option value="USD">USD (United States)</option>
                    <option value="GBP">GBP (United Kingdom)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-xs font-medium text-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg transition-colors shadow-sm"
                >
                  {formSubmitting ? 'Provisioning...' : 'Provision Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
