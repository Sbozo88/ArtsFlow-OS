import { Link } from 'react-router-dom';
import { Users, UserPlus, AlertTriangle, ArrowUpRight, ArrowLeft } from 'lucide-react';
import { useDateRangeFilter } from '../../hooks/useDateRangeFilter';
import { useLearnerAnalytics } from '../../hooks/useLearnerAnalytics';
import { DateRangeSelector } from './components/DateRangeSelector';
import { MetricKpiCard } from './components/MetricKpiCard';
import { SimpleBarChart } from './components/SimpleBarChart';
import { formatMoney } from '../../lib/money';

export function LearnerAnalyticsPage() {
  const { filter, setPreset, setCustomRange } = useDateRangeFilter();
  const { data, loading } = useLearnerAnalytics(filter.startDate, filter.endDate);

  const programmeBarData = (data?.byProgramme || []).map(p => ({
    label: p.programmeName,
    value: p.count,
    color: 'bg-indigo-500'
  }));

  const maxEnrolments = Math.max(...(data?.byProgramme || []).map(p => p.count), 10);

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
            <Users className="w-7 h-7 text-indigo-600" />
            <span>Learner Demographics & Risk Analysis</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Active registrations, multi-programme participation, and rule-based operational risk indicators.
          </p>
        </div>

        <DateRangeSelector
          filter={filter}
          onPresetChange={setPreset}
          onCustomChange={setCustomRange}
        />
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricKpiCard
          title="Active Learners"
          value={loading ? '...' : (data?.activeLearners ?? 0)}
          subtitle={`Out of ${data?.totalLearners ?? 0} total registered`}
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-blue-50 text-blue-600"
        />

        <MetricKpiCard
          title="New Enrolments in Period"
          value={loading ? '...' : (data?.newLearnersInPeriod ?? 0)}
          subtitle="Registered in selected dates"
          icon={<UserPlus className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />

        <MetricKpiCard
          title="Multi-Programme Learners"
          value={loading ? '...' : (data?.multiEnrolledCount ?? 0)}
          subtitle="Enrolled in >1 active group"
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-indigo-50 text-indigo-600"
        />

        <MetricKpiCard
          title="At-Risk Learners"
          value={loading ? '...' : (data?.atRiskCount ?? 0)}
          subtitle="Require operational intervention"
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg="bg-rose-50 text-rose-600"
          highlight={data && data.atRiskCount > 0 ? 'urgent' : 'normal'}
        />
      </div>

      {/* Grid: Programme Distribution + Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <SimpleBarChart
            data={programmeBarData}
            title="Enrolment Distribution by Programme"
            valueSuffix=" learners"
            maxCustom={maxEnrolments}
            emptyMessage="No active enrolments recorded"
          />
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Learner Status Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(data?.byStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0">
                  <span className="capitalize font-medium text-slate-600">{status}</span>
                  <span className="font-bold text-slate-900 px-2 py-0.5 rounded-full bg-slate-100">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            Maintained per South African POPIA safeguarding requirements.
          </div>
        </div>
      </div>

      {/* Operational At-Risk Learners Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Learner Operational Risk Register</h3>
              <p className="text-xs text-slate-500">
                Rule-based flags: Low attendance (&lt;75%), 3+ consecutive absences, overdue finance, or missing event consent.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full border border-rose-100">
            {data?.atRiskCount ?? 0} Flagged
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading risk signals...</div>
        ) : (data?.atRiskLearners.length ?? 0) === 0 ? (
          <div className="p-8 text-center text-xs text-emerald-600 font-medium">
            ✓ No learners currently flagged with operational risks.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold uppercase text-[11px]">Learner</th>
                  <th className="px-4 py-3 font-semibold uppercase text-[11px]">Triggered Signals</th>
                  <th className="px-4 py-3 font-semibold uppercase text-[11px]">Attendance</th>
                  <th className="px-4 py-3 font-semibold uppercase text-[11px]">Overdue Balance</th>
                  <th className="px-4 py-3 font-semibold uppercase text-[11px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.atRiskLearners.map(({ learner, riskReasons, attendanceRate, overdueFinance }) => (
                  <tr key={learner.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div>{learner.firstName} {learner.lastName}</div>
                      <div className="text-[11px] text-slate-400">Grade: {learner.gradeOrClass || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {riskReasons.map((r, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-100">
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {attendanceRate !== undefined ? (
                        <span className={`font-semibold ${attendanceRate < 75 ? 'text-rose-600' : 'text-slate-700'}`}>
                          {attendanceRate}%
                        </span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {overdueFinance ? formatMoney(overdueFinance) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/learners/${learner.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        <span>Profile</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
