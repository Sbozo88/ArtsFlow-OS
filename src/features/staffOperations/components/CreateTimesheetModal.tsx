import React, { useState } from 'react';
import { X, Calendar, FileText } from 'lucide-react';
import { useStaff } from '../../../hooks/useStaff';
import type { CreateTimesheetInput } from '../../../services/timesheetService';

interface CreateTimesheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTimesheetInput) => Promise<unknown>;
  preselectedStaffId?: string;
}

export const CreateTimesheetModal: React.FC<CreateTimesheetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  preselectedStaffId
}) => {
  const { staff } = useStaff();

  const [staffId, setStaffId] = useState(preselectedStaffId || '');
  const [periodPreset, setPeriodPreset] = useState<'this_month' | 'last_month' | 'this_week' | 'custom'>('this_month');

  // Compute preset dates
  const now = new Date();
  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDayThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [periodStart, setPeriodStart] = useState(firstDayThisMonth);
  const [periodEnd, setPeriodEnd] = useState(lastDayThisMonth);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePresetChange = (preset: 'this_month' | 'last_month' | 'this_week' | 'custom') => {
    setPeriodPreset(preset);
    const d = new Date();
    if (preset === 'this_month') {
      setPeriodStart(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]);
      setPeriodEnd(new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]);
    } else if (preset === 'last_month') {
      setPeriodStart(new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split('T')[0]);
      setPeriodEnd(new Date(d.getFullYear(), d.getMonth(), 0).toISOString().split('T')[0]);
    } else if (preset === 'this_week') {
      const start = new Date(d);
      start.setDate(d.getDate() - d.getDay() + 1); // Monday
      const end = new Date(start);
      end.setDate(start.getDate() + 6); // Sunday
      setPeriodStart(start.toISOString().split('T')[0]);
      setPeriodEnd(end.toISOString().split('T')[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId) {
      setError('Please select a staff member.');
      return;
    }
    if (periodEnd < periodStart) {
      setError('Period end date cannot be earlier than start date.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSubmit({
        staffId,
        periodStart,
        periodEnd,
        notes: notes.trim() || undefined
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create timesheet';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Generate Timesheet</h3>
              <p className="text-xs text-slate-500">Compiles recorded teaching and event work into a draft timesheet</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Staff Member *</label>
            <select
              value={staffId}
              onChange={e => setStaffId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Select Staff Member --</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.role || 'Staff'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Period Selection</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handlePresetChange('this_month')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  periodPreset === 'this_month'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('last_month')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  periodPreset === 'last_month'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('this_week')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  periodPreset === 'this_week'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                This Week
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('custom')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  periodPreset === 'custom'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Period Start *</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={periodStart}
                  onChange={e => {
                    setPeriodStart(e.target.value);
                    setPeriodPreset('custom');
                  }}
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Period End *</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={periodEnd}
                  onChange={e => {
                    setPeriodEnd(e.target.value);
                    setPeriodPreset('custom');
                  }}
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Internal Notes (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Regular monthly teaching timesheet including festival rehearsal duties..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
            All valid, non-cancelled work records for this staff member within the date range will be automatically compiled as initial entries. You can review and include/exclude entries before submission.
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Generating...' : 'Build Draft Timesheet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
