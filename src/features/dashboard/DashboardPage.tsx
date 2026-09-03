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
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  useDocumentTitle('Dashboard');

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
