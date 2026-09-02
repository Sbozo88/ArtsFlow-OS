import React, { useState } from 'react';
import { Clock, Plus, CheckCircle2, XCircle, Search, Filter, Calendar } from 'lucide-react';
import { useStaffWorkRecords } from '../../hooks/useStaffWorkRecords';
import { useStaff } from '../../hooks/useStaff';
import { useSessions } from '../../hooks/useSessions';
import { useEvents } from '../../hooks/useEvents';
import { ManualWorkRecordModal } from './components/ManualWorkRecordModal';
import { timesheetService } from '../../services/timesheetService';
import type { WorkType } from '../../types';

export const StaffWorkRecordsPage: React.FC = () => {
  const { records, loading, createManualRecord, generateFromSession, generateFromEvent, verifyRecord, rejectRecord } = useStaffWorkRecords();
  const { staff } = useStaff();
  const { sessions } = useSessions();
  const { events } = useEvents();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [generating, setGenerating] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const staffMap = new Map(staff.map(s => [s.id, `${s.firstName} ${s.lastName}`]));

  const formatWorkType = (type: WorkType): string => {
    switch (type) {
      case 'teaching': return 'Teaching';
      case 'rehearsal': return 'Rehearsal';
      case 'event': return 'Event Duty';
      case 'performance': return 'Performance';
      case 'workshop': return 'Workshop';
      case 'administration': return 'Administration';
      case 'meeting': return 'Staff Meeting';
      case 'setup': return 'Setup / Staging';
      case 'supervision': return 'Supervision';
      default: return 'Other Work';
    }
  };

  const handleSyncSessions = async () => {
    try {
      setGenerating(true);
      setSyncNotice(null);
      let count = 0;
      // Find completed or scheduled sessions in past 30 days
      const today = new Date().toISOString().split('T')[0];
      for (const s of sessions) {
        if (s.date <= today && s.sessionStatus !== 'cancelled') {
          const created = await generateFromSession(s.id);
          count += created.length;
        }
      }
      setSyncNotice(`Auto-generation complete: ${count} draft work records generated from sessions.`);
    } catch {
      setSyncNotice('Session synchronization failed. Please check logs.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSyncEvents = async () => {
    try {
      setGenerating(true);
      setSyncNotice(null);
      let count = 0;
      const today = new Date().toISOString().split('T')[0];
      for (const ev of events) {
        if (ev.eventStatus === 'completed' || (ev.startDate && ev.startDate.split('T')[0] <= today && ev.eventStatus !== 'cancelled')) {
          const created = await generateFromEvent(ev.id);
          count += created.length;
        }
      }
      setSyncNotice(`Event synchronization complete: ${count} draft work records generated from events.`);
    } catch {
      setSyncNotice('Event synchronization failed. Please check logs.');
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingId || !rejectionReason.trim()) return;
    await rejectRecord(rejectingId, rejectionReason.trim());
    setRejectingId(null);
    setRejectionReason('');
  };

  const filtered = records.filter(r => {
    if (selectedStatus !== 'all' && r.workStatus !== selectedStatus) return false;
    if (selectedType !== 'all' && r.workType !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const sName = (staffMap.get(r.staffId) || '').toLowerCase();
      const notes = (r.notes || '').toLowerCase();
      return sName.includes(q) || notes.includes(q) || r.workType.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-600" />
            Operational Work Records
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Primary operational evidence of teaching sessions, rehearsals, event supervision, and administration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncSessions}
            disabled={generating}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            {generating ? 'Scanning...' : 'Sync Sessions'}
          </button>
          <button
            onClick={handleSyncEvents}
            disabled={generating}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
          >
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            Sync Events
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Record Work
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center justify-between">
          <span>{syncNotice}</span>
          <button onClick={() => setSyncNotice(null)} className="text-emerald-600 hover:text-emerald-900">
            Dismiss
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search work records by staff, type, or notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Type:</span>
          </div>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none"
          >
            <option value="all">All Work Types</option>
            <option value="teaching">Teaching</option>
            <option value="rehearsal">Rehearsal</option>
            <option value="event">Event</option>
            <option value="performance">Performance</option>
            <option value="administration">Administration</option>
            <option value="workshop">Workshop</option>
            <option value="supervision">Supervision</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft (Unverified)</option>
            <option value="recorded">Recorded</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Work Records Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading work records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No operational work records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Staff Member</th>
                  <th className="px-6 py-3">Work Type</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Source Evidence</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-600 font-semibold">
                      {r.workDate}
                      {r.startTime && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          {r.startTime} - {r.endTime || 'end'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">
                      {staffMap.get(r.staffId) || r.staffId}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 uppercase">
                        {formatWorkType(r.workType)}
                      </span>
                      {r.notes && (
                        <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{r.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-800 whitespace-nowrap">
                      {timesheetService.formatDuration(r.durationMinutes)}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">({r.durationMinutes}m)</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="capitalize text-slate-500 text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {r.sourceType}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      {r.workStatus === 'verified' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Verified
                        </span>
                      )}
                      {(r.workStatus === 'draft' || r.workStatus === 'recorded') && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Pending
                        </span>
                      )}
                      {r.workStatus === 'rejected' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200" title={r.rejectionReason}>
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      {r.workStatus !== 'verified' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => verifyRecord(r.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Verify Record"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRejectingId(r.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                            title="Reject Record"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal Dialog */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Reject Work Record</h3>
            <p className="text-xs text-slate-500">Provide an operational reason for returning or rejecting this record.</p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g. Session cancelled due to public holiday, work did not occur..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectingId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim()}
                className="px-3 py-1.5 text-xs text-white bg-rose-600 hover:bg-rose-700 rounded-lg font-semibold disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      <ManualWorkRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={createManualRecord}
      />
    </div>
  );
};
