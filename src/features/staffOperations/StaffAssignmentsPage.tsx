import React, { useState } from 'react';
import { Briefcase, Plus, Search, Filter, Calendar } from 'lucide-react';
import { useStaffAssignments } from '../../hooks/useStaffAssignments';
import { useStaff } from '../../hooks/useStaff';
import { useProgrammes } from '../../hooks/useProgrammes';
import { AssignmentModal } from './components/AssignmentModal';
import type { AssignmentRole } from '../../types';

export const StaffAssignmentsPage: React.FC = () => {
  const { assignments, loading, createAssignment, endAssignment } = useStaffAssignments();
  const { staff } = useStaff();
  const { programmes } = useProgrammes();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Lookup maps
  const staffMap = new Map(staff.map(s => [s.id, `${s.firstName} ${s.lastName}`]));
  const programmeMap = new Map(programmes.map(p => [p.id, p.name]));

  const formatRoleLabel = (role: AssignmentRole): string => {
    switch (role) {
      case 'lead_teacher': return 'Lead Teacher';
      case 'assistant_teacher': return 'Assistant Teacher';
      case 'conductor': return 'Conductor';
      case 'dance_teacher': return 'Dance Teacher';
      case 'coach': return 'Coach / Tutor';
      case 'accompanist': return 'Accompanist';
      case 'supervisor': return 'Supervisor';
      case 'programme_director': return 'Programme Director';
      case 'administrator': return 'Administrator';
      case 'volunteer': return 'Volunteer';
      case 'substitute': return 'Substitute';
      default: return 'Other Role';
    }
  };

  const filtered = assignments.filter(a => {
    if (selectedStatus !== 'all' && a.assignmentStatus !== selectedStatus) return false;
    if (selectedRole !== 'all' && a.role !== selectedRole) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const sName = (staffMap.get(a.staffId) || '').toLowerCase();
      const pName = (a.programmeId ? (programmeMap.get(a.programmeId) || '') : '').toLowerCase();
      const notes = (a.notes || '').toLowerCase();
      return sName.includes(q) || pName.includes(q) || notes.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-600" />
            Staff Assignments Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Operational roles across educational programmes, ensemble groups, and production events.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Assignment
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by staff name, programme, or notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Role:</span>
          </div>
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none"
          >
            <option value="all">All Roles</option>
            <option value="lead_teacher">Lead Teacher</option>
            <option value="assistant_teacher">Assistant Teacher</option>
            <option value="conductor">Conductor</option>
            <option value="dance_teacher">Dance Teacher</option>
            <option value="accompanist">Accompanist</option>
            <option value="coach">Coach</option>
            <option value="supervisor">Supervisor</option>
            <option value="programme_director">Programme Director</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading assignments...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No staff assignments found matching your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Staff Member</th>
                  <th className="px-6 py-3">Operational Role</th>
                  <th className="px-6 py-3">Scope / Target</th>
                  <th className="px-6 py-3">Period</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-bold text-slate-900">
                        {staffMap.get(item.staffId) || item.staffId}
                      </div>
                      {item.isPrimary && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] bg-indigo-50 text-indigo-700 font-semibold">
                          Primary Lead
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800">
                        {formatRoleLabel(item.role)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      {item.groupId && (
                        <div>Class: <span className="font-semibold text-slate-800">{item.groupId}</span></div>
                      )}
                      {item.programmeId && (
                        <div className="text-slate-500 text-[11px]">{programmeMap.get(item.programmeId) || item.programmeId}</div>
                      )}
                      {item.notes && (
                        <div className="text-slate-400 text-[10px] mt-0.5 line-clamp-1">{item.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{item.startDate}</span>
                        {item.endDate && <span>&rarr; {item.endDate}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      {item.assignmentStatus === 'active' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      )}
                      {item.assignmentStatus === 'completed' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                          Completed
                        </span>
                      )}
                      {item.assignmentStatus === 'cancelled' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700">
                          Cancelled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {item.assignmentStatus === 'active' && (
                        <button
                          onClick={() => endAssignment(item.id, 'completed')}
                          className="text-xs text-rose-600 hover:text-rose-900 font-semibold"
                        >
                          End Assignment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (input) => {
          await createAssignment(input);
        }}
      />
    </div>
  );
};
