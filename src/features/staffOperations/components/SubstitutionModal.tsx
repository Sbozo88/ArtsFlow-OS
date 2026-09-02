import React, { useState } from 'react';
import { X, UserCheck, AlertTriangle } from 'lucide-react';
import { useStaff } from '../../../hooks/useStaff';
import { useSessions } from '../../../hooks/useSessions';
import type { RequestSubstitutionInput } from '../../../services/staffSubstitutionService';

interface SubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: RequestSubstitutionInput) => Promise<{ availabilityWarning?: string }>;
  preselectedSessionId?: string;
  preselectedStaffId?: string;
}

export const SubstitutionModal: React.FC<SubstitutionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  preselectedSessionId,
  preselectedStaffId
}) => {
  const { staff } = useStaff();
  const { sessions } = useSessions();

  const [sessionId, setSessionId] = useState(preselectedSessionId || '');
  const [originalStaffId, setOriginalStaffId] = useState(preselectedStaffId || '');
  const [substituteStaffId, setSubstituteStaffId] = useState('');
  const [reason, setReason] = useState('illness');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSessionChange = (selectedId: string) => {
    setSessionId(selectedId);
    const session = sessions.find(s => s.id === selectedId);
    if (session && session.teacherIds && session.teacherIds.length > 0) {
      setOriginalStaffId(session.teacherIds[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !originalStaffId || !substituteStaffId) {
      setError('Please select a session, original staff, and replacement staff.');
      return;
    }
    if (originalStaffId === substituteStaffId) {
      setError('The substitute cannot be the same as the original teacher.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await onSubmit({
        sessionId,
        originalStaffId,
        substituteStaffId,
        reason,
        notes: notes.trim() || undefined
      });

      if (res.availabilityWarning) {
        setWarning(res.availabilityWarning);
      } else {
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to request substitution';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Only upcoming active sessions
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingSessions = sessions
    .filter(s => s.date >= todayStr && s.sessionStatus !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Request Teacher Substitution</h3>
              <p className="text-xs text-slate-500">Arrange temporary coverage and attribute work to substitute</p>
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

          {warning && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Availability Notice:</span> {warning}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Scheduled Session *</label>
            <select
              value={sessionId}
              onChange={e => handleSessionChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Select Session to Cover --</option>
              {upcomingSessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.date} ({s.startTime || 'TBD'} - {s.endTime || 'TBD'}) — Class {s.groupId}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Original Teacher *</label>
              <select
                value={originalStaffId}
                onChange={e => setOriginalStaffId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Original Staff --</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Substitute Teacher *</label>
              <select
                value={substituteStaffId}
                onChange={e => setSubstituteStaffId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Select Replacement --</option>
                {staff.filter(s => s.id !== originalStaffId).map(s => (
                  <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Reason for Absence / Substitution *</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="illness">Medical / Illness</option>
              <option value="family_emergency">Family Emergency</option>
              <option value="professional_performance">Outside Performance Duty</option>
              <option value="travel">Transport / Travel Delay</option>
              <option value="academic">Exam / Training Duty</option>
              <option value="other">Other Reason</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Handover Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Please rehearse bars 34 to 68 in the Holst suite..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {warning ? 'Close' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Requesting...' : warning ? 'Confirm Anyway' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
