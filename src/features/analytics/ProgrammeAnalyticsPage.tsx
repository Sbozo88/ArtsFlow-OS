import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useDateRangeFilter } from '../../hooks/useDateRangeFilter';
import { useProgrammeAnalytics } from '../../hooks/useProgrammeAnalytics';
import { DateRangeSelector } from './components/DateRangeSelector';
import { formatMoney } from '../../lib/money';

export function ProgrammeAnalyticsPage() {
  const { filter, setPreset, setCustomRange } = useDateRangeFilter();
  const { summaries, loading } = useProgrammeAnalytics(filter.startDate, filter.endDate);

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
            <GraduationCap className="w-7 h-7 text-indigo-600" />
            <span>Programme Operations & Collections</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Operational comparison of learner numbers, session volumes, attendance rates, and billing collections.
          </p>
        </div>

        <DateRangeSelector
          filter={filter}
          onPresetChange={setPreset}
          onCustomChange={setCustomRange}
        />
      </div>

      {/* Programme Summary Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Programmes Performance Matrix</h3>
          <span className="text-xs text-slate-500">{summaries.length} Programmes Active</span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400">Loading programme operational summaries...</div>
        ) : summaries.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No programme data found for this period.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold uppercase text-[11px]">Programme</th>
                  <th className="px-4 py-3 font-semibold uppercase text-[11px]">Groups</th>
                  <th className="px-4 py-3 font-semibold uppercase text-[11px]">Active Learners</th>
                  <th className="px-4 py-3 font-semibold uppercase text-[11px]">Teachers</th>
                  <th className="px-4 py-3 font-semibold uppercase text-[11px]">Sessions</th>
                  <th className="px-4 py-3 font-semibold uppercase text-[11px]">Attendance</th>
                  <th className="px-4 py-3 font-semibold uppercase text-[11px]">Billed</th>
                  <th className="px-4 py-3 font-semibold uppercase text-[11px]">Collected</th>
                  <th className="px-4 py-3 font-semibold uppercase text-[11px]">Collection Rate</th>
                  <th className="px-4 py-3 font-semibold uppercase text-[11px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaries.map(p => (
                  <tr key={p.programmeId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {p.programmeName}
                    </td>
                    <td className="px-4 py-3">{p.groupCount}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{p.activeLearners}</td>
                    <td className="px-4 py-3">{p.teacherCount}</td>
                    <td className="px-4 py-3">{p.sessionsHeld}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${p.attendanceRate < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {p.attendanceRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatMoney(p.totalInvoiced)}</td>
                    <td className="px-4 py-3 font-medium text-emerald-600">{formatMoney(p.totalReceived)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${p.collectionRate >= 80 ? 'bg-emerald-500' : p.collectionRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${p.collectionRate}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-700">{p.collectionRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/programmes`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        <span>Groups</span>
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
