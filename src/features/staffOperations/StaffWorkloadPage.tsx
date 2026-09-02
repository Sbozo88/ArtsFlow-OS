import React, { useState } from 'react';
import { 
  TrendingUp, 
  Filter, 
  CheckCircle2, 
  Search
} from 'lucide-react';
import { useStaffWorkload } from '../../hooks/useStaffWorkload';
import { timesheetService } from '../../services/timesheetService';

export const StaffWorkloadPage: React.FC = () => {
  const [timeframePreset, setTimeframePreset] = useState<'this_month' | 'this_week' | 'custom'>('this_month');

  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [searchQuery, setSearchQuery] = useState('');
  const [flagFilter, setFlagFilter] = useState<string>('all');

  const { summaries, loading } = useStaffWorkload(startDate, endDate);

  const handleTimeframeChange = (preset: 'this_month' | 'this_week' | 'custom') => {
    setTimeframePreset(preset);
    const d = new Date();
    if (preset === 'this_month') {
      setStartDate(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]);
      setEndDate(new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]);
    } else if (preset === 'this_week') {
      const start = new Date(d);
      start.setDate(d.getDate() - d.getDay() + 1); // Monday
      const end = new Date(start);
      end.setDate(start.getDate() + 6); // Sunday
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  };

  const filtered = summaries.filter(s => {
    if (flagFilter === 'high_workload' && !s.flags.highWorkload) return false;
    if (flagFilter === 'low_activity' && !s.flags.lowActivity) return false;
    if (flagFilter === 'no_assignment' && !s.flags.noActiveAssignment) return false;
    if (flagFilter === 'overdue' && !s.flags.timesheetOverdue) return false;
    if (flagFilter === 'substitutions' && !s.flags.repeatedSubstitutions) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return s.staffName.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            Staff Workload & Capacity Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor teaching capacity, operational burden, and transparent workload indicators across all staff.
          </p>
        </div>

        {/* Timeframe Presets */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
          <button
            onClick={() => handleTimeframeChange('this_week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              timeframePreset === 'this_week'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => handleTimeframeChange('this_month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              timeframePreset === 'this_month'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => handleTimeframeChange('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              timeframePreset === 'custom'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Custom Range
          </button>
        </div>
      </div>

      {timeframePreset === 'custom' && (
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff members..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-500 font-medium">Flag Filter:</span>
          <select
            value={flagFilter}
            onChange={e => setFlagFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">All Staff</option>
            <option value="high_workload">High Workload (&gt;40h)</option>
            <option value="low_activity">Low Activity / Idle</option>
            <option value="no_assignment">No Active Assignment</option>
            <option value="overdue">Overdue Timesheet</option>
            <option value="substitutions">Frequent Substitutions (&ge;3)</option>
          </select>
        </div>
      </div>

      {/* Workload Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading workload metrics...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No staff records match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Staff Member</th>
                  <th className="px-6 py-3">Assignments</th>
                  <th className="px-6 py-3">Sessions</th>
                  <th className="px-6 py-3">Events</th>
                  <th className="px-6 py-3">Total Work Recorded</th>
                  <th className="px-6 py-3">Substitutions</th>
                  <th className="px-6 py-3">Operational Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filtered.map(s => (
                  <tr key={s.staffId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-900">
                      {s.staffName}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      {s.assignedGroupsCount} group(s), {s.assignedProgrammesCount} prog(s)
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-semibold text-slate-800">{s.sessionsCount}</span> scheduled
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-semibold text-slate-800">{s.eventsCount}</span> event(s)
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <div className="font-extrabold text-slate-900">
                        {timesheetService.formatDuration(s.totalWorkMinutes)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        ({s.totalWorkMinutes} minutes total)
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      {s.substitutionsCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {s.substitutionsCount} Sub(s)
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {s.flags.highWorkload && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            High Workload
                          </span>
                        )}
                        {s.flags.lowActivity && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                            Low Activity
                          </span>
                        )}
                        {s.flags.noActiveAssignment && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            No Active Assignment
                          </span>
                        )}
                        {s.flags.timesheetOverdue && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Timesheet Overdue
                          </span>
                        )}
                        {s.flags.repeatedSubstitutions && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                            Frequent Subs
                          </span>
                        )}
                        {!s.flags.highWorkload && !s.flags.lowActivity && !s.flags.noActiveAssignment && !s.flags.timesheetOverdue && !s.flags.repeatedSubstitutions && (
                          <span className="text-slate-400 text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Balanced
                          </span>
                        )}
                      </div>
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
};
