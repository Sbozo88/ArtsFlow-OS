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
  Ban
} from 'lucide-react';
import { platformOrganisationService } from '../../../services/platformOrganisationService';
import { tenantLifecycleService } from '../../../services/tenantLifecycleService';
import { organisationMembershipRepository } from '../../../repositories/organisationMembershipRepository';
import { auditLogRepository } from '../../../repositories/auditLogRepository';
import { useAuth } from '../../../contexts/AuthContext';
import type { Organisation, OrganisationMembership, TenantStatus, AuditLog } from '../../../types';

export const PlatformOrganisationDetailPage: React.FC = () => {
  const { organisationId } = useParams<{ organisationId: string }>();
  const { user } = useAuth();

  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [memberships, setMemberships] = useState<OrganisationMembership[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transition Modal State
  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<TenantStatus | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const [confirmNameInput, setConfirmNameInput] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadOrganisationData = useCallback(async () => {
    if (!organisationId) return;
    try {
      setLoading(true);
      setError(null);

      const [org, mems, logs] = await Promise.all([
        platformOrganisationService.getOrganisation(organisationId),
        organisationMembershipRepository.getByOrganisation(organisationId),
        auditLogRepository.getByOrganisation(organisationId)
      ]);

      if (!org) {
        setError(`Organisation '${organisationId}' not found.`);
        return;
      }

      setOrganisation(org);
      setMemberships(mems);
      // Filter logs related to tenant status/lifecycle or recent updates
      setAuditLogs(logs.slice(0, 20));
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
      auditLogRepository.getByOrganisation(organisationId)
    ])
      .then(([org, mems, logs]) => {
        if (!isMounted) return;
        if (!org) {
          setError(`Organisation '${organisationId}' not found.`);
        } else {
          setOrganisation(org);
          setMemberships(mems);
          setAuditLogs(logs.slice(0, 20));
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

  // Determine allowed lifecycle transitions
  const canSuspend = tenantLifecycleService.isValidTransition(currentStatus, 'suspended');
  const canRestrict = tenantLifecycleService.isValidTransition(currentStatus, 'restricted');
  const canActivate = tenantLifecycleService.isValidTransition(currentStatus, 'active');
  const canCancel = tenantLifecycleService.isValidTransition(currentStatus, 'cancelled');
  const canArchive = tenantLifecycleService.isValidTransition(currentStatus, 'archived');

  const openTransitionModal = (status: TenantStatus) => {
    setTargetStatus(status);
    setReasonInput('');
    setConfirmNameInput('');
    setActionError(null);
    setTransitionModalOpen(true);
  };

  const closeTransitionModal = () => {
    setTransitionModalOpen(false);
    setTargetStatus(null);
    setReasonInput('');
    setConfirmNameInput('');
    setActionError(null);
  };

  const handleExecuteTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisation || !targetStatus || !user) return;

    // Verify name confirmation for destructive actions
    const isHighImpact = ['suspended', 'cancelled', 'archived'].includes(targetStatus);
    if (isHighImpact && confirmNameInput.trim() !== organisation.name.trim()) {
      setActionError(`Please enter "${organisation.name}" exactly to confirm.`);
      return;
    }

    try {
      setActionSubmitting(true);
      setActionError(null);

      const updated = await tenantLifecycleService.updateTenantStatus({
        organisationId: organisation.id,
        targetStatus,
        reason: reasonInput.trim() || undefined,
        actorId: user.uid,
        actorEmail: user.email || undefined
      });

      setOrganisation(updated);
      closeTransitionModal();
      await loadOrganisationData();
    } catch (err) {
      setActionError((err as Error).message || 'Failed to update tenant status');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Primary administrator details
  const primaryAdmin = memberships.find(
    (m) => m.role === 'organisation_admin' && m.membershipStatus === 'active'
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back Link & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/platform/organisations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Organisation Directory
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {organisation?.name || 'Organisation Details'}
            </h1>
            <span className="font-mono text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
              {organisation?.id}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadOrganisationData}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            title="Refresh details"
            aria-label="Refresh details"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-red-200 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tenant Status Warning Banner */}
      {currentStatus === 'suspended' && (
        <div className="p-4 bg-rose-950/60 border border-rose-700/60 rounded-xl text-rose-200 flex items-start gap-3 shadow-md">
          <Ban className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm text-rose-300">TENANT SUSPENDED</div>
            <p className="text-xs text-rose-200 mt-1 leading-relaxed">
              This organisation currently has NO operational access. School administrators, staff, and learners cannot log in or record data.
              Customer records are preserved intact and will be restored immediately when unsuspended.
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
        {/* Organisation Info Card */}
        <div className="lg:col-span-2 space-y-6">
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
                  Tenant Status
                </span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 uppercase border border-slate-600 bg-slate-700 text-white">
                  {currentStatus}
                </span>
              </div>

              <div>
                <span className="text-slate-400 uppercase tracking-wider block font-semibold text-[10px]">
                  Organisation Type
                </span>
                <span className="text-slate-200 mt-1 block capitalize">
                  {organisation?.organisationType.replace(/_/g, ' ')}
                </span>
              </div>

              <div>
                <span className="text-slate-400 uppercase tracking-wider block font-semibold text-[10px]">
                  URL Slug
                </span>
                <span className="text-indigo-400 font-mono mt-1 block">/{organisation?.slug || '—'}</span>
              </div>

              <div>
                <span className="text-slate-400 uppercase tracking-wider block font-semibold text-[10px]">
                  Created Date
                </span>
                <span className="text-slate-200 mt-1 block">
                  {organisation?.createdAt ? new Date(organisation.createdAt).toLocaleString() : '—'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 uppercase tracking-wider block font-semibold text-[10px]">
                  Last Activity
                </span>
                <span className="text-slate-200 mt-1 block">
                  {organisation?.lastActiveAt ? new Date(organisation.lastActiveAt).toLocaleString() : 'Recent'}
                </span>
              </div>
            </div>
          </div>

          {/* Memberships & Users Summary */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                Organisation Memberships ({memberships.length})
              </h2>
            </div>

            {memberships.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No active organisation memberships registered yet for this tenant.
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
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Restore / Activate Tenant
                </button>
              )}

              {canRestrict && (
                <button
                  type="button"
                  onClick={() => openTransitionModal('restricted')}
                  className="w-full py-2.5 px-3 bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Lock className="w-4 h-4" />
                  Restrict Tenant Access
                </button>
              )}

              {canSuspend && (
                <button
                  type="button"
                  onClick={() => openTransitionModal('suspended')}
                  className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Ban className="w-4 h-4" />
                  Suspend Tenant Access
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
        </div>
      </div>

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
    </div>
  );
};
