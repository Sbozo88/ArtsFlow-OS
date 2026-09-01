/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Group, Programme } from '../../types';
import { groupService } from '../../services/groupService';
import { programmeService } from '../../services/programmeService';
import { useAuth } from '../../contexts/AuthContext';

export function GroupsPage() {
  const { organizationId, user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [groupType, setGroupType] = useState('Class');
  const [maxCapacity, setMaxCapacity] = useState('');

  const loadData = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const [groupsData, programmesData] = await Promise.all([
        groupService.getGroups(organizationId),
        programmeService.getProgrammes(organizationId)
      ]);
      setGroups(groupsData);
      setProgrammes(programmesData);
    } catch (error) {
      console.error('Failed to load groups data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !programmeId || !groupType || !organizationId || !user) return;

    try {
      await groupService.createGroup(organizationId, user.uid, {
        name,
        programmeId,
        groupType,
        capacity: maxCapacity ? parseInt(maxCapacity) : undefined
      });
      setIsCreating(false);
      setName('');
      setProgrammeId('');
      setMaxCapacity('');
      setGroupType('Class');
      loadData();
    } catch (error) {
      console.error('Failed to create group', error);
    }
  };

  const getProgrammeName = (pId: string) => {
    return programmes.find(p => p.id === pId)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Groups & Classes</h1>
        <Button onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'Cancel' : 'Add Group'}
        </Button>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">New Group</h2>
          <form onSubmit={handleCreate} className="space-y-4 max-w-md">
            <Input 
              label="Group Name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
            />
            
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-slate-700">Programme</label>
              <select
                value={programmeId}
                onChange={(e) => setProgrammeId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                required
              >
                <option value="">Select Programme...</option>
                {programmes.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-slate-700">Group Type</label>
              <select
                value={groupType}
                onChange={(e) => setGroupType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="Class">Class</option>
                <option value="Ensemble">Ensemble</option>
                <option value="Orchestra">Orchestra</option>
                <option value="Band">Band</option>
                <option value="Choir">Choir</option>
                <option value="Dance Group">Dance Group</option>
                <option value="Rehearsal Group">Rehearsal Group</option>
              </select>
            </div>

            <div className="pt-2">
              <Button type="submit">Save Group</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <Input placeholder="Search groups..." className="max-w-sm" />
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading groups...</div>
        ) : groups.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No groups found. Click "Add Group" to create one.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Programme</th>
                <th className="px-6 py-3 font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(group => (
                <tr key={group.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {group.name}
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {getProgrammeName(group.programmeId)}
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      {group.groupType}
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
