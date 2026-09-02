import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Archive, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sparkles
} from 'lucide-react';
import { SettingsNav } from './components/SettingsNav';
import { CalendarPeriodModal } from './components/CalendarPeriodModal';
import { useCalendarPeriods } from '../../hooks/useCalendarPeriods';
import type { CalendarPeriodType } from '../../types';

export const CalendarSettingsPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const { periods, activePeriod, loading, createPeriod, archivePeriod } = useCalendarPeriods(selectedYear);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning'; message: string } | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const handleCreate = async (input: Parameters<typeof createPeriod>[0]) => {
    const res = await createPeriod(input);
    if (res.overlapWarning) {
      setFeedback({ type: 'warning', message: res.overlapWarning });
    } else {
      setFeedback({ type: 'success', message: `Period "${input.name}" successfully created.` });
    }
    setTimeout(() => setFeedback(null), 5000);
    return res;
  };

  const handleArchive = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to archive "${name}"?`)) return;
    try {
      await archivePeriod(id);
      setFeedback({ type: 'success', message: `Period "${name}" has been archived.` });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const periodTypeBadge = (type: CalendarPeriodType) => {
    const styles: Record<CalendarPeriodType, string> = {
      term: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      semester: 'bg-blue-50 text-blue-700 border-blue-200',
      quarter: 'bg-purple-50 text-purple-700 border-purple-200',
      cycle: 'bg-teal-50 text-teal-700 border-teal-200',
      season: 'bg-amber-50 text-amber-700 border-amber-200',
      custom: 'bg-slate-50 text-slate-700 border-slate-200'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border uppercase tracking-wider ${styles[type] || styles.custom}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <SettingsNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Operational Framework
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">Operational Calendar & Terms</h1>
            <p className="text-sm text-slate-500">
              Define terms, semesters, quarters, or cycles to structure operational analytics and reporting periods.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Period</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 text-sm font-semibold border ${
            feedback.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            {feedback.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Active Period Banner */}
        {activePeriod ? (
          <div className="mb-8 p-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl text-white shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">Currently Active Operational Period</span>
                <h2 className="text-xl font-black">{activePeriod.name}</h2>
                <p className="text-xs text-indigo-100 mt-0.5">
                  {activePeriod.startDate} &rarr; {activePeriod.endDate} ({activePeriod.periodType})
                </p>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-indigo-700 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Now
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-600 text-xs flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>No operational period is currently active for today's date.</span>
          </div>
        )}

        {/* Periods Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Configured Periods ({periods.length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedYear(undefined)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  selectedYear === undefined ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Years
              </button>
              <button
                onClick={() => setSelectedYear(currentYear)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  selectedYear === currentYear ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {currentYear}
              </button>
            </div>
          </div>

          {periods.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">No operational periods created</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Add terms, quarters, or cycles to allow attendance analytics and reports to filter by "This Term".
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add First Period
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Period Name</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Start Date</th>
                    <th className="px-6 py-3">End Date</th>
                    <th className="px-6 py-3">Year</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {periods.map((p) => {
                    const isActive = p.id === activePeriod?.id;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{p.name}</span>
                            {isActive && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Current
                              </span>
                            )}
                          </div>
                          {p.notes && <div className="text-xs font-normal text-slate-400 mt-0.5">{p.notes}</div>}
                        </td>
                        <td className="px-6 py-4">
                          {periodTypeBadge(p.periodType)}
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-mono text-xs">{p.startDate}</td>
                        <td className="px-6 py-4 text-slate-700 font-mono text-xs">{p.endDate}</td>
                        <td className="px-6 py-4 text-slate-600">{p.calendarYear}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            p.periodStatus === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {p.periodStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleArchive(p.id, p.name)}
                            title="Archive Period"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <CalendarPeriodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};
