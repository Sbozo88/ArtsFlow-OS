import React, { useState } from 'react';
import { useProgrammeGroups } from '../../hooks/useProgrammeGroups';
import { useProgrammes } from '../../hooks/useProgrammes';
import { useStaff } from '../../hooks/useStaff';
import { useAuth } from '../../contexts/AuthContext';
import { programmeGroupService } from '../../services/programmeGroupService';
import { Plus, Search, Trash2, Edit } from 'lucide-react';

export const GroupsPage: React.FC = () => {
  const { groups, loading: loadingGroups, error: errorGroups } = useProgrammeGroups();
  const { programmes, loading: loadingProgrammes } = useProgrammes();
  const { staff, loading: loadingStaff } = useStaff();
  
  const { authUser, organisationId } = useAuth();
  
  const [search, setSearch] = useState('');
  const [programmeFilter, setProgrammeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('active');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [groupType, setGroupType] = useState('class');
  const [programmeId, setProgrammeId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [capacity, setCapacity] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const groupTypes = ['class', 'ensemble', 'orchestra', 'band', 'choir', 'dance_group', 'rehearsal_group', 'private_lesson', 'workshop'];

  const loading = loadingGroups || loadingProgrammes || loadingStaff;
  const error = errorGroups;

  const filteredGroups = groups.filter(g => 
    g.status === statusFilter &&
    (programmeFilter === 'All' || g.programmeId === programmeFilter) &&
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !authUser) return;
    setFormLoading(true);
    try {
      await programmeGroupService.createGroup(organisationId, authUser.uid, {
        name,
        groupType,
        programmeId,
        teacherId: teacherId || undefined,
        capacity: capacity ? parseInt(capacity, 10) : undefined
      });
      setIsModalOpen(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to add group');
    } finally {
      setFormLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!organisationId || !authUser) return;
    if (confirm('Are you sure you want to archive this group?')) {
      try {
        await programmeGroupService.archiveGroup(organisationId, authUser.uid, id);
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert('Failed to archive group');
      }
    }
  };

  if (loading) return <div className="p-8">Loading groups...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Groups & Classes</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Group
        </button>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search groups..." 
            className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-md"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select 
          value={programmeFilter}
          onChange={e => setProgrammeFilter(e.target.value)}
          className="border border-slate-300 rounded-md px-4 py-2"
        >
          <option value="All">All Programmes</option>
          {programmes.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select 
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-slate-300 rounded-md px-4 py-2"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200 text-slate-500">
          No groups found.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-medium text-slate-600">Name</th>
                <th className="p-4 font-medium text-slate-600">Programme</th>
                <th className="p-4 font-medium text-slate-600">Teacher</th>
                <th className="p-4 font-medium text-slate-600">Capacity</th>
                <th className="p-4 font-medium text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map(g => {
                const prog = programmes.find(p => p.id === g.programmeId);
                const teacher = staff.find(s => s.id === g.teacherId);
                
                return (
                  <tr key={g.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{g.name}</div>
                      <div className="text-xs text-slate-500 uppercase">{g.groupType.replace('_', ' ')}</div>
                    </td>
                    <td className="p-4 text-slate-600">{prog?.name || 'Unknown'}</td>
                    <td className="p-4 text-slate-600">{teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unassigned'}</td>
                    <td className="p-4 text-slate-600">{g.capacity || '-'}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button className="text-slate-400 hover:text-indigo-600 p-1"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleArchive(g.id)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add Group / Class</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Programme *</label>
                <select required className="w-full border border-gray-300 rounded p-2" value={programmeId} onChange={e => setProgrammeId(e.target.value)}>
                  <option value="" disabled>Select Programme</option>
                  {programmes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input required type="text" className="w-full border border-gray-300 rounded p-2" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Type *</label>
                <select required className="w-full border border-gray-300 rounded p-2" value={groupType} onChange={e => setGroupType(e.target.value)}>
                  {groupTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                <select className="w-full border border-gray-300 rounded p-2" value={teacherId} onChange={e => setTeacherId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input type="number" className="w-full border border-gray-300 rounded p-2" value={capacity} onChange={e => setCapacity(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" disabled={formLoading} className="btn btn-primary disabled:opacity-50">
                  {formLoading ? 'Saving...' : 'Save Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
