import React, { useState } from 'react';
import { useSessions } from '../../hooks/useSessions';
import { useProgrammes } from '../../hooks/useProgrammes';
import { useProgrammeGroups } from '../../hooks/useProgrammeGroups';
import { useStaff } from '../../hooks/useStaff';
import { useAuth } from '../../contexts/AuthContext';
import { sessionService } from '../../services/sessionService';
import type { SessionType, SessionStatus } from '../../types';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Clock, MapPin, Edit, XCircle } from 'lucide-react';

export const SessionsPage: React.FC = () => {
  const { sessions, loading, error } = useSessions();
  const { programmes } = useProgrammes();
  const { groups } = useProgrammeGroups();
  const { staff } = useStaff();
  const { authUser, organisationId } = useAuth();


  const [groupFilter, setGroupFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('scheduled');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [groupId, setGroupId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [venue, setVenue] = useState('');
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [sessionType, setSessionType] = useState<SessionType>('lesson');
  const [notes, setNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const sessionTypes: SessionType[] = ['lesson', 'rehearsal', 'workshop', 'performance', 'assessment', 'audition'];

  const filteredSessions = sessions.filter(s =>
    s.sessionStatus === statusFilter &&
    (groupFilter === 'All' || s.groupId === groupFilter)
  ).sort((a, b) => b.date.localeCompare(a.date));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !authUser) return;
    setFormLoading(true);
    try {
      await sessionService.createSession(organisationId, authUser.uid, {
        groupId,
        date,
        startTime,
        endTime,
        venue: venue || undefined,
        teacherIds,
        sessionType,
        notes: notes || undefined,
      });
      setIsModalOpen(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to create session');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: SessionStatus) => {
    if (!organisationId || !authUser) return;
    try {
      await sessionService.updateSessionStatus(organisationId, authUser.uid, id, status);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to update session');
    }
  };

  if (loading) return <div className="p-8">Loading sessions...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Sessions</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Session
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="border border-slate-300 rounded-md px-4 py-2">
          <option value="All">All Groups</option>
          {groups.map(g => {
            const prog = programmes.find(p => p.id === g.programmeId);
            return <option key={g.id} value={g.id}>{prog?.name} — {g.name}</option>;
          })}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-slate-300 rounded-md px-4 py-2">
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="postponed">Postponed</option>
        </select>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200 text-slate-500">No sessions found.</div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map(s => {
            const group = groups.find(g => g.id === s.groupId);
            const programme = programmes.find(p => p.id === group?.programmeId);
            const teachers = staff.filter(st => s.teacherIds.includes(st.id));

            return (
              <div key={s.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div className="flex-1">
                    <Link to={`/sessions/${s.id}`} className="text-lg font-medium text-indigo-600 hover:text-indigo-500">
                      {programme?.name} — {group?.name}
                    </Link>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {s.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {s.startTime} – {s.endTime}</span>
                      {s.venue && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {s.venue}</span>}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      {teachers.map(t => `${t.firstName} ${t.lastName}`).join(', ') || 'No teacher assigned'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      s.sessionStatus === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                      s.sessionStatus === 'completed' ? 'bg-green-100 text-green-700' :
                      s.sessionStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{s.sessionStatus}</span>
                    <Link to={`/sessions/${s.id}`} className="text-slate-400 hover:text-indigo-600 p-1"><Edit className="w-4 h-4" /></Link>
                    {s.sessionStatus === 'scheduled' && (
                      <button onClick={() => handleStatusChange(s.id, 'cancelled')} className="text-slate-400 hover:text-red-600 p-1"><XCircle className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Session</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group *</label>
                <select required className="w-full border border-gray-300 rounded p-2" value={groupId} onChange={e => setGroupId(e.target.value)}>
                  <option value="" disabled>Select Group</option>
                  {groups.map(g => {
                    const prog = programmes.find(p => p.id === g.programmeId);
                    return <option key={g.id} value={g.id}>{prog?.name} — {g.name}</option>;
                  })}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input required type="date" className="w-full border border-gray-300 rounded p-2" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select required className="w-full border border-gray-300 rounded p-2" value={sessionType} onChange={e => setSessionType(e.target.value as SessionType)}>
                    {sessionTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <input required type="time" className="w-full border border-gray-300 rounded p-2" value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <input required type="time" className="w-full border border-gray-300 rounded p-2" value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                <input type="text" className="w-full border border-gray-300 rounded p-2" value={venue} onChange={e => setVenue(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teachers</label>
                <select multiple className="w-full border border-gray-300 rounded p-2 h-24" value={teacherIds} onChange={e => setTeacherIds(Array.from(e.target.selectedOptions, o => o.value))}>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                </select>
                <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea className="w-full border border-gray-300 rounded p-2" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" disabled={formLoading} className="btn btn-primary disabled:opacity-50">
                  {formLoading ? 'Saving...' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
