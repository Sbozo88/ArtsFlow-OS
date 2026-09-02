import React, { useState } from 'react';
import { FileDown, Printer, BarChart3 } from 'lucide-react';
import { useStaffAssignments } from '../../hooks/useStaffAssignments';
import { useStaffWorkRecords } from '../../hooks/useStaffWorkRecords';
import { useStaffTimesheets } from '../../hooks/useStaffTimesheets';
import { useStaffSubstitutions } from '../../hooks/useStaffSubstitutions';
import { useStaff } from '../../hooks/useStaff';
import { useProgrammes } from '../../hooks/useProgrammes';
import { timesheetService } from '../../services/timesheetService';

type ReportType = 
  | 'assignments'
  | 'work_records'
  | 'timesheets'
  | 'programme_workload'
  | 'substitutions'
  | 'missing_timesheets';

export const StaffReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('assignments');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });

  const { assignments } = useStaffAssignments();
  const { records } = useStaffWorkRecords();
  const { timesheets } = useStaffTimesheets();
  const { substitutions } = useStaffSubstitutions();
  const { staff } = useStaff();
  const { programmes } = useProgrammes();

  const staffMap = new Map(staff.map(s => [s.id, `${s.firstName} ${s.lastName}`]));
  const programmeMap = new Map(programmes.map(p => [p.id, p.name]));

  // CSV Export utility
  const exportCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (reportType === 'assignments') {
      const headers = ['Staff Member', 'Role', 'Scope', 'Programme', 'Group', 'Primary', 'Start Date', 'End Date', 'Status'];
      const rows = assignments.map(a => [
        staffMap.get(a.staffId) || a.staffId,
        a.role,
        a.assignmentType,
        a.programmeId ? (programmeMap.get(a.programmeId) || a.programmeId) : '',
        a.groupId || '',
        a.isPrimary ? 'Yes' : 'No',
        a.startDate,
        a.endDate || '',
        a.assignmentStatus
      ]);
      exportCsv('staff_assignments_report', headers, rows);
    } else if (reportType === 'work_records') {
      const filtered = records.filter(r => r.workDate >= startDate && r.workDate <= endDate);
      const headers = ['Date', 'Staff Member', 'Work Type', 'Duration (Min)', 'Duration (Formatted)', 'Source', 'Source ID', 'Status'];
      const rows = filtered.map(r => [
        r.workDate,
        staffMap.get(r.staffId) || r.staffId,
        r.workType,
        r.durationMinutes,
        timesheetService.formatDuration(r.durationMinutes),
        r.sourceType,
        r.sourceRecordId || '',
        r.workStatus
      ]);
      exportCsv('staff_work_records_report', headers, rows);
    } else if (reportType === 'timesheets') {
      const filtered = timesheets.filter(t => t.periodStart >= startDate && t.periodEnd <= endDate);
      const headers = ['Staff Member', 'Period Start', 'Period End', 'Total Minutes', 'Total Formatted', 'Entries', 'Status', 'Submitted At', 'Verified At', 'Approved At'];
      const rows = filtered.map(t => [
        staffMap.get(t.staffId) || t.staffId,
        t.periodStart,
        t.periodEnd,
        t.totalMinutes,
        timesheetService.formatDuration(t.totalMinutes),
        t.totalEntries,
        t.timesheetStatus,
        t.submittedAt || '',
        t.verifiedAt || '',
        t.approvedAt || ''
      ]);
      exportCsv('staff_timesheets_report', headers, rows);
    } else if (reportType === 'substitutions') {
      const headers = ['Requested Date', 'Session ID', 'Original Staff', 'Substitute Staff', 'Reason', 'Status', 'Confirmed At'];
      const rows = substitutions.map(s => [
        s.requestedAt || '',
        s.sessionId,
        staffMap.get(s.originalStaffId) || s.originalStaffId,
        staffMap.get(s.substituteStaffId) || s.substituteStaffId,
        s.reason,
        s.substitutionStatus,
        s.confirmedAt || ''
      ]);
      exportCsv('staff_substitutions_report', headers, rows);
    } else if (reportType === 'missing_timesheets') {
      const missingStaff = staff.filter(s => {
        const hasWork = records.some(r => r.staffId === s.id && r.workDate >= startDate && r.workDate <= endDate);
        const hasSubmitted = timesheets.some(t => t.staffId === s.id && t.periodStart <= endDate && t.periodEnd >= startDate && t.timesheetStatus !== 'draft');
        return hasWork && !hasSubmitted;
      });
      const headers = ['Staff Member', 'Email', 'Role', 'Status', 'Period Checked'];
      const rows = missingStaff.map(s => [
        `${s.firstName} ${s.lastName}`,
        s.email || '',
        s.role || 'Staff',
        s.staffStatus,
        `${startDate} - ${endDate}`
      ]);
      exportCsv('missing_timesheets_report', headers, rows);
    } else if (reportType === 'programme_workload') {
      const headers = ['Programme', 'Staff Assigned', 'Total Work Minutes', 'Total Formatted'];
      const rows = programmes.map(p => {
        const progAssignments = assignments.filter(a => a.programmeId === p.id && a.assignmentStatus === 'active');
        const progRecords = records.filter(r => r.programmeId === p.id && r.workDate >= startDate && r.workDate <= endDate);
        const totalMin = progRecords.reduce((sum, r) => sum + r.durationMinutes, 0);
        return [
          p.name,
          progAssignments.length,
          totalMin,
          timesheetService.formatDuration(totalMin)
        ];
      });
      exportCsv('programme_workload_report', headers, rows);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Operational Staff Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate and export operational reports for governance, auditing, and administrative review.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
          <button
            onClick={handleExport}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        <button
          onClick={() => setReportType('assignments')}
          className={`p-3 rounded-xl border text-left transition-all ${
            reportType === 'assignments'
              ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-xs'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-bold">1. Assignments</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Roles & scopes</div>
        </button>

        <button
          onClick={() => setReportType('work_records')}
          className={`p-3 rounded-xl border text-left transition-all ${
            reportType === 'work_records'
              ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-xs'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-bold">2. Work Records</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Teaching evidence</div>
        </button>

        <button
          onClick={() => setReportType('timesheets')}
          className={`p-3 rounded-xl border text-left transition-all ${
            reportType === 'timesheets'
              ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-xs'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-bold">3. Timesheets</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Submission & status</div>
        </button>

        <button
          onClick={() => setReportType('programme_workload')}
          className={`p-3 rounded-xl border text-left transition-all ${
            reportType === 'programme_workload'
              ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-xs'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-bold">4. Programme Workload</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Hours by programme</div>
        </button>

        <button
          onClick={() => setReportType('substitutions')}
          className={`p-3 rounded-xl border text-left transition-all ${
            reportType === 'substitutions'
              ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-xs'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-bold">5. Substitutions</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Absences & coverage</div>
        </button>

        <button
          onClick={() => setReportType('missing_timesheets')}
          className={`p-3 rounded-xl border text-left transition-all ${
            reportType === 'missing_timesheets'
              ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-xs'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-bold">6. Missing Timesheets</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Unsubmitted staff</div>
        </button>
      </div>

      {/* Date Range Selector */}
      {(reportType === 'work_records' || reportType === 'timesheets' || reportType === 'programme_workload' || reportType === 'missing_timesheets') && (
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-4">
          <span className="text-xs font-semibold text-slate-500">Report Date Range:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
            />
            <span className="text-slate-400">&rarr;</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>
      )}

      {/* Report Content Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {reportType === 'assignments' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-6 py-3">Staff Member</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Scope</th>
                  <th className="px-6 py-3">Programme</th>
                  <th className="px-6 py-3">Group</th>
                  <th className="px-6 py-3">Start Date</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {assignments.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3.5 font-bold text-slate-900">{staffMap.get(a.staffId) || a.staffId}</td>
                    <td className="px-6 py-3.5">{a.role}</td>
                    <td className="px-6 py-3.5 capitalize">{a.assignmentType}</td>
                    <td className="px-6 py-3.5">{a.programmeId ? (programmeMap.get(a.programmeId) || a.programmeId) : '-'}</td>
                    <td className="px-6 py-3.5">{a.groupId || '-'}</td>
                    <td className="px-6 py-3.5">{a.startDate}</td>
                    <td className="px-6 py-3.5 capitalize">{a.assignmentStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'work_records' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Staff Member</th>
                  <th className="px-6 py-3">Work Type</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Source</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {records
                  .filter(r => r.workDate >= startDate && r.workDate <= endDate)
                  .map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3.5 font-bold text-slate-900">{r.workDate}</td>
                      <td className="px-6 py-3.5">{staffMap.get(r.staffId) || r.staffId}</td>
                      <td className="px-6 py-3.5 capitalize">{r.workType}</td>
                      <td className="px-6 py-3.5 font-bold">{timesheetService.formatDuration(r.durationMinutes)}</td>
                      <td className="px-6 py-3.5 capitalize">{r.sourceType}</td>
                      <td className="px-6 py-3.5 capitalize">{r.workStatus}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {reportType === 'timesheets' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-6 py-3">Staff Member</th>
                  <th className="px-6 py-3">Period</th>
                  <th className="px-6 py-3">Total Work</th>
                  <th className="px-6 py-3">Entries</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {timesheets
                  .filter(t => t.periodStart >= startDate && t.periodEnd <= endDate)
                  .map(t => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3.5 font-bold text-slate-900">{staffMap.get(t.staffId) || t.staffId}</td>
                      <td className="px-6 py-3.5">{t.periodStart} &rarr; {t.periodEnd}</td>
                      <td className="px-6 py-3.5 font-bold">{timesheetService.formatDuration(t.totalMinutes)}</td>
                      <td className="px-6 py-3.5">{t.totalEntries} entries</td>
                      <td className="px-6 py-3.5 capitalize">{t.timesheetStatus}</td>
                      <td className="px-6 py-3.5">{t.submittedAt ? t.submittedAt.split('T')[0] : '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {reportType === 'substitutions' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-6 py-3">Requested At</th>
                  <th className="px-6 py-3">Session ID</th>
                  <th className="px-6 py-3">Original Staff</th>
                  <th className="px-6 py-3">Substitute Staff</th>
                  <th className="px-6 py-3">Reason</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {substitutions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3.5">{s.requestedAt ? s.requestedAt.split('T')[0] : '-'}</td>
                    <td className="px-6 py-3.5 font-mono text-[10px]">{s.sessionId}</td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">{staffMap.get(s.originalStaffId) || s.originalStaffId}</td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">{staffMap.get(s.substituteStaffId) || s.substituteStaffId}</td>
                    <td className="px-6 py-3.5 capitalize">{s.reason}</td>
                    <td className="px-6 py-3.5 capitalize">{s.substitutionStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'missing_timesheets' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-6 py-3">Staff Member</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Primary Role</th>
                  <th className="px-6 py-3">Unsubmitted Period</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {staff
                  .filter(s => {
                    const hasWork = records.some(r => r.staffId === s.id && r.workDate >= startDate && r.workDate <= endDate);
                    const hasSubmitted = timesheets.some(t => t.staffId === s.id && t.periodStart <= endDate && t.periodEnd >= startDate && t.timesheetStatus !== 'draft');
                    return hasWork && !hasSubmitted;
                  })
                  .map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3.5 font-bold text-slate-900">{s.firstName} {s.lastName}</td>
                      <td className="px-6 py-3.5 text-slate-500">{s.email || '-'}</td>
                      <td className="px-6 py-3.5">{s.role || 'Staff'}</td>
                      <td className="px-6 py-3.5 text-slate-700">{startDate} &rarr; {endDate}</td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Timesheet Overdue
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {reportType === 'programme_workload' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-6 py-3">Programme</th>
                  <th className="px-6 py-3">Active Teachers Assigned</th>
                  <th className="px-6 py-3">Teaching Hours</th>
                  <th className="px-6 py-3">Work Minutes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {programmes.map(p => {
                  const progAssignments = assignments.filter(a => a.programmeId === p.id && a.assignmentStatus === 'active');
                  const progRecords = records.filter(r => r.programmeId === p.id && r.workDate >= startDate && r.workDate <= endDate);
                  const totalMin = progRecords.reduce((sum, r) => sum + r.durationMinutes, 0);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3.5 font-bold text-slate-900">{p.name}</td>
                      <td className="px-6 py-3.5 font-semibold text-slate-800">{progAssignments.length} assigned</td>
                      <td className="px-6 py-3.5 font-bold text-indigo-700">{timesheetService.formatDuration(totalMin)}</td>
                      <td className="px-6 py-3.5 text-slate-500">{totalMin} mins</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
