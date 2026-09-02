import React from 'react';
import { CheckSquare, CheckCircle2, Clock, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { useGuardianPortal } from '../../../hooks/useGuardianPortal';
import { useGuardianAttendance } from '../../../hooks/useGuardianAttendance';

export const GuardianAttendancePage: React.FC = () => {
  const { selectedLearner, selectedLearnerId } = useGuardianPortal();
  const { attendance, loading, error } = useGuardianAttendance(selectedLearnerId);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !attendance) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800">
          <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
          <p className="text-sm font-semibold">{error || 'Attendance records unavailable.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Attendance Record
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-1">
          Attendance — {selectedLearner?.preferredName || selectedLearner?.firstName || 'Learner'}
        </h1>
        <p className="text-sm text-slate-500">
          Track session attendance compliance, late arrivals, and excused absences.
        </p>
      </div>

      {/* Main Stats Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Compliance Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-4xl sm:text-5xl font-black ${
              attendance.attendanceRate >= 80 ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              {attendance.attendanceRate.toFixed(1)}%
            </span>
            <span className="text-xs font-semibold text-slate-400">
              across {attendance.totalEvaluatedSessions} sessions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Calculated according to organisation attendance policy and credit formulas.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
            <div className="text-lg font-black text-slate-900 mt-1">{attendance.presentCount}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Present</div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-center">
            <Clock className="w-5 h-5 text-amber-600 mx-auto" />
            <div className="text-lg font-black text-slate-900 mt-1">{attendance.lateCount}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Late</div>
          </div>

          <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-center">
            <XCircle className="w-5 h-5 text-rose-600 mx-auto" />
            <div className="text-lg font-black text-slate-900 mt-1">{attendance.absentCount}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Absent</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center">
            <CheckSquare className="w-5 h-5 text-slate-500 mx-auto" />
            <div className="text-lg font-black text-slate-900 mt-1">{attendance.excusedCount}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Excused</div>
          </div>
        </div>
      </div>

      {/* Recent Attendance Timeline */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Recent Attendance History</h2>
        </div>

        {attendance.recentSessions.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No attendance records found yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {attendance.recentSessions.map((session, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-500">{session.date}</span>
                  <span className="font-semibold text-slate-900">{session.sessionTitle}</span>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  session.status === 'present'
                    ? 'bg-emerald-100 text-emerald-800'
                    : session.status === 'late'
                    ? 'bg-amber-100 text-amber-800'
                    : session.status === 'excused'
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {session.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
