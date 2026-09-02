import React, { useState } from 'react';
import { X, Clock, AlertTriangle } from 'lucide-react';
import { useStaff } from '../../../hooks/useStaff';
import { useProgrammes } from '../../../hooks/useProgrammes';
import { useProgrammeGroups } from '../../../hooks/useProgrammeGroups';
import type { CreateManualWorkRecordInput } from '../../../services/staffWorkRecordService';
import type { WorkType } from '../../../types';

interface ManualWorkRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateManualWorkRecordInput) => Promise<{ warnings: string[] }>;
  preselectedStaffId?: string;
}

export const ManualWorkRecordModal: React.FC<ManualWorkRecordModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  preselectedStaffId
}) => {
  const { staff } = useStaff();
  const { programmes } = useProgrammes();
  const { groups } = useProgrammeGroups();

  const [staffId, setStaffId] = useState(preselectedStaffId || '');
  const [workType, setWorkType] = useState<WorkType>('teaching');
  const [programmeId, setProgrammeId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleTimeChange = (start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);
    if (start && end) {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff > 0) setDurationMinutes(diff);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId) {
      setError('Please select a staff member.');
      return;
    }
    if (durationMinutes <= 0) {
      setError('Duration must be greater than zero minutes.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await onSubmit({
        staffId,
        workType,
        programmeId: programmeId || undefined,
        groupId: groupId || undefined,
        workDate,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        durationMinutes,
        notes: notes.trim() || undefined
      });

      if (res.warnings && res.warnings.length > 0) {
        setWarnings(res.warnings);
      } else {
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record work';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const filteredGroups = programmeId ? groups.filter(g => g.programmeId === programmeId) : groups;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Record Operational Work</h3>
              <p className="text-xs text-slate-500">Record teaching, rehearsal, supervision, or admin hours</p>
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

          {warnings.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Operational Warnings Noted:
              </div>
              {warnings.map((w, idx) => (
                <div key={idx}>• {w}</div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Staff Member *</label>
            <select
              value={staffId}
              onChange={e => setStaffId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Work Type *</label>
              <select
                value={workType}
                onChange={e => setWorkType(e.target.value as WorkType)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="teaching">Teaching / Class</option>
                <option value="rehearsal">Rehearsal</option>
                <option value="event">Event Duty</option>
                <option value="performance">Performance</option>
                <option value="workshop">Workshop</option>
                <option value="administration">Administration</option>
                <option value="meeting">Staff Meeting</option>
                <option value="setup">Setup / Staging</option>
                <option value="supervision">Supervision</option>
                <option value="other">Other Operational</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Work Date *</label>
              <input
                type="date"
                value={workDate}
                onChange={e => setWorkDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={e => handleTimeChange(e.target.value, endTime)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={e => handleTimeChange(startTime, e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Duration (Min) *</label>
              <input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Programme (Optional)</label>
              <select
                value={programmeId}
                onChange={e => {
                  setProgrammeId(e.target.value);
                  setGroupId('');
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- General / No Programme --</option>
                {programmes.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Class / Group (Optional)</label>
              <select
                value={groupId}
                onChange={e => setGroupId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- None / Independent --</option>
                {filteredGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Work Description / Evidence Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Conducted extra ensemble sectional rehearsal before festival..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {warnings.length > 0 ? 'Close' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Recording...' : warnings.length > 0 ? 'Save Anyway' : 'Save Work Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
