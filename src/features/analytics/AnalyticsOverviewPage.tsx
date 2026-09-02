import { 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  CalendarDays, 
  CreditCard, 
  ClipboardList, 
  BarChart3, 
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDateRangeFilter } from '../../hooks/useDateRangeFilter';
import { useAnalyticsOverview } from '../../hooks/useAnalyticsOverview';
import { useOperationalAlerts } from '../../hooks/useOperationalAlerts';
import { DateRangeSelector } from './components/DateRangeSelector';
import { MetricKpiCard } from './components/MetricKpiCard';
import { NeedsAttentionWidget } from './components/NeedsAttentionWidget';
import { formatMoney } from '../../lib/money';

export function AnalyticsOverviewPage() {
  const { filter, setPreset, setCustomRange } = useDateRangeFilter();
  const { metrics, loading: metricsLoading } = useAnalyticsOverview(filter.startDate, filter.endDate);
  const { 
    alerts, 
    loading: alertsLoading, 
    scanning, 
    scanNow, 
    acknowledgeAlert, 
    dismissAlert, 
    createFollowUp 
  } = useOperationalAlerts();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            <span>Executive Analytics & Operations Control</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time operational intelligence derived from authoritative attendance, teaching, asset, and billing records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DateRangeSelector
            filter={filter}
            onPresetChange={setPreset}
            onCustomChange={setCustomRange}
          />
          <Link
            to="/analytics/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Reports Hub</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricKpiCard
          title="Active Learners"
          value={metricsLoading ? '...' : (metrics?.activeLearners ?? 0)}
          subtitle={`${metrics?.activeEnrolments ?? 0} active enrolments across terms`}
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-blue-50 text-blue-600"
          linkTo="/analytics/learners"
          linkText="Learner Analytics"
        />

        <MetricKpiCard
          title="Active Programmes"
          value={metricsLoading ? '...' : (metrics?.activeProgrammes ?? 0)}
          subtitle={`${metrics?.activeGroups ?? 0} active groups/ensembles`}
          icon={<GraduationCap className="w-5 h-5" />}
          iconBg="bg-indigo-50 text-indigo-600"
          linkTo="/analytics/programmes"
          linkText="Programme Details"
        />

        <MetricKpiCard
          title="Attendance Rate"
          value={metricsLoading ? '...' : `${metrics?.attendanceRate ?? 0}%`}
          subtitle={`${metrics?.sessionsHeld ?? 0} sessions held in period`}
          icon={<CalendarCheck className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
          linkTo="/analytics/attendance"
          linkText="Attendance Trends"
          highlight={metrics && metrics.attendanceRate < 75 ? 'attention' : 'normal'}
        />

        <MetricKpiCard
          title="Outstanding Finance"
          value={metricsLoading ? '...' : formatMoney(metrics?.outstandingFinance ?? 0)}
          subtitle={`Invoiced: ${formatMoney(metrics?.totalInvoiced ?? 0)}`}
          icon={<CreditCard className="w-5 h-5" />}
          iconBg="bg-amber-50 text-amber-600"
          linkTo="/analytics/finance"
          linkText="Receivables Ageing"
          highlight={metrics && metrics.outstandingFinance > 500000 ? 'urgent' : 'normal'}
        />
      </div>

      {/* Secondary Row: Upcoming Events, Follow-ups, Consents, Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{metrics?.upcomingEvents ?? 0}</div>
              <div className="text-xs text-slate-500">Upcoming Events Scheduled</div>
            </div>
          </div>
          <Link to="/analytics/events" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5">
            <span>Readiness</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{metrics?.pendingConsentCount ?? 0}</div>
              <div className="text-xs text-slate-500">Pending Indemnity Consents</div>
            </div>
          </div>
          <Link to="/consent" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5">
            <span>Review</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{metrics?.openFollowUpsCount ?? 0}</div>
              <div className="text-xs text-slate-500">Open Action Follow-Ups</div>
            </div>
          </div>
          <Link to="/follow-ups" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5">
            <span>Manage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Needs Attention Centre */}
      <div>
        <NeedsAttentionWidget
          alerts={alerts}
          loading={alertsLoading || scanning}
          onScan={scanNow}
          onAcknowledge={acknowledgeAlert}
          onDismiss={dismissAlert}
          onCreateFollowUp={async (id, opts) => {
            await createFollowUp(id, opts);
          }}
        />
      </div>

      {/* Specialist Workspace Quick Launchers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/analytics/attendance"
          className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">Attendance Intelligence</h3>
          <p className="text-xs text-slate-500 mt-1">
            Analyze consecutive absences, day-of-week heat patterns, and group attendance thresholds.
          </p>
        </Link>

        <Link
          to="/analytics/events"
          className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:scale-105 transition-transform">
              <CalendarDays className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">Event Readiness Roster</h3>
          <p className="text-xs text-slate-500 mt-1">
            Check participant consent, supervisor staffing, transport capacity utilization, and repertoire.
          </p>
        </Link>

        <Link
          to="/analytics/finance"
          className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">Finance & Receivables Ageing</h3>
          <p className="text-xs text-slate-500 mt-1">
            Track collection rates, 30-60-90 day aged debtors, and programme receivables performance.
          </p>
        </Link>
      </div>
    </div>
  );
}
