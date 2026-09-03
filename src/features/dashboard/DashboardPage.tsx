import React from 'react';
import { useLearners } from '../../hooks/useLearners';
import { useGuardians } from '../../hooks/useGuardians';
import { useStaff } from '../../hooks/useStaff';
import { useProgrammes } from '../../hooks/useProgrammes';
import { useProgrammeGroups } from '../../hooks/useProgrammeGroups';
import { useEnrolments } from '../../hooks/useEnrolments';
import { useSessions } from '../../hooks/useSessions';
import { useFollowUps } from '../../hooks/useFollowUps';
import { useConsentRequests } from '../../hooks/useConsentRequests';
import { useEventTransportPlans } from '../../hooks/useEventTransportPlans';
import { useFinanceDashboard } from '../../hooks/useFinanceDashboard';
import { useOperationalAlerts } from '../../hooks/useOperationalAlerts';
import { NeedsAttentionWidget } from '../analytics/components/NeedsAttentionWidget';
import { formatMoney } from '../../lib/money';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';
import { useAutomationExecutions } from '../../hooks/useAutomationExecutions';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardTitle } from '../../components/ui/Card';
import { StatCardSkeleton } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  Users,
  UserSquare2,
  Briefcase,
  GraduationCap,
  Activity,
  CalendarCheck,
  ClipboardList,
  FileCheck,
  Bus,
  Wallet,
  MessageSquare,
  Bell,
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { organisationOnboardingService } from '../../services/onboarding/organisationOnboardingService';
import type { OrganisationOnboarding } from '../../types';

export const DashboardPage: React.FC = () => {
  useDocumentTitle('Dashboard');
  const { authUser, organisationId } = useAuth();
  const [onboarding, setOnboarding] = React.useState<OrganisationOnboarding | null>(null);
  const [dismissChecklist, setDismissChecklist] = React.useState<boolean>(() => {
    return typeof window !== 'undefined' && organisationId
      ? localStorage.getItem(`af_dismiss_checklist_${organisationId}`) === 'true'
      : false;
  });

  const handleDismissChecklist = () => {
    if (organisationId) {
      localStorage.setItem(`af_dismiss_checklist_${organisationId}`, 'true');
      setDismissChecklist(true);
    }
  };

  React.useEffect(() => {
    let isMounted = true;
    if (authUser?.role === 'organisation_admin' && organisationId) {
      organisationOnboardingService.getOnboarding(organisationId).then((ob) => {
        if (isMounted) setOnboarding(ob);
      }).catch(() => {});
    }
    return () => { isMounted = false; };
  }, [authUser?.role, organisationId]);

  const { learners, loading: loadingLearners } = useLearners();
  const { guardians, loading: loadingGuardians } = useGuardians();
  const { staff, loading: loadingStaff } = useStaff();
  const { programmes, loading: loadingProgrammes } = useProgrammes();
  const { groups, loading: loadingGroups } = useProgrammeGroups();
  const { enrolments, loading: loadingEnrolments } = useEnrolments();
  const { sessions, loading: loadingSessions } = useSessions();
  const { followUps, loading: loadingFollowUps } = useFollowUps();
  const { requests: consentRequests } = useConsentRequests();
  const { plans: transportPlans } = useEventTransportPlans();
  const { metrics: financeMetrics } = useFinanceDashboard('this_month');
  const {
    alerts,
    loading: loadingAlerts,
    scanning,
    scanNow,
    acknowledgeAlert,
    dismissAlert,
    createFollowUp,
  } = useOperationalAlerts();
  const { unreadCount } = useUnreadNotifications();
  const { executions } = useAutomationExecutions();
  const failedExecutions = executions.filter(e => e.executionStatus === 'failed');

  const loading = loadingLearners || loadingGuardians || loadingStaff || loadingProgrammes || loadingGroups || loadingEnrolments || loadingSessions || loadingFollowUps;

  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Welcome to ArtsFlow OS." />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const activeEnrolments = enrolments.filter(e => e.enrolmentStatus === 'active');
  const todaySessions = sessions.filter(s => s.date === today && s.sessionStatus !== 'cancelled');
  const openFollowUps = followUps.filter(f => f.followUpStatus === 'open' || f.followUpStatus === 'in_progress');
  const pendingConsentCount = consentRequests.filter(r => ['pending', 'sent', 'submitted'].includes(r.requestStatus)).length;
  const upcomingTransportPlans = transportPlans.filter(p => p.departureDate >= today && p.transportStatus !== 'completed' && p.transportStatus !== 'cancelled');


  const upcomingSessions = sessions
    .filter(s => s.date >= today && s.sessionStatus === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .slice(0, 5);

  const recentLearners = [...learners].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your arts education management overview."
        actions={[
          { label: 'Compose Message', onClick: () => window.location.href = '/communication/compose', icon: MessageSquare, variant: 'outline' },
          { label: 'Add Learner', onClick: () => window.location.href = '/learners', icon: Users, variant: 'primary' },
        ]}
      />

      {/* SaaS 3A: Finish setting up ArtsFlow Setup Card */}
      {authUser?.role === 'organisation_admin' && onboarding && onboarding.onboardingStatus !== 'completed' && (
        <div className="p-4 bg-gradient-to-r from-indigo-900/40 via-slate-800 to-indigo-950/30 border border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Finish setting up ArtsFlow</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                {onboarding.completedSteps?.length || 0} of 12 steps complete
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Configure your organisation, programmes, and staff to get ready for go-live.
            </p>
          </div>
          <Link
            to="/onboarding"
            className="self-start sm:self-auto py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 shrink-0"
          >
            Continue Setup
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* SaaS 3A / v1.1 First-Run Post-Onboarding Experience */}
      {authUser?.role === 'organisation_admin' && onboarding?.onboardingStatus === 'completed' && !dismissChecklist && (
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/40 rounded-2xl text-white shadow-lg space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Welcome to ArtsFlow OS</h3>
                <p className="text-xs text-slate-300">
                  Your organisation is live! Here is your quick checklist to begin operating:
                </p>
              </div>
            </div>
            <button
              onClick={handleDismissChecklist}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
            <Link
              to="/learners"
              className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500/50 hover:bg-slate-800 transition group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold">Step 1</span>
                <span className="text-emerald-400 font-bold">{learners.length > 0 ? '✓ Added' : 'Pending'}</span>
              </div>
              <span className="text-sm font-bold text-white mt-2 group-hover:text-indigo-400 transition-colors">Add Learners</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Roster or CSV import</span>
            </Link>

            <Link
              to="/staff"
              className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500/50 hover:bg-slate-800 transition group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold">Step 2</span>
                <span className="text-slate-400 font-bold">Invite</span>
              </div>
              <span className="text-sm font-bold text-white mt-2 group-hover:text-indigo-400 transition-colors">Invite Teachers</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Assign permissions</span>
            </Link>

            <Link
              to="/sessions"
              className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500/50 hover:bg-slate-800 transition group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold">Step 3</span>
                <span className="text-slate-400 font-bold">Schedule</span>
              </div>
              <span className="text-sm font-bold text-white mt-2 group-hover:text-indigo-400 transition-colors">Schedule Session</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Create term timetable</span>
            </Link>

            <Link
              to="/attendance"
              className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500/50 hover:bg-slate-800 transition group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold">Step 4</span>
                <span className="text-slate-400 font-bold">Register</span>
              </div>
              <span className="text-sm font-bold text-white mt-2 group-hover:text-indigo-400 transition-colors">Mark Attendance</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Mobile-friendly register</span>
            </Link>

            <Link
              to="/music"
              className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500/50 hover:bg-slate-800 transition group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold">Step 5</span>
                <span className="text-slate-400 font-bold">Explore</span>
              </div>
              <span className="text-sm font-bold text-white mt-2 group-hover:text-indigo-400 transition-colors">Music & Dance</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Instruments & syllabus</span>
            </Link>
          </div>
        </div>
      )}

      {/* Failed Automation Banner */}
      {failedExecutions.length > 0 && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-sm text-rose-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{failedExecutions.length} automation execution(s) failed</span>
            <span className="text-rose-700 hidden sm:inline">— require inspection or retry</span>
          </div>
          <Link to="/automation/activity" className="font-semibold text-rose-800 hover:underline flex items-center gap-1 shrink-0">
            Inspect <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Primary KPI Cards — Needs Attention */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Sessions Today" value={todaySessions.length} icon={<CalendarCheck className="w-5 h-5 text-sky-500" />} />
        <StatCard title="Open Follow-Ups" value={openFollowUps.length} icon={<ClipboardList className="w-5 h-5 text-rose-500" />} />
        <StatCard title="Pending Consent" value={pendingConsentCount} icon={<FileCheck className="w-5 h-5 text-amber-500" />} />
        <StatCard title="Unread Alerts" value={unreadCount} icon={<Bell className="w-5 h-5 text-rose-500" />} />
      </div>

      {/* Needs Attention Section */}
      <NeedsAttentionWidget
        alerts={alerts}
        loading={loadingAlerts || scanning}
        onScan={scanNow}
        onAcknowledge={acknowledgeAlert}
        onDismiss={dismissAlert}
        onCreateFollowUp={async (id, opts) => {
          await createFollowUp(id, opts);
        }}
      />

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard title="Active Learners" value={learners.length} icon={<Users className="w-5 h-5 text-indigo-500" />} />
        <StatCard title="Guardians" value={guardians.length} icon={<UserSquare2 className="w-5 h-5 text-emerald-500" />} />
        <StatCard title="Staff Members" value={staff.length} icon={<Briefcase className="w-5 h-5 text-violet-500" />} />
        <StatCard title="Programmes" value={programmes.length} icon={<GraduationCap className="w-5 h-5 text-amber-500" />} />
        <StatCard title="Active Groups" value={groups.length} icon={<Users className="w-5 h-5 text-indigo-400" />} />
        <StatCard title="Active Enrolments" value={activeEnrolments.length} icon={<Activity className="w-5 h-5 text-emerald-400" />} />
        <StatCard title="Outstanding Fees" value={formatMoney(financeMetrics?.outstandingBalance || 0)} icon={<Wallet className="w-5 h-5 text-rose-500" />} />
        <StatCard title="Upcoming Transport" value={upcomingTransportPlans.length} icon={<Bus className="w-5 h-5 text-sky-500" />} />
      </div>

      {/* Upcoming Sessions & Recent Learners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>
            <span className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-indigo-500" />
              Upcoming Sessions
            </span>
          </CardTitle>
          {upcomingSessions.length === 0 ? (
            <p className="text-slate-500 text-sm mt-3">No upcoming sessions scheduled.</p>
          ) : (
            <ul className="space-y-3 mt-4">
              {upcomingSessions.map(s => {
                const group = groups.find(g => g.id === s.groupId);
                const programme = programmes.find(p => p.id === group?.programmeId);
                return (
                  <li key={s.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <Link to={`/sessions/${s.id}`} className="font-medium text-indigo-600 hover:underline truncate mr-3">
                      {programme?.name} — {group?.name}
                    </Link>
                    <span className="text-slate-500 whitespace-nowrap text-xs">{s.date} · {s.startTime}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle>Recently Added Learners</CardTitle>
          {recentLearners.length === 0 ? (
            <p className="text-slate-500 text-sm mt-3">No learners added yet. Add your first learner to get started.</p>
          ) : (
            <ul className="space-y-3 mt-4">
              {recentLearners.map(l => (
                <li key={l.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <Link to={`/learners/${l.id}`} className="font-medium text-indigo-600 hover:underline">{l.firstName} {l.lastName}</Link>
                  <span className="text-slate-500 text-xs">{new Date(l.createdAt).toLocaleDateString('en-ZA')}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};
