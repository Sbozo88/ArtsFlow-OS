import React, { useState } from 'react';
import { useProgrammes } from '../../hooks/useProgrammes';
import { useAuth } from '../../contexts/AuthContext';
import { programmeService } from '../../services/programmeService';
import { Plus, Search, Trash2, Edit, Filter } from 'lucide-react';

export const ProgrammesPage: React.FC = () => {
  const { programmes, loading, error } = useProgrammes();
  const { authUser, organisationId } = useAuth();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('active');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [programmeType, setProgrammeType] = useState('Music');
  const [description, setDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const filteredProgrammes = programmes.filter(p => 
    p.status === statusFilter &&
    (typeFilter === 'All' || p.programmeType === typeFilter) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !authUser) return;
    setFormLoading(true);
    try {
      await programmeService.createProgramme(organisationId, authUser.uid, {
        name,
        programmeType,
        description
      });
      setIsModalOpen(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to add programme');
    } finally {
      setFormLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!organisationId || !authUser) return;
    if (confirm('Are you sure you want to archive this programme?')) {
      try {
        await programmeService.archiveProgramme(organisationId, authUser.uid, id);
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert('Failed to archive programme');
      }
    }
  };

  if (loading) return <div className="p-8">Loading programmes...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Programmes</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Programme
        </button>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search programmes..." 
            className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-md"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 border border-slate-300 rounded-md px-4 py-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="outline-none bg-transparent"
          >
            <option value="All">All Types</option>
            <option value="Music">Music</option>
            <option value="Dance">Dance</option>
            <option value="Other">Other</option>
          </select>
        </div>
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

      {filteredProgrammes.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200 text-slate-500">
          No programmes found.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-medium text-slate-600">Name</th>
                <th className="p-4 font-medium text-slate-600">Type</th>
                <th className="p-4 font-medium text-slate-600">Status</th>
                <th className="p-4 font-medium text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProgrammes.map(p => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800">{p.name}</td>
                  <td className="p-4 text-slate-600">{p.programmeType}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button className="text-slate-400 hover:text-indigo-600 p-1"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleArchive(p.id)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add Programme</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input required type="text" className="w-full border border-gray-300 rounded p-2" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select required className="w-full border border-gray-300 rounded p-2" value={programmeType} onChange={e => setProgrammeType(e.target.value)}>
                  <option value="Music">Music</option>
                  <option value="Dance">Dance</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="w-full border border-gray-300 rounded p-2" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" disabled={formLoading} className="btn btn-primary disabled:opacity-50">
                  {formLoading ? 'Saving...' : 'Save Programme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
