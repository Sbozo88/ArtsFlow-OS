import React, { useState } from 'react';
import { X, CalendarClock } from 'lucide-react';
import { useStaff } from '../../../hooks/useStaff';
import type { SetStaffAvailabilityInput } from '../../../services/staffAvailabilityService';
import type { AvailabilityType } from '../../../types';

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: SetStaffAvailabilityInput) => Promise<void>;
  preselectedStaffId?: string;
}

export const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  preselectedStaffId
}) => {
  const { staff } = useStaff();

  const [staffId, setStaffId] = useState(preselectedStaffId || '');
  const [availabilityType, setAvailabilityType] = useState<AvailabilityType>('available');
  const [scope, setScope] = useState<'date' | 'weekly'>('weekly');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dayOfWeek, setDayOfWeek] = useState<number>(1); // Monday
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId) {
      setError('Please select a staff member.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSubmit({
        staffId,
        availabilityType,
        date: scope === 'date' ? date : undefined,
        dayOfWeek: scope === 'weekly' ? dayOfWeek : undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        reason: reason.trim() || undefined,
        notes: notes.trim() || undefined
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save availability';
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
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Set Staff Availability</h3>
              <p className="text-xs text-slate-500">Record recurring timetable availability or specific blackout dates</p>
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
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Availability Type *</label>
              <select
                value={availabilityType}
                onChange={e => setAvailabilityType(e.target.value as AvailabilityType)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="available">Available</option>
                <option value="preferred">Preferred Working Hours</option>
                <option value="limited">Limited Window</option>
                <option value="unavailable">Unavailable / Blackout</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Schedule Scope *</label>
              <select
                value={scope}
                onChange={e => setScope(e.target.value as 'date' | 'weekly')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="weekly">Recurring Weekly Day</option>
                <option value="date">Specific Single Date</option>
              </select>
            </div>
          </div>

          {scope === 'weekly' ? (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Day of Week *</label>
              <select
                value={dayOfWeek}
                onChange={e => setDayOfWeek(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
                <option value={0}>Sunday</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Reason (for unavailable/limited)</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. University lectures on Monday mornings..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Additional Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Can do occasional emergency coverage..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
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
              {saving ? 'Saving...' : 'Set Availability'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
