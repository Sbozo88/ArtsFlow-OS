import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProgrammes } from '../../hooks/useProgrammes';
import { useProgrammeGroups } from '../../hooks/useProgrammeGroups';
import { useStaff } from '../../hooks/useStaff';
import { useLearners } from '../../hooks/useLearners';
import { sessionService } from '../../services/sessionService';
import { attendanceService } from '../../services/attendanceService';
import { enrolmentService } from '../../services/enrolmentService';
import type { Session, Enrolment, Attendance, AttendanceStatus } from '../../types';
import { ArrowLeft, CheckCircle2, XCircle, Clock, ShieldCheck, Save, UserCheck, AlertTriangle } from 'lucide-react';

interface AttendanceRow {
  learnerId: string;
  learnerName: string;
  attendanceStatus: AttendanceStatus;
  arrivalTime?: string;
  notes?: string;
  existingId?: string; // for updates
}

export const SessionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { authUser, organisationId } = useAuth();
  const { programmes } = useProgrammes();
  const { groups } = useProgrammeGroups();
  const { staff } = useStaff();
  const { learners } = useLearners();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load session and attendance data
  useEffect(() => {
    if (!organisationId || !id) return;
    let mounted = true;

    const load = async () => {
      try {
        const s = await sessionService.getSession(organisationId, id);
        if (!mounted || !s) { setLoading(false); return; }
        setSession(s);

        // Load enrolled learners for the group
        const enrolments = await enrolmentService.getActiveEnrolmentsByGroup(organisationId, s.groupId);

        // Load existing attendance
        const existingAttendance = await attendanceService.getSessionAttendance(organisationId, id);

        // Build rows: one per enrolled learner
        const rows: AttendanceRow[] = enrolments.map((e: Enrolment) => {
          const learner = learners.find(l => l.id === e.learnerId);
          const existing = existingAttendance.find((a: Attendance) => a.learnerId === e.learnerId);
          return {
            learnerId: e.learnerId,
            learnerName: learner ? `${learner.firstName} ${learner.lastName}` : 'Unknown Learner',
            attendanceStatus: existing?.attendanceStatus || 'present',
            arrivalTime: existing?.arrivalTime,
            notes: existing?.notes,
            existingId: existing?.id,
          };
        });

        if (mounted) setAttendanceRows(rows);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [organisationId, id, learners]);

  const markAll = (status: AttendanceStatus) => {
    setAttendanceRows(prev => prev.map(r => ({ ...r, attendanceStatus: status })));
    setSaved(false);
  };

  const updateRow = (learnerId: string, updates: Partial<AttendanceRow>) => {
    setAttendanceRows(prev => prev.map(r =>
      r.learnerId === learnerId ? { ...r, ...updates } : r
    ));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!organisationId || !authUser || !id) return;
    setSaving(true);
    try {
      await attendanceService.bulkMarkAttendance(
        organisationId,
        authUser.uid,
        id,
        attendanceRows.map(r => ({
          learnerId: r.learnerId,
          attendanceStatus: r.attendanceStatus,
          arrivalTime: r.arrivalTime,
          notes: r.notes,
        }))
      );
      setSaved(true);
    } catch (err) {
      console.error(err);
      alert('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading session...</div>;
  if (!session) return <div className="p-8">Session not found.</div>;

  const group = groups.find(g => g.id === session.groupId);
  const programme = programmes.find(p => p.id === group?.programmeId);
  const teachers = staff.filter(s => session.teacherIds.includes(s.id));

  const presentCount = attendanceRows.filter(r => r.attendanceStatus === 'present').length;
  const absentCount = attendanceRows.filter(r => r.attendanceStatus === 'absent').length;
  const lateCount = attendanceRows.filter(r => r.attendanceStatus === 'late').length;
  const excusedCount = attendanceRows.filter(r => r.attendanceStatus === 'excused').length;

  const statusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'absent': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'late': return <Clock className="w-5 h-5 text-amber-600" />;
      case 'excused': return <ShieldCheck className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to="/sessions" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Sessions
      </Link>

      {/* Session Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-slate-500 font-medium">Programme</p>
            <p className="text-slate-800 font-semibold">{programme?.name || '-'}</p>
          </div>
          <div>
            <p className="text-slate-500 font-medium">Group</p>
            <p className="text-slate-800 font-semibold">{group?.name || '-'}</p>
          </div>
          <div>
            <p className="text-slate-500 font-medium">Date</p>
            <p className="text-slate-800 font-semibold">{session.date}</p>
          </div>
          <div>
            <p className="text-slate-500 font-medium">Time</p>
            <p className="text-slate-800 font-semibold">{session.startTime} – {session.endTime}</p>
          </div>
          <div>
            <p className="text-slate-500 font-medium">Teacher</p>
            <p className="text-slate-800 font-semibold">{teachers.map(t => `${t.firstName} ${t.lastName}`).join(', ') || 'Unassigned'}</p>
          </div>
          <div>
            <p className="text-slate-500 font-medium">Venue</p>
            <p className="text-slate-800 font-semibold">{session.venue || '-'}</p>
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 text-center">
          <p className="text-2xl font-bold text-slate-800">{attendanceRows.length}</p>
          <p className="text-xs text-slate-500">Total</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-200 text-center">
          <p className="text-2xl font-bold text-green-700">{presentCount}</p>
          <p className="text-xs text-green-600">Present</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-200 text-center">
          <p className="text-2xl font-bold text-red-700">{absentCount}</p>
          <p className="text-xs text-red-600">Absent</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 shadow-sm border border-amber-200 text-center">
          <p className="text-2xl font-bold text-amber-700">{lateCount}</p>
          <p className="text-xs text-amber-600">Late</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-200 text-center">
          <p className="text-2xl font-bold text-blue-700">{excusedCount}</p>
          <p className="text-xs text-blue-600">Excused</p>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h3 className="text-lg font-medium text-slate-800">Mark Attendance</h3>
          <div className="flex gap-2">
            <button onClick={() => markAll('present')} className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Mark All Present
            </button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary text-sm flex items-center gap-1 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>

        {saved && (
          <div className="px-4 py-2 bg-green-50 border-b border-green-200 text-green-700 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Attendance saved successfully.
          </div>
        )}

        {attendanceRows.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
            No enrolled learners found for this group. Enrol learners first.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 font-medium text-slate-600 text-sm">Learner</th>
                  <th className="p-3 font-medium text-slate-600 text-sm">Status</th>
                  <th className="p-3 font-medium text-slate-600 text-sm hidden sm:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRows.map(row => (
                  <tr key={row.learnerId} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3">
                      <span className="font-medium text-slate-800 text-sm">{row.learnerName}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map(s => (
                          <button
                            key={s}
                            onClick={() => updateRow(row.learnerId, { attendanceStatus: s })}
                            className={`p-1.5 rounded-md transition-colors ${
                              row.attendanceStatus === s
                                ? s === 'present' ? 'bg-green-100 ring-2 ring-green-500'
                                : s === 'absent' ? 'bg-red-100 ring-2 ring-red-500'
                                : s === 'late' ? 'bg-amber-100 ring-2 ring-amber-500'
                                : 'bg-blue-100 ring-2 ring-blue-500'
                                : 'bg-slate-100 hover:bg-slate-200'
                            }`}
                            title={s}
                          >
                            {statusIcon(s)}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <input
                        type="text"
                        placeholder="Add note..."
                        className="text-sm border border-slate-200 rounded px-2 py-1 w-full"
                        value={row.notes || ''}
                        onChange={e => updateRow(row.learnerId, { notes: e.target.value })}
                      />
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
