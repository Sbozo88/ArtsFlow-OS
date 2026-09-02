import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProgrammeGroups } from '../../hooks/useProgrammeGroups';
import { useProgrammes } from '../../hooks/useProgrammes';
import { useStaff } from '../../hooks/useStaff';
import { useGroupEnrolments } from '../../hooks/useGroupEnrolments';
import { useGroupSessions } from '../../hooks/useGroupSessions';
import { useLearners } from '../../hooks/useLearners';
import { ArrowLeft, Users, Calendar, Plus, MessageSquare } from 'lucide-react';

export const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { groups } = useProgrammeGroups();
  const { programmes } = useProgrammes();
  const { staff } = useStaff();
  const { learners } = useLearners();
  const { enrolments, loading: loadingEnrolments } = useGroupEnrolments(id);
  const { sessions, loading: loadingSessions } = useGroupSessions(id);

  const group = groups.find(g => g.id === id);
  const programme = programmes.find(p => p.id === group?.programmeId);
  const teacher = staff.find(s => s.id === group?.teacherId);

  const loading = loadingEnrolments || loadingSessions;

  if (!group) return <div className="p-8">Group not found.</div>;

  const activeEnrolments = enrolments.filter(e => e.enrolmentStatus === 'active');
  const upcomingSessions = sessions
    .filter(s => s.sessionStatus === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date));
  const pastSessions = sessions
    .filter(s => s.sessionStatus === 'completed')
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to="/groups" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Groups
      </Link>

      {/* Group Header */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="bg-indigo-600 px-6 py-6">
          <h1 className="text-2xl font-bold text-white">{group.name}</h1>
          <p className="text-indigo-200 mt-1">{programme?.name} • {group.groupType.replace('_', ' ')}</p>
        </div>
        <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Teacher</p>
            <p className="font-medium text-slate-800">{teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unassigned'}</p>
          </div>
          <div>
            <p className="text-slate-500">Capacity</p>
            <p className="font-medium text-slate-800">{group.capacity || 'Unlimited'}</p>
          </div>
          <div>
            <p className="text-slate-500">Enrolled</p>
            <p className="font-medium text-slate-800">{activeEnrolments.length}</p>
          </div>
          <div>
            <p className="text-slate-500">Venue</p>
            <p className="font-medium text-slate-800">{group.venue || '-'}</p>
          </div>
        </div>
      </div>

      {/* Enrolled Learners */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2"><Users className="w-5 h-5" /> Enrolled Learners</h3>
          <div className="flex items-center gap-3">
            <Link
              to={`/communication/compose?type=group&audience=group_guardians&groupId=${id}`}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 bg-indigo-50 px-2.5 py-1.5 rounded-md"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Message Group
            </Link>
            <Link to="/enrolments" className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Enrolment
            </Link>
          </div>
        </div>
        {loading ? (
          <div className="p-4 text-slate-500 text-sm">Loading...</div>
        ) : activeEnrolments.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">No learners enrolled.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {activeEnrolments.map(e => {
              const learner = learners.find(l => l.id === e.learnerId);
              return (
                <li key={e.id} className="px-4 py-3 flex justify-between items-center hover:bg-slate-50">
                  <div>
                    <Link to={`/learners/${e.learnerId}`} className="font-medium text-indigo-600 text-sm hover:underline">
                      {learner ? `${learner.firstName} ${learner.lastName}` : 'Unknown'}
                    </Link>
                    <p className="text-xs text-slate-500">Since {e.startDate}</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{e.enrolmentStatus}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-4 border-b border-slate-200">
          <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2"><Calendar className="w-5 h-5" /> Upcoming Sessions</h3>
        </div>
        {upcomingSessions.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">No upcoming sessions.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {upcomingSessions.slice(0, 5).map(s => (
              <li key={s.id} className="px-4 py-3 hover:bg-slate-50">
                <Link to={`/sessions/${s.id}`} className="flex justify-between items-center text-sm">
                  <span className="font-medium text-slate-700">{s.date} • {s.startTime} – {s.endTime}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{s.sessionType}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Past Sessions */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-4 border-b border-slate-200">
          <h3 className="text-lg font-medium text-slate-800">Past Sessions</h3>
        </div>
        {pastSessions.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">No past sessions.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pastSessions.slice(0, 10).map(s => (
              <li key={s.id} className="px-4 py-3 hover:bg-slate-50">
                <Link to={`/sessions/${s.id}`} className="flex justify-between items-center text-sm">
                  <span className="font-medium text-slate-700">{s.date} • {s.startTime} – {s.endTime}</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">completed</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
