import React from 'react';
import { useSessions } from '../../hooks/useSessions';
import { useEnrolments } from '../../hooks/useEnrolments';
import { useProgrammes } from '../../hooks/useProgrammes';
import { useProgrammeGroups } from '../../hooks/useProgrammeGroups';
import { useFollowUps } from '../../hooks/useFollowUps';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { sessions, loading: loadingSessions } = useSessions();
  const { enrolments } = useEnrolments();
  const { programmes } = useProgrammes();
  const { groups } = useProgrammeGroups();
  const { followUps } = useFollowUps();

  const loading = loadingSessions;

  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => s.date === today && s.sessionStatus !== 'cancelled');
  const upcomingSessions = sessions
    .filter(s => s.date >= today && s.sessionStatus === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .slice(0, 10);

  const openFollowUps = followUps.filter(f => f.followUpStatus === 'open' || f.followUpStatus === 'in_progress');

  if (loading) return <div className="p-8">Loading attendance overview...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Attendance Overview</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 text-center">
          <p className="text-2xl font-bold text-indigo-700">{todaySessions.length}</p>
          <p className="text-xs text-slate-500">Sessions Today</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 text-center">
          <p className="text-2xl font-bold text-green-700">{enrolments.filter(e => e.enrolmentStatus === 'active').length}</p>
          <p className="text-xs text-slate-500">Active Enrolments</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 text-center">
          <p className="text-2xl font-bold text-amber-700">{openFollowUps.length}</p>
          <p className="text-xs text-slate-500">Open Follow-Ups</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 text-center">
          <p className="text-2xl font-bold text-slate-700">{sessions.filter(s => s.sessionStatus === 'completed').length}</p>
          <p className="text-xs text-slate-500">Completed Sessions</p>
        </div>
      </div>

      {/* Today's Sessions */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" /> Today's Sessions
        </h3>
        {todaySessions.length === 0 ? (
          <p className="text-slate-500 text-sm">No sessions scheduled for today.</p>
        ) : (
          <div className="space-y-3">
            {todaySessions.map(s => {
              const group = groups.find(g => g.id === s.groupId);
              const programme = programmes.find(p => p.id === group?.programmeId);
              return (
                <Link key={s.id} to={`/sessions/${s.id}`} className="block p-3 rounded-lg border border-slate-100 hover:bg-indigo-50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-indigo-600">{programme?.name} — {group?.name}</p>
                      <p className="text-sm text-slate-500">{s.startTime} – {s.endTime} {s.venue ? `• ${s.venue}` : ''}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      s.sessionStatus === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>{s.sessionStatus}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-medium text-slate-800 mb-4">Upcoming Sessions</h3>
        {upcomingSessions.length === 0 ? (
          <p className="text-slate-500 text-sm">No upcoming sessions.</p>
        ) : (
          <div className="space-y-2">
            {upcomingSessions.map(s => {
              const group = groups.find(g => g.id === s.groupId);
              const programme = programmes.find(p => p.id === group?.programmeId);
              return (
                <Link key={s.id} to={`/sessions/${s.id}`} className="flex justify-between items-center text-sm p-2 rounded hover:bg-slate-50">
                  <span className="font-medium text-slate-700">{programme?.name} — {group?.name}</span>
                  <span className="text-slate-500">{s.date} • {s.startTime}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
