import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, Clock, Calendar, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStaffTimesheets } from '../../hooks/useStaffTimesheets';
import { useStaffWorkRecords } from '../../hooks/useStaffWorkRecords';
import { useStaff } from '../../hooks/useStaff';
import { timesheetService } from '../../services/timesheetService';
import { timesheetVerificationService } from '../../services/timesheetVerificationService';
import { useAuth } from '../../contexts/AuthContext';

export const StaffVerificationPage: React.FC = () => {
  const { timesheets, loading: timesheetsLoading, refresh: refreshTimesheets } = useStaffTimesheets();
  const { records: unverifiedRecords, loading: recordsLoading, verifyRecord } = useStaffWorkRecords();
  const { staff } = useStaff();
  const { organisationId, user, authUser } = useAuth();
  const actorId = authUser?.uid || user?.uid || '';

  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const staffMap = new Map(staff.map(s => [s.id, `${s.firstName} ${s.lastName}`]));

  // Pending verification timesheets: submitted or under_review
  const pendingTimesheets = timesheets.filter(
    t => t.timesheetStatus === 'submitted' || t.timesheetStatus === 'under_review'
  );

  const handleVerifyTimesheet = async (timesheetId: string) => {
    if (!organisationId) return;
    try {
      setVerifyingId(timesheetId);
      await timesheetVerificationService.verifyTimesheet(organisationId, timesheetId, actorId);
      setSuccessNotice(`Timesheet ${timesheetId} verified successfully.`);
      await refreshTimesheets();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to verify timesheet';
      alert(msg);
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-indigo-600" />
          Operational Verification Inbox
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review and verify submitted work records and timesheets to ensure operational accuracy before administrative approval.
        </p>
      </div>

      {successNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center justify-between">
          <span>{successNotice}</span>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-600 hover:text-emerald-900">
            Dismiss
          </button>
        </div>
      )}

      {/* Submitted Timesheets Awaiting Verification */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Submitted Timesheets Pending Verification
            </h3>
            <p className="text-xs text-slate-500">Confirm whether teaching and event hours recorded by staff took place as scheduled</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            {pendingTimesheets.length} Pending
          </span>
        </div>

        {timesheetsLoading ? (
          <div className="p-10 text-center text-slate-400 text-xs">Loading pending timesheets...</div>
        ) : pendingTimesheets.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            All submitted timesheets have been verified. Inbox is clear!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Staff Member</th>
                  <th className="px-6 py-3">Period</th>
                  <th className="px-6 py-3">Total Work</th>
                  <th className="px-6 py-3">Entries</th>
                  <th className="px-6 py-3">Submitted By</th>
                  <th className="px-6 py-3 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {pendingTimesheets.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-900">
                      {staffMap.get(t.staffId) || t.staffId}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-600">
                      <div className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.periodStart} &rarr; {t.periodEnd}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">
                      {timesheetService.formatDuration(t.totalMinutes)}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {t.totalEntries} entries
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 font-mono text-[11px]">
                      {t.submittedBy || 'staff'}
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap space-x-2">
                      <Link
                        to={`/staff-operations/timesheets/${t.id}`}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 inline-flex items-center gap-1"
                      >
                        Inspect Details
                      </Link>
                      <button
                        onClick={() => handleVerifyTimesheet(t.id)}
                        disabled={verifyingId === t.id}
                        className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                      >
                        <Check className="w-3 h-3" />
                        {verifyingId === t.id ? 'Verifying...' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unverified Individual Work Records */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Unverified Individual Work Records</h3>
            <p className="text-xs text-slate-500">Draft records awaiting standalone verification before timesheet compilation</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {unverifiedRecords.length} Records
          </span>
        </div>

        {recordsLoading ? (
          <div className="p-10 text-center text-slate-400 text-xs">Loading records...</div>
        ) : unverifiedRecords.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            No standalone unverified work records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Staff Member</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Source</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {unverifiedRecords.slice(0, 15).map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap font-bold text-slate-900">{r.workDate}</td>
                    <td className="px-6 py-3 font-semibold text-slate-800">{staffMap.get(r.staffId) || r.staffId}</td>
                    <td className="px-6 py-3 capitalize">{r.workType}</td>
                    <td className="px-6 py-3 font-bold text-slate-900">{timesheetService.formatDuration(r.durationMinutes)}</td>
                    <td className="px-6 py-3 capitalize text-slate-500">{r.sourceType}</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => verifyRecord(r.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-900 font-semibold"
                      >
                        Verify Record &rarr;
                      </button>
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
