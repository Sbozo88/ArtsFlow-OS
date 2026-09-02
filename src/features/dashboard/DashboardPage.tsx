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
import { useCommunications } from '../../hooks/useCommunications';
import { useDocuments } from '../../hooks/useDocuments';
import { useOperationalAlerts } from '../../hooks/useOperationalAlerts';
import { NeedsAttentionWidget } from '../analytics/components/NeedsAttentionWidget';
import { formatMoney } from '../../lib/money';
import { 
  Users, 
  UserSquare2, 
  Briefcase, 
  GraduationCap, 
  Activity,
  CalendarCheck,
  ClipboardList,
  Plus,
  FileCheck,
  Bus,
  DollarSign,
  CreditCard,
  MessageSquare,
  FolderArchive,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
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
  const { communications } = useCommunications();
  const { documents } = useDocuments();
  const { 
    alerts, 
    loading: loadingAlerts, 
    scanning, 
    scanNow, 
    acknowledgeAlert, 
    dismissAlert, 
    createFollowUp 
  } = useOperationalAlerts();

  const loading = loadingLearners || loadingGuardians || loadingStaff || loadingProgrammes || loadingGroups || loadingEnrolments || loadingSessions || loadingFollowUps;

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading Dashboard...</div>;
  }

  const today = new Date().toISOString().split('T')[0];
  const activeEnrolments = enrolments.filter(e => e.enrolmentStatus === 'active');
  const todaySessions = sessions.filter(s => s.date === today && s.sessionStatus !== 'cancelled');
  const openFollowUps = followUps.filter(f => f.followUpStatus === 'open' || f.followUpStatus === 'in_progress');

  // Phase 3B Indicators
  const pendingConsentCount = consentRequests.filter(r => ['pending', 'sent', 'submitted'].includes(r.requestStatus)).length;
  const upcomingTransportPlans = transportPlans.filter(p => p.departureDate >= today && p.transportStatus !== 'completed' && p.transportStatus !== 'cancelled');

  // Phase 4B Indicators
  const messagesToday = communications.filter(c => c.createdAt.startsWith(today)).length;

  const upcomingSessions = sessions
    .filter(s => s.date >= today && s.sessionStatus === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .slice(0, 5);
  
  const recentLearners = [...learners].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/analytics" className="btn btn-secondary text-sm flex items-center gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
            <BarChart3 className="w-4 h-4 text-indigo-600" /> Executive Analytics
          </Link>
          <Link to="/communication/compose" className="btn btn-secondary text-sm flex items-center gap-1">
            <MessageSquare className="w-4 h-4 text-indigo-600" /> Compose Message
          </Link>
          <Link to="/learners" className="btn btn-primary text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Learner
          </Link>
          <Link to="/enrolments" className="btn btn-secondary text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Enrolment
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard title="Active Learners" value={learners.length} icon={<Users className="w-6 h-6 text-blue-500" />} />
        <StatCard title="Guardians" value={guardians.length} icon={<UserSquare2 className="w-6 h-6 text-green-500" />} />
        <StatCard title="Staff Members" value={staff.length} icon={<Briefcase className="w-6 h-6 text-purple-500" />} />
        <StatCard title="Programmes" value={programmes.length} icon={<GraduationCap className="w-6 h-6 text-amber-500" />} />
        <StatCard title="Active Groups" value={groups.length} icon={<Users className="w-6 h-6 text-indigo-500" />} />
        <StatCard title="Active Enrolments" value={activeEnrolments.length} icon={<Activity className="w-6 h-6 text-emerald-500" />} />
        <StatCard title="Sessions Today" value={todaySessions.length} icon={<CalendarCheck className="w-6 h-6 text-sky-500" />} />
        <StatCard title="Open Follow-Ups" value={openFollowUps.length} icon={<ClipboardList className="w-6 h-6 text-rose-500" />} />
        <StatCard title="Pending Consent" value={pendingConsentCount} icon={<FileCheck className="w-6 h-6 text-amber-500" />} />
        <StatCard title="Upcoming Transport" value={upcomingTransportPlans.length} icon={<Bus className="w-6 h-6 text-sky-500" />} />
        <StatCard 
          title="Outstanding Fees" 
          value={formatMoney(financeMetrics?.outstandingBalance || 0)} 
          icon={<DollarSign className="w-6 h-6 text-rose-500" />} 
        />
        <StatCard 
          title="Messages Today" 
          value={messagesToday} 
          icon={<MessageSquare className="w-6 h-6 text-indigo-500" />} 
        />
        <StatCard 
          title="Documents Hub" 
          value={documents.length} 
          icon={<FolderArchive className="w-6 h-6 text-teal-500" />} 
        />
        <StatCard 
          title="Payments (This Month)" 
          value={formatMoney(financeMetrics?.paymentsThisMonth || 0)} 
          icon={<CreditCard className="w-6 h-6 text-emerald-500" />} 
        />
      </div>

      {/* Needs Attention Section (Phase 5A Intelligence) */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo-500" /> Upcoming Sessions
          </h3>
          {upcomingSessions.length === 0 ? (
            <p className="text-slate-500 text-sm">No upcoming sessions.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingSessions.map(s => {
                const group = groups.find(g => g.id === s.groupId);
                const programme = programmes.find(p => p.id === group?.programmeId);
                return (
                  <li key={s.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                    <Link to={`/sessions/${s.id}`} className="font-medium text-indigo-600 hover:underline">
                      {programme?.name} — {group?.name}
                    </Link>
                    <span className="text-slate-500">{s.date} • {s.startTime}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Recently Added Learners */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-medium text-slate-800 mb-4">Recently Added Learners</h3>
          {recentLearners.length === 0 ? (
            <p className="text-slate-500 text-sm">No learners added yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentLearners.map(l => (
                <li key={l.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                  <Link to={`/learners/${l.id}`} className="font-medium text-indigo-600 hover:underline">{l.firstName} {l.lastName}</Link>
                  <span className="text-slate-500">{new Date(l.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }: { title: string, value: number | string, icon: React.ReactNode }) => (
  <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-200 flex items-center gap-4">
    <div className="p-3 rounded-full bg-slate-50">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);
