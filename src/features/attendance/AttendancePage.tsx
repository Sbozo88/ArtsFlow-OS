/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import type { Session, Group, Learner, AttendanceStatus } from '../../types';
import { sessionService } from '../../services/sessionService';
import { groupService } from '../../services/groupService';
import { learnerService } from '../../services/learnerService';
import { enrolmentService } from '../../services/enrolmentService';
import { attendanceService } from '../../services/attendanceService';
import { useAuth } from '../../contexts/AuthContext';

export function AttendancePage() {
  const { organizationId, user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [sessionAttendances, setSessionAttendances] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGroups = async () => {
      if (!organizationId) return;
      setLoading(true);
      try {
        const data = await groupService.getGroups(organizationId);
        setGroups(data);
        if (data.length > 0) {
          setSelectedGroup(data[0].id);
        }
      } catch (error) {
        console.error('Failed to load groups', error);
      } finally {
        setLoading(false);
      }
    };
    loadGroups();
  }, [organizationId]);

  useEffect(() => {
    if (!selectedGroup || !organizationId) return;
    const loadSessionsAndEnrolments = async () => {
      try {
        const [sessData, enrolData, allLearners] = await Promise.all([
          sessionService.getGroupSessions(organizationId, selectedGroup),
          enrolmentService.getGroupEnrolments(organizationId, selectedGroup),
          learnerService.getLearners(organizationId)
        ]);
        setSessions(sessData);
        
        // Filter learners who are enrolled
        const enrolledIds = new Set(enrolData.map(e => e.learnerId));
        const enrolledLearners = allLearners.filter(l => enrolledIds.has(l.id));
        setLearners(enrolledLearners);

        if (sessData.length > 0) {
          setSelectedSession(sessData[0].id);
        } else {
          setSelectedSession('');
        }
      } catch (error) {
        console.error('Failed to load sessions', error);
      }
    };
    loadSessionsAndEnrolments();
  }, [selectedGroup, organizationId]);

  useEffect(() => {
    if (!selectedSession || !organizationId) {
      setSessionAttendances({});
      return;
    }
    const loadAttendance = async () => {
      try {
        const data = await attendanceService.getSessionAttendance(organizationId, selectedSession);
        const attMap: Record<string, string> = {};
        data.forEach(a => {
          attMap[a.learnerId] = a.attendanceStatus;
        });
        setSessionAttendances(attMap);
      } catch (error) {
        console.error('Failed to load attendance', error);
      }
    };
    loadAttendance();
  }, [selectedSession, organizationId]);

  const handleMarkAttendance = async (learnerId: string, status: AttendanceStatus) => {
    if (!selectedSession || !organizationId || !user) return;
    try {
      await attendanceService.markAttendance(
        organizationId,
        user.uid,
        selectedSession,
        learnerId,
        status
      );
      setSessionAttendances(prev => ({ ...prev, [learnerId]: status }));
    } catch (error) {
      console.error('Failed to mark attendance', error);
    }
  };

  const handleMarkAllPresent = async () => {
    for (const learner of learners) {
      if (!sessionAttendances[learner.id] || sessionAttendances[learner.id] !== 'Present') {
        await handleMarkAttendance(learner.id, 'Present');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
        <Button onClick={handleMarkAllPresent} disabled={!selectedSession || learners.length === 0}>
          Mark All Present
        </Button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-end">
        <div className="flex flex-col gap-1.5 w-1/3">
          <label className="text-sm font-medium text-slate-700">Group/Class</label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name} ({g.groupType})</option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-col gap-1.5 w-1/3">
          <label className="text-sm font-medium text-slate-700">Session</label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            disabled={sessions.length === 0}
          >
            {sessions.length === 0 && <option value="">No sessions available</option>}
            {sessions.map(s => (
              <option key={s.id} value={s.id}>{s.date} - {s.sessionType}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading data...</div>
        ) : !selectedSession ? (
          <div className="p-8 text-center text-slate-500">
            Please select a group and session to mark attendance. (You may need to create a session first).
          </div>
        ) : learners.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No learners enrolled in this group.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="px-6 py-3 font-medium">Learner</th>
                <th className="px-6 py-3 font-medium text-center">Present</th>
                <th className="px-6 py-3 font-medium text-center">Absent</th>
                <th className="px-6 py-3 font-medium text-center">Late</th>
                <th className="px-6 py-3 font-medium text-center">Excused</th>
              </tr>
            </thead>
            <tbody>
              {learners.map(learner => (
                <tr key={learner.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {learner.firstName} {learner.lastName}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <input 
                      type="radio" 
                      name={`att-${learner.id}`} 
                      checked={sessionAttendances[learner.id] === 'Present'}
                      onChange={() => handleMarkAttendance(learner.id, 'Present')}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                    />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <input 
                      type="radio" 
                      name={`att-${learner.id}`} 
                      checked={sessionAttendances[learner.id] === 'Absent'}
                      onChange={() => handleMarkAttendance(learner.id, 'Absent')}
                      className="w-4 h-4 text-rose-600 focus:ring-rose-500 cursor-pointer" 
                    />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <input 
                      type="radio" 
                      name={`att-${learner.id}`} 
                      checked={sessionAttendances[learner.id] === 'Late'}
                      onChange={() => handleMarkAttendance(learner.id, 'Late')}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500 cursor-pointer" 
                    />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <input 
                      type="radio" 
                      name={`att-${learner.id}`} 
                      checked={sessionAttendances[learner.id] === 'Excused'}
                      onChange={() => handleMarkAttendance(learner.id, 'Excused')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
