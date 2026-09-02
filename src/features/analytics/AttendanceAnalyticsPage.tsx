import { Link } from 'react-router-dom';
import { CalendarCheck, ArrowLeft, ArrowUpRight, AlertTriangle, Users } from 'lucide-react';
import { useDateRangeFilter } from '../../hooks/useDateRangeFilter';
import { useAttendanceAnalytics } from '../../hooks/useAttendanceAnalytics';
import { DateRangeSelector } from './components/DateRangeSelector';
import { MetricKpiCard } from './components/MetricKpiCard';
import { SimpleBarChart } from './components/SimpleBarChart';
import { SimpleLineTrend } from './components/SimpleLineTrend';

export function AttendanceAnalyticsPage() {
  const { filter, setPreset, setCustomRange } = useDateRangeFilter();
  const { data, loading } = useAttendanceAnalytics(filter.startDate, filter.endDate);

  const dayOfWeekBarData = (data?.dayOfWeekPattern || [])
    .filter(d => d.sessionCount > 0)
    .map(d => ({
      label: `${d.day} (${d.sessionCount} sessions)`,
      value: d.rate,
      subLabel: `${d.rate}%`,
      color: d.rate >= 80 ? 'bg-emerald-500' : d.rate >= 70 ? 'bg-amber-500' : 'bg-rose-500'
    }));

  const trendData = (data?.weeklyTrend || []).map(w => ({
    label: w.weekLabel,
    value: w.rate
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/analytics" className="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back to Analytics
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-indigo-600" />
            <span>Attendance Intelligence & Heat Patterns</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Day-of-week attendance patterns, group compliance thresholds, and consecutive absence flags.
          </p>
        </div>

        <DateRangeSelector
          filter={filter}
          onPresetChange={setPreset}
          onCustomChange={setCustomRange}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricKpiCard
          title="Attendance Rate"
          value={loading ? '...' : `${data?.overallAttendanceRate ?? 0}%`}
          subtitle={`${data?.sessionsHeld ?? 0} sessions evaluated`}
          icon={<CalendarCheck className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
          highlight={data && data.overallAttendanceRate < 75 ? 'attention' : 'normal'}
        />

        <MetricKpiCard
          title="Present & On-Time"
          value={loading ? '...' : (data?.presentCount ?? 0)}
          subtitle={`+ ${data?.lateCount ?? 0} recorded late arrivals`}
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-blue-50 text-blue-600"
        />

        <MetricKpiCard
          title="Unexcused Absences"
          value={loading ? '...' : (data?.absentCount ?? 0)}
          subtitle={`Excused absences: ${data?.excusedCount ?? 0}`}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg="bg-rose-50 text-rose-600"
        />

        <MetricKpiCard
          title="Consecutive Absence Flags"
          value={loading ? '...' : (data?.consecutiveAbsenceLearners.length ?? 0)}
          subtitle=">= 3 missed sessions in a row"
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg="bg-orange-50 text-orange-600"
          highlight={data && data.consecutiveAbsenceLearners.length > 0 ? 'urgent' : 'normal'}
        />
      </div>

      {/* Charts Grid: Trend & Day of Week Heat Pattern */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SimpleLineTrend
          title="Attendance Rate Over Time"
          data={trendData}
          valueSuffix="%"
          emptyMessage="No historical sessions recorded in selected date range"
        />

        <SimpleBarChart
          data={dayOfWeekBarData}
          title="Day-of-Week Attendance Pattern"
          valueSuffix="%"
          emptyMessage="No sessions held on active weekdays"
        />
      </div>

      {/* Grid: Low Attendance Groups + Consecutive Absence List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Low Attendance Groups */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Groups Below 75% Threshold</h3>
            <span className="text-xs text-rose-600 font-medium">
              {data?.lowAttendanceGroups.length ?? 0} Groups
            </span>
          </div>

          {(data?.lowAttendanceGroups.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-xs text-emerald-600 font-medium">
              ✓ All active groups currently meet or exceed the 75% attendance standard.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data?.lowAttendanceGroups.map(grp => (
                <div key={grp.groupId} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{grp.groupName}</div>
                    <div className="text-[11px] text-slate-400">{grp.programmeName} · {grp.sessionCount} sessions</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-rose-600">{grp.rate}%</span>
                    <Link
                      to={`/groups/${grp.groupId}`}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md"
                      title="View Group"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3+ Consecutive Absences */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">3+ Consecutive Absence Flags</h3>
            <span className="text-xs text-orange-600 font-medium">
              {data?.consecutiveAbsenceLearners.length ?? 0} Flagged
            </span>
          </div>

          {(data?.consecutiveAbsenceLearners.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-xs text-emerald-600 font-medium">
              ✓ No learners currently have 3 or more consecutive unexcused absences.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data?.consecutiveAbsenceLearners.map((item, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{item.learnerName}</div>
                    <div className="text-[11px] text-slate-400">
                      {item.consecutiveAbsences} consecutive absences · Last: {item.lastAbsenceDate || 'recent'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/learners/${item.learnerId}`}
                      className="p-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-md font-medium inline-flex items-center gap-1"
                    >
                      <span>Learner</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
