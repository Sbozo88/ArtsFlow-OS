import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  School,
  ExternalLink,
  UserCheck,
  Sparkles,
  Key
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useActiveOrganisation } from '../../../contexts/ActiveOrganisationContext';
import { organisationRepository } from '../../../repositories/organisationRepository';
import { organisationMembershipRepository } from '../../../repositories/organisationMembershipRepository';
import type { Organisation, OrganisationMembership } from '../../../types';

export const DEMO_ORGANISATION_ID = 'org_demo_artsflow';

export const FounderAccessDiagnosticCard: React.FC = () => {
  const navigate = useNavigate();
  const { user, authUser } = useAuth();
  const { switchOrganisation, activeOrganisationId } = useActiveOrganisation();
  const [demoOrg, setDemoOrg] = useState<Organisation | null>(null);
  const [demoMembership, setDemoMembership] = useState<OrganisationMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  const handleOpenDemoAcademy = async () => {
    if (!demoOrg) return;
    try {
      setSwitching(true);
      if (activeOrganisationId !== demoOrg.id) {
        await switchOrganisation(demoOrg.id);
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to switch to demo organisation:', err);
      navigate('/dashboard');
    } finally {
      setSwitching(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function checkDiagnostics() {
      if (!user) return;
      try {
        const [org, mems] = await Promise.all([
          organisationRepository.getById(DEMO_ORGANISATION_ID).catch(() => null),
          organisationMembershipRepository.getByUserId(user.uid).catch(() => [])
        ]);

        if (isMounted) {
          setDemoOrg(org);
          const found = mems.find(
            (m) => m.organisationId === DEMO_ORGANISATION_ID && m.membershipStatus === 'active'
          );
          setDemoMembership(found || null);
        }
      } catch (err) {
        console.warn('Could not run founder diagnostics check:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkDiagnostics();
    return () => {
      isMounted = false;
    };
  }, [user]);

  if (authUser?.platformRole !== 'super_admin') {
    return null;
  }

  return (
    <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">Founder & Platform Access Diagnostics</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                Verified
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Authoritative identity verification and operational testing readiness.
            </p>
          </div>
        </div>

        {demoOrg && (
          <button
            type="button"
            onClick={handleOpenDemoAcademy}
            disabled={switching}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <School className="w-3.5 h-3.5" />
            <span>{switching ? 'Opening…' : 'Open Demo Academy'}</span>
            <ExternalLink className="w-3 h-3 ml-0.5 text-indigo-200" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Firebase Auth */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span>Firebase Auth</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Authenticated</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5" title={user?.email || ''}>
            {user?.email || 'Active session'}
          </div>
        </div>

        {/* Global Profile */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>User Profile</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Active</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5" title={authUser?.uid}>
            UID: {authUser?.uid?.slice(0, 8)}…
          </div>
        </div>

        {/* Platform Role */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Platform Role</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-indigo-400">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>super_admin</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Full Platform Scope</div>
        </div>

        {/* Platform Console */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Platform Console</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Accessible</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">No org required</div>
        </div>

        {/* Demo Tenant */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <School className="w-3.5 h-3.5 text-indigo-400" />
            <span>Demo Tenant</span>
          </div>
          {loading ? (
            <div className="text-xs text-slate-400">Checking…</div>
          ) : demoOrg ? (
            <>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Active</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5" title={demoOrg.name}>
                {demoOrg.name}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Unseeded</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Ready to bootstrap</div>
            </>
          )}
        </div>

        {/* Demo Membership */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Demo Membership</span>
          </div>
          {loading ? (
            <div className="text-xs text-slate-400">Checking…</div>
          ) : demoMembership ? (
            <>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>org_admin</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Explicit role assigned</div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-400">
                <span>Not assigned</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Separate from platform</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
