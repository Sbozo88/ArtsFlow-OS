/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Session, Group, SessionType } from '../../types';
import { sessionService } from '../../services/sessionService';
import { groupService } from '../../services/groupService';
import { useAuth } from '../../contexts/AuthContext';

export function SessionsPage() {
  const { organizationId, user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [sessionType, setSessionType] = useState<SessionType>('Lesson');

  const loadGroups = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const data = await groupService.getGroups(organizationId);
      setGroups(data);
      if (data.length > 0 && !selectedGroup) {
        setSelectedGroup(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load groups', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [organizationId]);

  const loadSessions = async () => {
    if (!selectedGroup || !organizationId) return;
    setLoading(true);
    try {
      const data = await sessionService.getGroupSessions(organizationId, selectedGroup);
      setSessions(data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    } catch (error) {
      console.error('Failed to load sessions', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [selectedGroup, organizationId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !date || !startTime || !endTime || !organizationId || !user) return;

    try {
      await sessionService.createSession(organizationId, user.uid, {
        groupId: selectedGroup,
        date,
        startTime,
        endTime,
        sessionType,
        teacherIds: [user.uid],
      });
      setIsCreating(false);
      setDate('');
      setStartTime('');
      setEndTime('');
      loadSessions();
    } catch (error) {
      console.error('Failed to create session', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Sessions</h1>
        <Button onClick={() => setIsCreating(!isCreating)} disabled={groups.length === 0}>
          {isCreating ? 'Cancel' : 'Add Session'}
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <label className="text-sm font-medium text-slate-700 w-24">Group:</label>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="flex h-10 w-full max-w-sm rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        >
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name} ({g.groupType})</option>
          ))}
        </select>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">New Session</h2>
          <form onSubmit={handleCreate} className="space-y-4 max-w-md">
            <Input 
              label="Date" 
              type="date"
              value={date} 
              onChange={e => setDate(e.target.value)} 
              required 
            />
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Start Time" 
                type="time"
                value={startTime} 
                onChange={e => setStartTime(e.target.value)} 
                required 
              />
              <Input 
                label="End Time" 
                type="time"
                value={endTime} 
                onChange={e => setEndTime(e.target.value)} 
                required 
              />
            </div>
            
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-slate-700">Type</label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as SessionType)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="Lesson">Lesson</option>
                <option value="Rehearsal">Rehearsal</option>
                <option value="Workshop">Workshop</option>
                <option value="Performance">Performance</option>
                <option value="Assessment">Assessment</option>
                <option value="Audition">Audition</option>
              </select>
            </div>

            <div className="pt-2">
              <Button type="submit">Save Session</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading sessions...</div>
        ) : !selectedGroup ? (
          <div className="p-8 text-center text-slate-500">
            Please select or create a group first.
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No sessions scheduled for this group. Click "Add Session" to create one.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Time</th>
                <th className="px-6 py-3 font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(session => (
                <tr key={session.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {session.date}
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {session.startTime} - {session.endTime}
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      {session.sessionType}
                    </span>
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
