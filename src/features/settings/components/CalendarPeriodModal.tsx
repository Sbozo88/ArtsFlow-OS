import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import type { CalendarPeriodType } from '../../../types';
import type { CreateCalendarPeriodInput } from '../../../services/calendarPeriodService';

interface CalendarPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateCalendarPeriodInput) => Promise<{ overlapWarning?: string }>;
}

export const CalendarPeriodModal: React.FC<CalendarPeriodModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const currentYear = new Date().getFullYear();
  const [name, setName] = useState('');
  const [periodType, setPeriodType] = useState<CalendarPeriodType>('term');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [calendarYear, setCalendarYear] = useState<number>(currentYear);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a period name.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Start and end dates are required.');
      return;
    }
    if (endDate < startDate) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    setLoading(true);
    setError(null);
    setWarning(null);

    try {
      const res = await onSubmit({
        name: name.trim(),
        periodType,
        startDate,
        endDate,
        calendarYear,
        notes: notes.trim() || undefined
      });

      if (res?.overlapWarning) {
        setWarning(res.overlapWarning);
      }
      onClose();
    } catch (err) {
      const e = err as Error;
      setError(e.message || 'Failed to save calendar period.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add Operational Period</h2>
              <p className="text-xs text-slate-500">Configure academic term, semester, cycle, or season</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {warning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{warning}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Period Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Term 1 2026, Semester 1, Cycle 2"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Period Type *
              </label>
              <select
                value={periodType}
                onChange={e => setPeriodType(e.target.value as CalendarPeriodType)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="term">Term</option>
                <option value="semester">Semester</option>
                <option value="quarter">Quarter</option>
                <option value="cycle">Cycle</option>
                <option value="season">Season</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Calendar Year
              </label>
              <input
                type="number"
                value={calendarYear}
                onChange={e => setCalendarYear(parseInt(e.target.value, 10) || currentYear)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Includes mid-term break from Oct 12 - Oct 16"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Period'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
