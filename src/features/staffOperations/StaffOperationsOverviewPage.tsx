import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  FileText, 
  Plus, 
  ArrowRight,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStaffWorkload } from '../../hooks/useStaffWorkload';
import { AssignmentModal } from './components/AssignmentModal';
import { ManualWorkRecordModal } from './components/ManualWorkRecordModal';
import { CreateTimesheetModal } from './components/CreateTimesheetModal';
import { SubstitutionModal } from './components/SubstitutionModal';
import { useStaffAssignments } from '../../hooks/useStaffAssignments';
import { useStaffWorkRecords } from '../../hooks/useStaffWorkRecords';
import { useStaffTimesheets } from '../../hooks/useStaffTimesheets';
import { useStaffSubstitutions } from '../../hooks/useStaffSubstitutions';

export const StaffOperationsOverviewPage: React.FC = () => {
  const { overviewStats, coverage, loading, refresh } = useStaffWorkload();
  const { createAssignment } = useStaffAssignments();
  const { createManualRecord } = useStaffWorkRecords();
  const { createDraftTimesheet } = useStaffTimesheets();
  const { requestSubstitution } = useStaffSubstitutions();

  // Modals
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isTimesheetOpen, setIsTimesheetOpen] = useState(false);
  const [isSubstitutionOpen, setIsSubstitutionOpen] = useState(false);

  const handleCreateAssignment = async (input: Parameters<typeof createAssignment>[0]) => {
    await createAssignment(input);
    await refresh();
  };

  const handleCreateRecord = async (input: Parameters<typeof createManualRecord>[0]) => {
    const res = await createManualRecord(input);
    await refresh();
    return res;
  };

  const handleCreateTimesheet = async (input: Parameters<typeof createDraftTimesheet>[0]) => {
    const res = await createDraftTimesheet(input);
    await refresh();
    return res;
  };

  const handleRequestSubstitution = async (input: Parameters<typeof requestSubstitution>[0]) => {
    const res = await requestSubstitution(input);
    await refresh();
    return res;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Briefcase className="w-7 h-7 text-indigo-600" />
            Staff Operations & Workload
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage teacher assignments, verify operational work records, and track staff availability and timesheets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAssignmentOpen(true)}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Assign Staff
          </button>
          <button
            onClick={() => setIsSubstitutionOpen(true)}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
            Substitution
          </button>
          <button
            onClick={() => setIsRecordOpen(true)}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            Record Work
          </button>
          <button
            onClick={() => setIsTimesheetOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            New Timesheet
          </button>
        </div>
      </div>

      {/* KPI Grid (Section 2) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Staff</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{overviewStats.activeStaffCount}</span>
            <span className="text-xs text-slate-500 font-medium">on roster</span>
          </div>
          <Link to="/staff" className="text-[11px] text-blue-600 hover:underline mt-2 inline-flex items-center gap-1">
            Staff Directory <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Teaching This Week</span>
            <Calendar className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{overviewStats.teachersWorkingThisWeekCount}</span>
            <span className="text-xs text-slate-500 font-medium">teachers active</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            {overviewStats.sessionsThisWeekCount} sessions scheduled
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Timesheets In Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{overviewStats.unverifiedTimesheetsCount}</span>
            <span className="text-xs text-amber-600 font-medium">unverified</span>
          </div>
          <Link to="/staff-operations/verification" className="text-[11px] text-amber-600 hover:underline mt-2 inline-flex items-center gap-1 font-semibold">
            Verify Work Entries <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Awaiting Approval</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{overviewStats.timesheetsAwaitingApprovalCount}</span>
            <span className="text-xs text-indigo-600 font-medium">verified</span>
          </div>
          <Link to="/staff-operations/timesheets" className="text-[11px] text-indigo-600 hover:underline mt-2 inline-flex items-center gap-1 font-semibold">
            Review Timesheets <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>
      </div>

      {/* Secondary Operational Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-semibold text-slate-700">Active Substitutions</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            {overviewStats.activeSubstitutionsCount}
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-semibold text-slate-700">Staff With High Workload</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            overviewStats.highWorkloadStaffCount > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
          }`}>
            {overviewStats.highWorkloadStaffCount}
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-700">No Recent Activity</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
            {overviewStats.noRecentActivityStaffCount}
          </span>
        </div>
      </div>

      {/* Group Staff Coverage Overview (Section 27) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Group Staff Coverage</h3>
            <p className="text-xs text-slate-500">Operational teacher assignments across active groups and ensembles</p>
          </div>
          <Link
            to="/staff-operations/assignments"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
          >
            All Assignments <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading coverage data...</div>
        ) : coverage.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No active groups found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Group / Ensemble</th>
                  <th className="px-6 py-3">Lead Teacher</th>
                  <th className="px-6 py-3">Assistants</th>
                  <th className="px-6 py-3">Upcoming Sessions</th>
                  <th className="px-6 py-3">Coverage Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {coverage.map(item => (
                  <tr key={item.groupId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-bold text-slate-900">{item.groupName}</td>
                    <td className="px-6 py-3">
                      {item.primaryTeacherName ? (
                        <span className="text-slate-800">{item.primaryTeacherName}</span>
                      ) : (
                        <span className="text-rose-600 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> No Lead Teacher
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">{item.assistantTeachersCount} assistant(s)</td>
                    <td className="px-6 py-3">{item.upcomingSessionsCount} scheduled</td>
                    <td className="px-6 py-3">
                      {item.coverageStatus === 'covered' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Covered
                        </span>
                      )}
                      {item.coverageStatus === 'unassigned' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Unassigned
                        </span>
                      )}
                      {item.coverageStatus === 'substitute_active' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Substitute Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => setIsAssignmentOpen(true)}
                        className="text-xs text-indigo-600 hover:text-indigo-900 font-semibold"
                      >
                        Assign &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AssignmentModal
        isOpen={isAssignmentOpen}
        onClose={() => setIsAssignmentOpen(false)}
        onSubmit={handleCreateAssignment}
      />

      <ManualWorkRecordModal
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        onSubmit={handleCreateRecord}
      />

      <CreateTimesheetModal
        isOpen={isTimesheetOpen}
        onClose={() => setIsTimesheetOpen(false)}
        onSubmit={handleCreateTimesheet}
      />

      <SubstitutionModal
        isOpen={isSubstitutionOpen}
        onClose={() => setIsSubstitutionOpen(false)}
        onSubmit={handleRequestSubstitution}
      />
    </div>
  );
};
