import React, { useState } from 'react';
import { CalendarClock, Plus, Trash2, Clock } from 'lucide-react';
import { useStaffAvailability } from '../../hooks/useStaffAvailability';
import { useStaff } from '../../hooks/useStaff';
import { AvailabilityModal } from './components/AvailabilityModal';
import type { AvailabilityType } from '../../types';

export const StaffAvailabilityPage: React.FC = () => {
  const { staff } = useStaff();
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staff[0]?.id || '');
  const { availabilities, loading, setAvailability, removeAvailability } = useStaffAvailability(selectedStaffId);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const formatAvailabilityType = (type: AvailabilityType) => {
    switch (type) {
      case 'available':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Available</span>;
      case 'preferred':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">Preferred Hours</span>;
      case 'limited':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Limited Window</span>;
      case 'unavailable':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Unavailable / Blackout</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-indigo-600" />
            Staff Availability & Scheduling Preferences
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain recurring weekly timetables and specific blackout dates to prevent scheduling conflicts and streamline substitutions.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Set Availability
        </button>
      </div>

      {/* Staff Selector */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">View Staff Member:</label>
          <select
            value={selectedStaffId}
            onChange={e => setSelectedStaffId(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
          >
            {staff.map(s => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName} ({s.role || 'Staff'})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing {availabilities.length} schedule preferences
        </div>
      </div>

      {/* Availability List / Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading availability...</div>
        ) : availabilities.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <CalendarClock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No availability records configured for this staff member.
            <div className="mt-2 text-xs text-slate-500">Click &quot;Set Availability&quot; to define recurring days or blackout dates.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Schedule Scope</th>
                  <th className="px-6 py-3">Target Day / Date</th>
                  <th className="px-6 py-3">Time Window</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Reason / Context</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {availabilities.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-800">
                      {a.dayOfWeek !== undefined ? 'Weekly Recurring' : 'Single Date'}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900">
                      {a.dayOfWeek !== undefined ? daysOfWeek[a.dayOfWeek] : a.date}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-600">
                      {a.startTime && a.endTime ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{a.startTime} - {a.endTime}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">All Day</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      {formatAvailabilityType(a.availabilityType)}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {a.reason || a.notes || '-'}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => removeAvailability(a.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Remove Availability"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AvailabilityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (input) => {
          await setAvailability(input);
        }}
        preselectedStaffId={selectedStaffId}
      />
    </div>
  );
};
