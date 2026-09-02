import React, { useState } from 'react';
import { FileText, Plus, Search, Filter, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStaffTimesheets } from '../../hooks/useStaffTimesheets';
import { useStaff } from '../../hooks/useStaff';
import { CreateTimesheetModal } from './components/CreateTimesheetModal';
import { timesheetService } from '../../services/timesheetService';
import type { TimesheetStatus } from '../../types';

export const StaffTimesheetsPage: React.FC = () => {
  const { timesheets, loading, createDraftTimesheet, submitTimesheet } = useStaffTimesheets();
  const { staff } = useStaff();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const staffMap = new Map(staff.map(s => [s.id, `${s.firstName} ${s.lastName}`]));

  const formatStatusBadge = (status: TimesheetStatus) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Approved</span>;
      case 'verified':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">Verified</span>;
      case 'submitted':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">Submitted</span>;
      case 'under_review':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Under Review</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">Draft</span>;
    }
  };

  const filtered = timesheets.filter(t => {
    if (selectedStatus !== 'all' && t.timesheetStatus !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const sName = (staffMap.get(t.staffId) || '').toLowerCase();
      const notes = (t.notes || '').toLowerCase();
      return sName.includes(q) || notes.includes(q) || t.periodStart.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Staff Timesheets
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Periodic timesheet submission, verification, and approval workflow.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Generate Timesheet
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search timesheets by staff name, date, or notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="verified">Verified</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Timesheets List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading timesheets...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No timesheets found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Staff Member</th>
                  <th className="px-6 py-3">Period</th>
                  <th className="px-6 py-3">Total Hours</th>
                  <th className="px-6 py-3">Entries</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-900">
                      {staffMap.get(t.staffId) || t.staffId}
                      {t.notes && <div className="text-[10px] text-slate-400 font-normal line-clamp-1">{t.notes}</div>}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-600">
                      <div className="flex items-center gap-1 font-semibold">
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
                    <td className="px-6 py-3.5">
                      {formatStatusBadge(t.timesheetStatus)}
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap space-x-2">
                      {t.timesheetStatus === 'draft' && (
                        <button
                          onClick={() => submitTimesheet(t.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                        >
                          Submit
                        </button>
                      )}
                      <Link
                        to={`/staff-operations/timesheets/${t.id}`}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 inline-flex items-center gap-1"
                      >
                        Inspect <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateTimesheetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={createDraftTimesheet}
      />
    </div>
  );
};
