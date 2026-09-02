import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Send, 
  ShieldCheck, 
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { useTimesheet } from '../../hooks/useTimesheet';
import { useStaff } from '../../hooks/useStaff';
import { useAuth } from '../../contexts/AuthContext';
import { timesheetService } from '../../services/timesheetService';
import type { TimesheetStatus } from '../../types';

export const StaffTimesheetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, authUser } = useAuth();
  const actorId = authUser?.uid || user?.uid || '';

  const { 
    timesheet, 
    entries, 
    breakdown, 
    loading, 
    toggleEntryIncluded, 
    submitTimesheet, 
    returnTimesheet, 
    verifyTimesheet, 
    approveTimesheet, 
    rejectTimesheet 
  } = useTimesheet(id);

  const { staff } = useStaff();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const staffMember = staff.find(s => s.id === timesheet?.staffId);
  const staffName = staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : (timesheet?.staffId || '');

  const formatStatusBadge = (status: TimesheetStatus) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Approved</span>;
      case 'verified':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Verified</span>;
      case 'submitted':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">Submitted</span>;
      case 'under_review':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Under Review</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">Draft</span>;
    }
  };

  const handleVerify = async () => {
    try {
      setSubmitting(true);
      setActionError(null);
      await verifyTimesheet();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setActionError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      setActionError(null);
      await approveTimesheet();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      setActionError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReturn = async () => {
    if (!actionReason.trim()) return;
    try {
      setSubmitting(true);
      setActionError(null);
      await returnTimesheet(actionReason.trim());
      setReturnModalOpen(false);
      setActionReason('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Return failed';
      setActionError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!actionReason.trim()) return;
    try {
      setSubmitting(true);
      setActionError(null);
      await rejectTimesheet(actionReason.trim());
      setRejectModalOpen(false);
      setActionReason('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Rejection failed';
      setActionError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-sm">Loading timesheet detail...</div>;
  }

  if (!timesheet) {
    return (
      <div className="p-12 text-center text-slate-500">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
        <h2 className="text-lg font-bold">Timesheet Not Found</h2>
        <button onClick={() => navigate('/staff-operations/timesheets')} className="mt-4 btn btn-secondary text-xs">
          Back to Timesheets
        </button>
      </div>
    );
  }

  const isEditableDraft = timesheet.timesheetStatus === 'draft';
  const isSelfSubmission = timesheet.submittedBy === actorId;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/staff-operations/timesheets"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900">
                Timesheet: {staffName}
              </h1>
              {formatStatusBadge(timesheet.timesheetStatus)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Period: <span className="font-semibold text-slate-700">{timesheet.periodStart}</span> to <span className="font-semibold text-slate-700">{timesheet.periodEnd}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isEditableDraft && (
            <button
              onClick={submitTimesheet}
              disabled={submitting || timesheet.totalEntries === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Timesheet
            </button>
          )}

          {(timesheet.timesheetStatus === 'submitted' || timesheet.timesheetStatus === 'under_review') && (
            <>
              <button
                onClick={() => setReturnModalOpen(true)}
                className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                Return For Correction
              </button>
              <button
                onClick={() => setRejectModalOpen(true)}
                className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                Reject
              </button>
              <button
                onClick={handleVerify}
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verify Entries
              </button>
            </>
          )}

          {timesheet.timesheetStatus === 'verified' && (
            <>
              <button
                onClick={() => setReturnModalOpen(true)}
                className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                Return For Correction
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting || isSelfSubmission}
                title={isSelfSubmission ? 'Self-approval is forbidden by governance policy' : undefined}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Approve Timesheet
              </button>
            </>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Self-Approval Warning Banner */}
      {timesheet.timesheetStatus === 'verified' && isSelfSubmission && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Self-Approval Protected:</strong> You submitted this timesheet ({actorId}). Under ArtsFlow OS governance, an independent administrator or supervisor must approve it.
          </span>
        </div>
      )}

      {/* Hours Summary Breakdown (Section 33 & 34) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Teaching Hours</span>
          <div className="mt-2 text-xl font-extrabold text-slate-900">
            {timesheetService.formatDuration(breakdown.teachingMinutes)}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Classes & Rehearsals</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Event Duties</span>
          <div className="mt-2 text-xl font-extrabold text-slate-900">
            {timesheetService.formatDuration(breakdown.eventMinutes)}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Concerts & Shows</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Administration</span>
          <div className="mt-2 text-xl font-extrabold text-slate-900">
            {timesheetService.formatDuration(breakdown.adminMinutes)}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Meetings & Prep</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Other Duties</span>
          <div className="mt-2 text-xl font-extrabold text-slate-900">
            {timesheetService.formatDuration(breakdown.otherMinutes)}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Setup & Staging</span>
        </div>

        <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Total Work</span>
          <div className="mt-2 text-2xl font-extrabold text-indigo-950">
            {timesheetService.formatDuration(breakdown.totalMinutes)}
          </div>
          <span className="text-[10px] text-indigo-600 font-medium">{timesheet.totalEntries} validated entries</span>
        </div>
      </div>

      {/* Entries List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Timesheet Entries</h3>
            <p className="text-xs text-slate-500">Line-by-line operational evidence supporting this timesheet</p>
          </div>
          {isEditableDraft && (
            <span className="text-xs text-slate-400 font-medium">
              Toggle checkbox to include/exclude entries
            </span>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            No work entries found in this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  {isEditableDraft && <th className="w-10 px-4 py-3 text-center">Inc</th>}
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Work Type</th>
                  <th className="px-6 py-3">Time Range</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Target Context / Notes</th>
                  <th className="px-6 py-3">Entry Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {entries.map(e => (
                  <tr 
                    key={e.id} 
                    className={`transition-colors ${e.entryStatus === 'excluded' ? 'opacity-40 bg-slate-50' : 'hover:bg-slate-50'}`}
                  >
                    {isEditableDraft && (
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={e.entryStatus === 'included'}
                          onChange={ev => toggleEntryIncluded(e.id, ev.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                    )}
                    <td className="px-6 py-3.5 whitespace-nowrap font-bold text-slate-900">
                      {e.workDate}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 uppercase">
                        {e.workType}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-500">
                      {e.startTime ? `${e.startTime} - ${e.endTime || ''}` : 'Scheduled'}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">
                      {timesheetService.formatDuration(e.durationMinutes)}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {e.sessionId && <div>Session: <span className="font-mono text-[10px]">{e.sessionId}</span></div>}
                      {e.eventId && <div>Event: <span className="font-mono text-[10px]">{e.eventId}</span></div>}
                      {e.notes && <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{e.notes}</div>}
                    </td>
                    <td className="px-6 py-3.5">
                      {e.entryStatus === 'verified' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Verified</span>
                      )}
                      {e.entryStatus === 'included' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700">Included</span>
                      )}
                      {e.entryStatus === 'excluded' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">Excluded</span>
                      )}
                      {e.entryStatus === 'rejected' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700">Rejected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Return Modal */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Return Timesheet for Correction</h3>
            <p className="text-xs text-slate-500">Specify what adjustments or missing items the staff member needs to fix.</p>
            <textarea
              rows={3}
              value={actionReason}
              onChange={e => setActionReason(e.target.value)}
              placeholder="e.g. Please clarify rehearsal on the 14th..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReturnModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReturn}
                disabled={!actionReason.trim()}
                className="px-3 py-1.5 text-xs text-white bg-amber-600 hover:bg-amber-700 rounded-lg font-semibold disabled:opacity-50"
              >
                Return to Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Reject Timesheet</h3>
            <p className="text-xs text-slate-500">Document why this timesheet cannot be verified.</p>
            <textarea
              rows={3}
              value={actionReason}
              onChange={e => setActionReason(e.target.value)}
              placeholder="e.g. Total hours conflict with actual venue attendance logs..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!actionReason.trim()}
                className="px-3 py-1.5 text-xs text-white bg-rose-600 hover:bg-rose-700 rounded-lg font-semibold disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
