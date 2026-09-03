import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  ShieldAlert,
  Users,
  Clock,
  CheckCircle2,
  RefreshCw,
  X,
  Lock,
  Archive,
  Ban,
  Package,
  Layers,
  Sliders,
  Check,
  CreditCard,
  Sparkles,
  Activity,
  Wrench,
  AlertTriangle
} from 'lucide-react';
import { platformOrganisationService } from '../../../services/platformOrganisationService';
import { platformSupportService } from '../../../services/platform/platformSupportService';
import { tenantLifecycleService } from '../../../services/tenantLifecycleService';
import { subscriptionPlanService } from '../../../services/subscriptionPlanService';
import { planAssignmentService } from '../../../services/planAssignmentService';
import { entitlementOverrideService } from '../../../services/entitlementOverrideService';
import { entitlementResolverService } from '../../../services/entitlementResolverService';
import { organisationMembershipRepository } from '../../../repositories/organisationMembershipRepository';
import { auditLogRepository } from '../../../repositories/auditLogRepository';
import { subscriptionRepository } from '../../../repositories/subscriptionRepository';
import { organisationOnboardingRepository } from '../../../repositories/organisationOnboardingRepository';
import { provisioningJobRepository } from '../../../repositories/provisioningJobRepository';
import { organisationReadinessService, type ReadinessReport } from '../../../services/onboarding/organisationReadinessService';
import { organisationProvisioningService } from '../../../services/provisioning/organisationProvisioningService';
import { STANDARD_PLATFORM_FEATURES } from '../../../config/platformFeaturesRegistry';
import { useAuth } from '../../../contexts/AuthContext';
import type {
  Organisation,
  OrganisationMembership,
  TenantStatus,
  AuditLog,
  SubscriptionPlan,
  EffectiveEntitlement,
  OrganisationEntitlementOverride,
  OverrideType,
  Subscription,
  OrganisationOnboarding,
  ProvisioningJob,
  PlatformDiagnosticReport
} from '../../../types';

export const PlatformOrganisationDetailPage: React.FC = () => {
  const { organisationId } = useParams<{ organisationId: string }>();
  const { authUser } = useAuth();

  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [memberships, setMemberships] = useState<OrganisationMembership[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [assignedPlan, setAssignedPlan] = useState<SubscriptionPlan | null>(null);
  const [effectiveEntitlements, setEffectiveEntitlements] = useState<Record<string, EffectiveEntitlement>>({});
  const [overrides, setOverrides] = useState<OrganisationEntitlementOverride[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [onboarding, setOnboarding] = useState<OrganisationOnboarding | null>(null);
  const [provisioningJob, setProvisioningJob] = useState<ProvisioningJob | null>(null);
  const [readiness, setReadiness] = useState<ReadinessReport | null>(null);
  const [retryingJob, setRetryingJob] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lifecycle Transition Modal State
  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<TenantStatus | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const [confirmNameInput, setConfirmNameInput] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Change Plan Modal State
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  // Add Override Modal State
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [overrideForm, setOverrideForm] = useState({
    featureKey: 'music.core',
    overrideType: 'enable' as OverrideType,
    limitValue: '',
    reason: '',
    startsAt: '',
    expiresAt: ''
  });

  // Support & Diagnostics State
  const [diagReport, setDiagReport] = useState<PlatformDiagnosticReport | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagModalOpen, setDiagModalOpen] = useState(false);
  const [supportActionLoading, setSupportActionLoading] = useState(false);
  const [supportBannerMessage, setSupportBannerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadOrganisationData = useCallback(async () => {
    if (!organisationId) return;
    try {
      setLoading(true);
      setError(null);

      const [org, mems, logs, ents, ovrs, allPlans, sub] = await Promise.all([
        platformOrganisationService.getOrganisation(organisationId),
        organisationMembershipRepository.getByOrganisation(organisationId),
        auditLogRepository.getByOrganisation(organisationId),
        entitlementResolverService.getOrganisationEntitlements(organisationId),
        entitlementOverrideService.listOverrides(organisationId),
        subscriptionPlanService.listPlans(),
        subscriptionRepository.getPrimarySubscription(organisationId)
      ]);

      if (!org) {
        setError(`Organisation '${organisationId}' not found.`);
        return;
      }

      setOrganisation(org);
      setMemberships(mems);
      setAuditLogs(logs.slice(0, 30));
      setEffectiveEntitlements(ents);
      setOverrides(ovrs);
      setPlans(allPlans);
      setSubscription(sub);

      const resolvedPlan =
        allPlans.find((p) => p.id === (org.assignedPlanId || 'plan_legacy_full')) ||
        allPlans.find((p) => p.code === (org.assignedPlanId || 'legacy_full')) ||
        null;
      setAssignedPlan(resolvedPlan);
      setSelectedPlanId(resolvedPlan?.id || 'plan_legacy_full');
    } catch (err) {
      setError((err as Error).message || 'Failed to load organisation details');
    } finally {
      setLoading(false);
    }
  }, [organisationId]);

  useEffect(() => {
    if (!organisationId) return;
    let isMounted = true;

    Promise.all([
      platformOrganisationService.getOrganisation(organisationId),
      organisationMembershipRepository.getByOrganisation(organisationId),
      auditLogRepository.getByOrganisation(organisationId),
      entitlementResolverService.getOrganisationEntitlements(organisationId),
      entitlementOverrideService.listOverrides(organisationId),
      subscriptionPlanService.listPlans(),
      subscriptionRepository.getPrimarySubscription(organisationId),
      organisationOnboardingRepository.getByOrganisationId(organisationId),
      provisioningJobRepository.getByOrganisationId(organisationId),
      organisationReadinessService.evaluateReadiness(organisationId)
    ])
      .then(([org, mems, logs, ents, ovrs, allPlans, sub, ob, job, read]) => {
        if (!isMounted) return;
        if (!org) {
          setError(`Organisation '${organisationId}' not found.`);
        } else {
          setOrganisation(org);
          setMemberships(mems);
          setAuditLogs(logs.slice(0, 30));
          setEffectiveEntitlements(ents);
          setOverrides(ovrs);
          setPlans(allPlans);
          setSubscription(sub);
          setOnboarding(ob);
          setProvisioningJob(job);
          setReadiness(read);

          const resolvedPlan =
            allPlans.find((p) => p.id === (org.assignedPlanId || 'plan_legacy_full')) ||
            allPlans.find((p) => p.code === (org.assignedPlanId || 'legacy_full')) ||
            null;
          setAssignedPlan(resolvedPlan);
          setSelectedPlanId(resolvedPlan?.id || 'plan_legacy_full');
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError((err as Error).message || 'Failed to load organisation details');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [organisationId]);

  const currentStatus: TenantStatus = organisation?.tenantStatus || 'active';

  // Allowed lifecycle transitions
  const canSuspend = tenantLifecycleService.isValidTransition(currentStatus, 'suspended');
  const canRestrict = tenantLifecycleService.isValidTransition(currentStatus, 'restricted');
  const canActivate = tenantLifecycleService.isValidTransition(currentStatus, 'active');
  const canCancel = tenantLifecycleService.isValidTransition(currentStatus, 'cancelled');
  const canArchive = tenantLifecycleService.isValidTransition(currentStatus, 'archived');

  const openTransitionModal = (target: TenantStatus) => {
    setTargetStatus(target);
    setReasonInput('');
    setConfirmNameInput('');
    setActionError(null);
    setTransitionModalOpen(true);
  };

  const closeTransitionModal = () => {
    setTransitionModalOpen(false);
    setTargetStatus(null);
    setActionError(null);
  };

  const handleExecuteTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !targetStatus) return;

    if (['suspended', 'cancelled', 'archived'].includes(targetStatus)) {
      if (confirmNameInput.trim().toLowerCase() !== organisation?.name.trim().toLowerCase()) {
        setActionError(`Confirmation failed: Type exact name "${organisation?.name}"`);
        return;
      }
    }

    try {
      setActionSubmitting(true);
      setActionError(null);

      await tenantLifecycleService.updateTenantStatus({
        actorId: authUser?.uid || 'super_admin',
        organisationId,
        targetStatus,
        reason: reasonInput.trim() || undefined
      });

      closeTransitionModal();
      await loadOrganisationData();
    } catch (err) {
      setActionError((err as Error).message || 'Failed to update tenant status');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Plan Assignment Handler
  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !selectedPlanId) return;

    try {
      setPlanSubmitting(true);
      setPlanError(null);

      await planAssignmentService.assignPlan(
        authUser?.uid || 'super_admin',
        organisationId,
        selectedPlanId
      );

      setPlanModalOpen(false);
      await loadOrganisationData();
    } catch (err) {
      setPlanError((err as Error).message || 'Failed to assign plan');
    } finally {
      setPlanSubmitting(false);
    }
  };

  // Create Override Handler
  const handleCreateOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId) return;

    if (!overrideForm.reason.trim()) {
      setOverrideError('A justification reason is mandatory for creating an entitlement override.');
      return;
    }

    try {
      setOverrideSubmitting(true);
      setOverrideError(null);

      const limitNum = overrideForm.limitValue ? parseInt(overrideForm.limitValue, 10) : undefined;

      await entitlementOverrideService.createOverride(
        authUser?.uid || 'super_admin',
        organisationId,
        {
          featureKey: overrideForm.featureKey,
          overrideType: overrideForm.overrideType,
          limitValue: limitNum,
          reason: overrideForm.reason.trim(),
          startsAt: overrideForm.startsAt ? new Date(overrideForm.startsAt).toISOString() : undefined,
          expiresAt: overrideForm.expiresAt ? new Date(overrideForm.expiresAt).toISOString() : undefined
        }
      );

      setOverrideModalOpen(false);
      setOverrideForm({
        featureKey: 'music.core',
        overrideType: 'enable',
        limitValue: '',
        reason: '',
        startsAt: '',
        expiresAt: ''
      });
      await loadOrganisationData();
    } catch (err) {
      setOverrideError((err as Error).message || 'Failed to create override');
    } finally {
      setOverrideSubmitting(false);
    }
  };

  // End Override Handler
  const handleEndOverride = async (overrideId: string) => {
    const reason = window.prompt('Enter justification reason for ending this entitlement override:');
    if (!reason || !reason.trim()) {
      alert('A reason is required to end an override.');
      return;
    }

    try {
      await entitlementOverrideService.endOverride(
        authUser?.uid || 'super_admin',
        overrideId,
        reason.trim()
      );
      await loadOrganisationData();
    } catch (err) {
      alert((err as Error).message || 'Failed to end override');
    }
  };

  const handleRetryProvisioning = async () => {
    if (!provisioningJob || !authUser) return;
    try {
      setRetryingJob(true);
      await organisationProvisioningService.retryProvisioning(authUser.uid, provisioningJob.id);
      await loadOrganisationData();
    } catch (err) {
      alert((err as Error).message || 'Failed to retry provisioning');
    } finally {
      setRetryingJob(false);
    }
  };

  const handleRunDiagnostics = async () => {
    if (!organisationId) return;
    try {
      setDiagLoading(true);
      const rep = await platformSupportService.generateDiagnosticReport(organisationId);
      setDiagReport(rep);
      setDiagModalOpen(true);
    } catch (err) {
      setSupportBannerMessage({ type: 'error', text: (err as Error).message || 'Failed to generate diagnostic report' });
    } finally {
      setDiagLoading(false);
    }
  };

  const handleForceSyncUsage = async () => {
    if (!organisationId || !authUser) return;
    try {
      setSupportActionLoading(true);
      await platformSupportService.forceSyncUsage(organisationId, authUser.uid);
      setSupportBannerMessage({ type: 'success', text: 'Usage meters successfully synchronized from authoritative operational records.' });
      await loadOrganisationData();
    } catch (err) {
      setSupportBannerMessage({ type: 'error', text: (err as Error).message || 'Failed to synchronize usage meters' });
    } finally {
      setSupportActionLoading(false);
    }
  };

  const handleExtendTrial = async () => {
    if (!organisationId || !authUser) return;
    try {
      setSupportActionLoading(true);
      await platformSupportService.extendTrial(organisationId, authUser.uid, 14, 'Customer requested trial extension via platform support');
      setSupportBannerMessage({ type: 'success', text: 'Trial extended by 14 days and operational access verified.' });
      await loadOrganisationData();
    } catch (err) {
      setSupportBannerMessage({ type: 'error', text: (err as Error).message || 'Failed to extend trial' });
    } finally {
      setSupportActionLoading(false);
    }
  };

  const handleGrantGrace = async () => {
    if (!organisationId || !authUser) return;
    try {
      setSupportActionLoading(true);
      await platformSupportService.grantPastDueGrace(organisationId, authUser.uid, 7, 'Temporary grace extension approved by platform support');
      setSupportBannerMessage({ type: 'success', text: '7-day past-due grace extension granted.' });
      await loadOrganisationData();
    } catch (err) {
      setSupportBannerMessage({ type: 'error', text: (err as Error).message || 'Failed to grant grace extension' });
    } finally {
      setSupportActionLoading(false);
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
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
      case 'archived':
        return 'text-slate-500 bg-slate-800 border-slate-700';
      default:
        return 'text-slate-400 bg-slate-700 border-slate-600';
    }
  };

  const primaryAdmin = memberships.find(
    (m) => m.role === 'organisation_admin' && m.membershipStatus === 'active'
  );

  if (loading && !organisation) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-sm">Loading organisation tenant...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/platform/organisations"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            title="Back to Organisations"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-white tracking-tight">{organisation?.name}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(
                  currentStatus
                )}`}
              >
                {currentStatus.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {organisation?.id}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadOrganisationData}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors self-start sm:self-auto"
          title="Refresh organisation details"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-red-200 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {supportBannerMessage && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between gap-3 ${
            supportBannerMessage.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-700/60 text-emerald-200'
              : 'bg-rose-950/60 border border-rose-700/60 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {supportBannerMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{supportBannerMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setSupportBannerMessage(null)}
            className="p-1 hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tenant Status Warning Banners */}
      {currentStatus === 'suspended' && (
        <div className="p-4 bg-rose-950/60 border border-rose-700/60 rounded-xl text-rose-200 flex items-start gap-3 shadow-md">
          <Ban className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm text-rose-300">TENANT SUSPENDED</div>
            <p className="text-xs text-rose-200 mt-1 leading-relaxed">
              This organisation currently has NO operational access. Customer records are preserved intact and will be restored immediately when unsuspended.
            </p>
            {organisation?.suspensionReason && (
              <div className="mt-2 text-xs font-mono bg-rose-900/40 p-2 rounded border border-rose-800 text-rose-200">
                Reason: {organisation.suspensionReason}
              </div>
            )}
          </div>
        </div>
      )}

      {currentStatus === 'restricted' && (
        <div className="p-4 bg-amber-950/60 border border-amber-700/60 rounded-xl text-amber-200 flex items-start gap-3 shadow-md">
          <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm text-amber-300">TENANT ACCESS RESTRICTED</div>
            <p className="text-xs text-amber-200 mt-1 leading-relaxed">
              Operational access is restricted. Writes and sensitive exports are restricted by TenantAccessService.
            </p>
            {organisation?.restrictionReason && (
              <div className="mt-2 text-xs font-mono bg-amber-900/40 p-2 rounded border border-amber-800 text-amber-200">
                Reason: {organisation.restrictionReason}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid: Details & Lifecycle Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              Overview & Metadata
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 uppercase tracking-wider block font-semibold text-[10px]">
                  Organisation Name
                </span>
                <span className="text-white font-medium mt-1 block text-sm">{organisation?.name}</span>
              </div>

              <div>
                <span className="text-slate-400 uppercase tracking-wider block font-semibold text-[10px]">
                  URL Slug
                </span>
                <span className="text-slate-200 font-mono mt-1 block">{organisation?.slug || '—'}</span>
              </div>

              <div>
                <span className="text-slate-400 uppercase tracking-wider block font-semibold text-[10px]">
                  Type
                </span>
                <span className="text-slate-200 capitalize mt-1 block">
                  {organisation?.organisationType.replace(/_/g, ' ')}
                </span>
              </div>

              <div>
                <span className="text-slate-400 uppercase tracking-wider block font-semibold text-[10px]">
                  Contact Email
                </span>
                <span className="text-slate-200 font-mono mt-1 block">{organisation?.email || '—'}</span>
              </div>
            </div>
          </div>

          {/* SaaS 3A: Customer Provisioning & Onboarding Status Card */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-700 pb-3">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Provisioning & Onboarding Status
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tenant provisioning lifecycle, admin invitation, and setup readiness.
                </p>
              </div>

              {provisioningJob?.jobStatus === 'failed' && (
                <button
                  type="button"
                  onClick={handleRetryProvisioning}
                  disabled={retryingJob}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${retryingJob ? 'animate-spin' : ''}`} />
                  Retry Provisioning
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-900/60 border border-slate-700/50 rounded-lg space-y-1">
                <span className="text-slate-400 uppercase tracking-wider block font-semibold text-[10px]">
                  Provisioning Job
                </span>
                <span className={`inline-block font-semibold px-2 py-0.5 rounded text-[11px] ${
                  provisioningJob?.jobStatus === 'completed'
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : provisioningJob?.jobStatus === 'failed'
                    ? 'text-rose-400 bg-rose-500/10'
                    : 'text-indigo-400 bg-indigo-500/10'
                }`}>
                  {(provisioningJob?.jobStatus || 'completed').toUpperCase()}
                </span>
                {provisioningJob?.error && (
                  <p className="text-[11px] text-rose-300 mt-1">{provisioningJob.error}</p>
                )}
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-700/50 rounded-lg space-y-1">
                <span className="text-slate-400 uppercase tracking-wider block font-semibold text-[10px]">
                  Onboarding Progress
                </span>
                <span className="font-semibold text-white block text-sm">
                  {(onboarding?.onboardingStatus || 'completed').replace(/_/g, ' ').toUpperCase()}
                </span>
                <span className="text-slate-400 block text-[11px]">
                  {onboarding?.completedSteps?.length || 12} of 12 steps complete
                </span>
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-700/50 rounded-lg space-y-1">
                <span className="text-slate-400 uppercase tracking-wider block font-semibold text-[10px]">
                  Go-Live Readiness
                </span>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${readiness?.isReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {readiness?.percentage || 100}% Ready
                  </span>
                  {readiness?.isReady && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <span className="text-slate-400 block text-[11px]">
                  {readiness?.isReady ? 'All required conditions met' : 'Setup incomplete'}
                </span>
              </div>
            </div>
          </div>

          {/* SaaS 2A: Commercial Plan & Entitlements Section (Section 40-42) */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-700 pb-4">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-400" />
                  Subscription Plan & Commercial Entitlements
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assigned plan packages and active time-bound organisation overrides.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Package className="w-3.5 h-3.5" />
                  Change Plan
                </button>

                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Add Override
                </button>
              </div>
            </div>

            {/* Current Plan Summary */}
            <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Assigned Plan</div>
                <div className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                  <span>{assignedPlan?.name || 'Legacy Full Access'}</span>
                  <code className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-indigo-400">
                    {assignedPlan?.code || 'legacy_full'}
                  </code>
                </div>
                {assignedPlan?.description && (
                  <div className="text-xs text-slate-400 mt-1">{assignedPlan.description}</div>
                )}
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                Active Entitlements
              </span>
            </div>

            {/* Commercial Subscription Summary */}
            <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Commercial Subscription
                  </div>
                  <div className="text-sm font-semibold text-white mt-0.5 flex items-center gap-2">
                    {subscription ? (
                      <>
                        <span className="capitalize">{subscription.subscriptionStatus}</span>
                        <span className="text-xs font-normal text-slate-400">
                          ({subscription.billingMode} • {subscription.currency} {(subscription.priceAmount / 100).toFixed(2)}/{subscription.billingInterval})
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400 font-normal">
                        No active commercial subscription (Legacy / Manual tier)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Link
                to="/platform/subscriptions"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <span>Manage Subscriptions</span>
                <span>→</span>
              </Link>
            </div>

            {/* Overrides Table */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Active & Historical Overrides
              </h3>
              {overrides.length === 0 ? (
                <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl text-xs text-slate-500 text-center">
                  No custom overrides registered for this tenant. Standard plan entitlements apply.
                </div>
              ) : (
                <div className="border border-slate-700/60 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-700/60">
                      <tr>
                        <th className="px-4 py-2.5">Feature</th>
                        <th className="px-4 py-2.5">Type</th>
                        <th className="px-4 py-2.5">Reason</th>
                        <th className="px-4 py-2.5">Expiry</th>
                        <th className="px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {overrides.map((ovr) => {
                        const now = new Date().toISOString();
                        const isExpired = ovr.expiresAt && ovr.expiresAt <= now;
                        const isActive = ovr.status === 'active' && !isExpired;
                        return (
                          <tr key={ovr.id} className="hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 font-mono text-indigo-400">{ovr.featureKey}</td>
                            <td className="px-4 py-2.5 capitalize">{ovr.overrideType}</td>
                            <td className="px-4 py-2.5 max-w-xs truncate text-slate-400">{ovr.reason}</td>
                            <td className="px-4 py-2.5 text-slate-400 text-[11px]">
                              {ovr.expiresAt ? new Date(ovr.expiresAt).toLocaleDateString() : 'Permanent'}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {isActive && (
                                <button
                                  type="button"
                                  onClick={() => handleEndOverride(ovr.id)}
                                  className="text-red-400 hover:text-red-300 text-[11px] underline"
                                >
                                  End Override
                                </button>
                              )}
                              {!isActive && <span className="text-slate-500 text-[11px]">Ended</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Effective Entitlements Breakdown */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Effective Feature Matrix
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STANDARD_PLATFORM_FEATURES.map((feat) => {
                  const ent = effectiveEntitlements[feat.key];
                  const isEnabled = ent?.enabled === true;
                  return (
                    <div
                      key={feat.key}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                        isEnabled
                          ? 'bg-slate-900/60 border-slate-700/80 text-white'
                          : 'bg-slate-900/30 border-slate-800/50 text-slate-500'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{feat.name}</div>
                        <div className="font-mono text-[10px] text-slate-500">{feat.key}</div>
                        {ent?.limitValue !== null && ent?.limitValue !== undefined && (
                          <div className="text-[11px] text-indigo-400 mt-0.5">
                            Limit: {ent.limitValue}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        {isEnabled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            Enabled
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Disabled</span>
                        )}
                        {ent?.source && (
                          <div className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">
                            src: {ent.source}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Memberships Card */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Tenant Memberships ({memberships.length})
            </h2>

            {memberships.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No active memberships recorded for this organisation yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-700/60">
                {memberships.map((m) => (
                  <div key={m.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">{m.displayName || m.email}</div>
                      <div className="text-slate-400">{m.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-700 text-slate-300">
                        {m.role}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          m.membershipStatus === 'active'
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-amber-400 bg-amber-500/10'
                        }`}
                      >
                        {m.membershipStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit History Card */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Tenant Action & Audit History
            </h2>

            {auditLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No audit records recorded yet for this tenant.
              </div>
            ) : (
              <div className="divide-y divide-slate-700/60">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-start justify-between text-xs">
                    <div>
                      <div className="font-mono text-[11px] text-indigo-400 font-semibold">{log.action}</div>
                      <div className="text-slate-400 mt-0.5">
                        Actor: <span className="text-slate-300 font-mono text-[10px]">{log.actorId}</span>
                      </div>
                    </div>
                    <div className="text-right text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Primary Admin & Lifecycle Controls */}
        <div className="space-y-6">
          {/* Primary Admin Contact */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Primary Administrator
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Name:</span>
                <span className="text-white font-semibold">
                  {primaryAdmin?.displayName || organisation?.primaryAdminName || 'Not designated'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Email:</span>
                <span className="text-slate-200 font-mono">
                  {primaryAdmin?.email || organisation?.primaryAdminEmail || organisation?.email || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Status:</span>
                <span className="text-emerald-400 font-medium">
                  {primaryAdmin?.membershipStatus ? primaryAdmin.membershipStatus.toUpperCase() : 'PENDING'}
                </span>
              </div>
            </div>
          </div>

          {/* Tenant Lifecycle Controls */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
              Tenant Lifecycle Controls
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Super Admin authority to transition tenant status. Data remains 100% preserved.
            </p>

            <div className="space-y-2">
              {canActivate && currentStatus !== 'active' && (
                <button
                  type="button"
                  onClick={() => openTransitionModal('active')}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Activate / Restore Tenant
                </button>
              )}

              {canRestrict && (
                <button
                  type="button"
                  onClick={() => openTransitionModal('restricted')}
                  className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  Restrict Access
                </button>
              )}

              {canSuspend && (
                <button
                  type="button"
                  onClick={() => openTransitionModal('suspended')}
                  className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Ban className="w-4 h-4" />
                  Suspend Tenant
                </button>
              )}

              {canCancel && (
                <button
                  type="button"
                  onClick={() => openTransitionModal('cancelled')}
                  className="w-full py-2.5 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Cancel Tenant Contract
                </button>
              )}

              {canArchive && (
                <button
                  type="button"
                  onClick={() => openTransitionModal('archived')}
                  className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-700"
                >
                  <Archive className="w-4 h-4" />
                  Archive Tenant
                </button>
              )}
            </div>
          </div>

          {/* Support Operations & Diagnostics (Fast Phase 5) */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-emerald-400" />
                Support & Diagnostics
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Operator diagnostic tooling and automated maintenance actions for customer support.
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleRunDiagnostics}
                disabled={diagLoading}
                className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Activity className={`w-4 h-4 ${diagLoading ? 'animate-spin' : ''}`} />
                {diagLoading ? 'Evaluating...' : 'Run Diagnostics Report'}
              </button>

              <button
                type="button"
                onClick={handleForceSyncUsage}
                disabled={supportActionLoading}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${supportActionLoading ? 'animate-spin' : ''}`} />
                Force Sync Usage Meters
              </button>

              {(currentStatus === 'trial' || currentStatus === 'restricted' || subscription?.subscriptionStatus === 'trialing') && (
                <button
                  type="button"
                  onClick={handleExtendTrial}
                  disabled={supportActionLoading}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-800/50 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  Extend Trial (+14 Days)
                </button>
              )}

              {(currentStatus === 'restricted' || subscription?.subscriptionStatus === 'past_due') && (
                <button
                  type="button"
                  onClick={handleGrantGrace}
                  disabled={supportActionLoading}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-800/50 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Grant Grace Extension (+7 Days)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Change Plan Modal */}
      {planModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2 font-bold text-white">
                <Package className="w-5 h-5 text-indigo-400" />
                <span>Assign Subscription Plan</span>
              </div>
              <button
                type="button"
                onClick={() => setPlanModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {planError && (
              <div className="p-3 bg-red-900/40 border border-red-700 text-xs text-red-200 rounded-lg">
                {planError}
              </div>
            )}

            <form onSubmit={handleAssignPlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Select Commercial Plan
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {plans
                    .filter((p) => p.planStatus !== 'archived')
                    .map((p) => (
                      <label
                        key={p.id}
                        className={`flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                          selectedPlanId === p.id
                            ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="plan"
                            value={p.id}
                            checked={selectedPlanId === p.id}
                            onChange={() => setSelectedPlanId(p.id)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <div>{p.name}</div>
                            <div className="text-[11px] font-mono text-slate-400">{p.code}</div>
                          </div>
                        </div>
                        {p.recommended && (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                            Recommended
                          </span>
                        )}
                      </label>
                    ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-xs font-medium text-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={planSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                >
                  {planSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Override Modal */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2 font-bold text-white">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <span>Create Entitlement Override</span>
              </div>
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {overrideError && (
              <div className="p-3 bg-red-900/40 border border-red-700 text-xs text-red-200 rounded-lg">
                {overrideError}
              </div>
            )}

            <form onSubmit={handleCreateOverride} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Feature Key *
                </label>
                <select
                  value={overrideForm.featureKey}
                  onChange={(e) => setOverrideForm({ ...overrideForm, featureKey: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                >
                  {STANDARD_PLATFORM_FEATURES.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.name} ({f.key})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Override Action
                  </label>
                  <select
                    value={overrideForm.overrideType}
                    onChange={(e) => setOverrideForm({ ...overrideForm, overrideType: e.target.value as OverrideType })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="enable">Force Enable</option>
                    <option value="disable">Force Disable</option>
                    <option value="limit">Custom Limit</option>
                  </select>
                </div>

                {overrideForm.overrideType === 'limit' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Limit Value
                    </label>
                    <input
                      type="number"
                      required
                      value={overrideForm.limitValue}
                      onChange={(e) => setOverrideForm({ ...overrideForm, limitValue: e.target.value })}
                      placeholder="e.g. 500"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Starts At (Optional)
                  </label>
                  <input
                    type="date"
                    value={overrideForm.startsAt}
                    onChange={(e) => setOverrideForm({ ...overrideForm, startsAt: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Expires At (Optional)
                  </label>
                  <input
                    type="date"
                    value={overrideForm.expiresAt}
                    onChange={(e) => setOverrideForm({ ...overrideForm, expiresAt: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Justification Reason *
                </label>
                <textarea
                  required
                  rows={2}
                  value={overrideForm.reason}
                  onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                  placeholder="Mandatory reason for audit trail (e.g. Special pilot trial, enterprise SLA adjustment)..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-xs font-medium text-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                >
                  {overrideSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Transition Confirmation Modal */}
      {transitionModalOpen && targetStatus && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2 font-bold text-white">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>Confirm Tenant Transition: {targetStatus.toUpperCase()}</span>
              </div>
              <button
                type="button"
                onClick={closeTransitionModal}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-red-900/40 border border-red-700 text-xs text-red-200 rounded-lg">
                {actionError}
              </div>
            )}

            <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
              <p className="font-semibold text-white">Data Preservation Assurance:</p>
              <p className="mt-1 text-slate-400">
                This action only modifies tenant operational status. Learners, finances, staff assignments, and documents will NOT be deleted.
              </p>
            </div>

            <form onSubmit={handleExecuteTransition} className="space-y-4">
              {tenantLifecycleService.requiresReason(targetStatus) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Justification Reason *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    placeholder="Enter explicit reason for audit log..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {['suspended', 'cancelled', 'archived'].includes(targetStatus) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Type organisation name &quot;{organisation?.name}&quot; to confirm:
                  </label>
                  <input
                    type="text"
                    required
                    value={confirmNameInput}
                    onChange={(e) => setConfirmNameInput(e.target.value)}
                    placeholder={organisation?.name}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeTransitionModal}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-xs font-medium text-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors shadow-sm ${
                    targetStatus === 'suspended'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : targetStatus === 'active'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-indigo-600 hover:bg-indigo-500'
                  }`}
                >
                  {actionSubmitting ? 'Updating...' : `Confirm ${targetStatus.toUpperCase()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diagnostic Report Modal (Fast Phase 5) */}
      {diagModalOpen && diagReport && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2.5">
                <Activity className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Diagnostic & Health Assessment</h3>
                  <p className="text-xs text-slate-400">{diagReport.organisationName} ({diagReport.organisationId})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDiagModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Health Score Banner */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Health Score</span>
                <div className="text-3xl font-extrabold text-white mt-1">
                  {diagReport.healthScore}
                  <span className="text-base font-normal text-slate-400"> / 100</span>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                    diagReport.healthScore >= 80
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : diagReport.healthScore >= 50
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {diagReport.healthScore >= 80 ? 'EXCELLENT' : diagReport.healthScore >= 50 ? 'NEEDS ATTENTION' : 'CRITICAL'}
                </span>
                <div className="text-[11px] text-slate-400 mt-1">
                  Readiness: <span className="text-slate-200 capitalize">{diagReport.readinessStatus.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>

            {/* Assessment Breakdown Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-700/40">
                <span className="text-slate-400 block font-medium">Tenant Operational State:</span>
                <span className={`font-semibold mt-1 inline-block ${diagReport.lifecycleState.isOperational ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {diagReport.lifecycleState.isOperational ? 'Operational (Fully Active)' : 'Restricted / Inactive'}
                </span>
              </div>

              <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-700/40">
                <span className="text-slate-400 block font-medium">Admin User Assignment:</span>
                <span className={`font-semibold mt-1 inline-block ${diagReport.hasOwnerOrAdmin ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {diagReport.adminCount} Active Admin{diagReport.adminCount === 1 ? '' : 's'}
                </span>
              </div>

              <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-700/40">
                <span className="text-slate-400 block font-medium">Subscription Tier:</span>
                <span className="font-semibold text-slate-200 mt-1 inline-block">
                  {diagReport.subscription?.planId || 'plan_legacy_full'} ({diagReport.subscription?.subscriptionStatus || 'active'})
                </span>
              </div>

              <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-700/40">
                <span className="text-slate-400 block font-medium">Plan Capacity State:</span>
                <span className={`font-semibold mt-1 inline-block ${diagReport.usageSummary?.anyExceeded ? 'text-rose-400' : diagReport.usageSummary?.anyWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {diagReport.usageSummary?.anyExceeded ? 'Exceeded Plan Limits' : diagReport.usageSummary?.anyWarning ? 'Near Capacity (>=80%)' : 'Normal Usage'}
                </span>
              </div>
            </div>

            {/* Diagnostic Warnings */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Identified Warnings & Issues ({diagReport.warnings.length})
              </h4>
              {diagReport.warnings.length === 0 ? (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>All operational, billing, and administrative health checks passed successfully.</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {diagReport.warnings.map((w, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-900/60 border border-slate-700/60 rounded-lg text-xs text-amber-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => setDiagModalOpen(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-xs font-medium text-slate-200 rounded-lg transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
