import React, { useState } from 'react';
import { X, Briefcase } from 'lucide-react';
import { useStaff } from '../../../hooks/useStaff';
import { useProgrammes } from '../../../hooks/useProgrammes';
import { useProgrammeGroups } from '../../../hooks/useProgrammeGroups';
import type { CreateStaffAssignmentInput } from '../../../services/staffAssignmentService';
import type { AssignmentRole, AssignmentType } from '../../../types';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateStaffAssignmentInput) => Promise<void>;
  preselectedStaffId?: string;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  preselectedStaffId
}) => {
  const { staff } = useStaff();
  const { programmes } = useProgrammes();
  const { groups } = useProgrammeGroups();

  const [staffId, setStaffId] = useState(preselectedStaffId || '');
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('group');
  const [programmeId, setProgrammeId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [role, setRole] = useState<AssignmentRole>('lead_teacher');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isPrimary, setIsPrimary] = useState(true);
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
        assignmentType,
        programmeId: programmeId || undefined,
        groupId: groupId || undefined,
        role,
        startDate,
        endDate: endDate || undefined,
        isPrimary,
        notes: notes.trim() || undefined
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save assignment';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const filteredGroups = programmeId 
    ? groups.filter(g => g.programmeId === programmeId)
    : groups;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">New Staff Assignment</h3>
              <p className="text-xs text-slate-500">Assign staff to programmes, classes, or events</p>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Assignment Scope *</label>
              <select
                value={assignmentType}
                onChange={e => setAssignmentType(e.target.value as AssignmentType)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="group">Group / Class</option>
                <option value="programme">Whole Programme</option>
                <option value="event">Event Duty</option>
                <option value="administrative">Administrative</option>
                <option value="general">General Operational</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Operational Role *</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as AssignmentRole)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="lead_teacher">Lead Teacher</option>
                <option value="assistant_teacher">Assistant Teacher</option>
                <option value="conductor">Conductor</option>
                <option value="dance_teacher">Dance Teacher</option>
                <option value="accompanist">Accompanist</option>
                <option value="coach">Coach / Tutor</option>
                <option value="supervisor">Event Supervisor</option>
                <option value="programme_director">Programme Director</option>
                <option value="substitute">Regular Substitute</option>
                <option value="volunteer">Volunteer</option>
                <option value="other">Other Role</option>
              </select>
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
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Any / Independent --</option>
                {programmes.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Class / Group</label>
              <select
                value={groupId}
                onChange={e => setGroupId(e.target.value)}
                disabled={assignmentType !== 'group'}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              >
                <option value="">-- Select Class --</option>
                {filteredGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">End Date (Optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPrimary"
              checked={isPrimary}
              onChange={e => setIsPrimary(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isPrimary" className="text-xs text-slate-700 font-medium cursor-pointer">
              Primary Lead Teacher / Responsible Staff
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Schedule Context</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Leads Saturday brass ensemble rehearsals..."
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
              {saving ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
