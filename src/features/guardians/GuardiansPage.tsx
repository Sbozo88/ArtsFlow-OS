import React, { useState } from 'react';
import { useGuardians } from '../../hooks/useGuardians';
import { useAuth } from '../../contexts/AuthContext';
import { guardianService } from '../../services/guardianService';
import { Plus, Search, Trash2, Edit } from 'lucide-react';

export const GuardiansPage: React.FC = () => {
  const { guardians, loading, error } = useGuardians();
  const { authUser, organisationId } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const filteredGuardians = guardians.filter(g => 
    g.status === statusFilter &&
    (g.firstName.toLowerCase().includes(search.toLowerCase()) || 
     g.lastName.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !authUser) return;
    setFormLoading(true);
    try {
      await guardianService.createGuardian(organisationId, authUser.uid, {
        firstName,
        lastName,
        mobileNumber,
        email
      });
      setIsModalOpen(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to create guardian');
    } finally {
      setFormLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!organisationId || !authUser) return;
    if (confirm('Are you sure you want to archive this guardian?')) {
      try {
        await guardianService.archiveGuardian(organisationId, authUser.uid, id);
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert('Failed to archive guardian');
      }
    }
  };

  if (loading) return <div className="p-8">Loading guardians...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Guardians</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Guardian
        </button>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search guardians..." 
            className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-md"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
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

      {filteredGuardians.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200 text-slate-500">
          No guardians found.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-medium text-slate-600">Name</th>
                <th className="p-4 font-medium text-slate-600">Contact</th>
                <th className="p-4 font-medium text-slate-600">Status</th>
                <th className="p-4 font-medium text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuardians.map(g => (
                <tr key={g.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800">{g.firstName} {g.lastName}</td>
                  <td className="p-4 text-slate-600">
                    <div>{g.mobileNumber}</div>
                    <div className="text-sm text-slate-400">{g.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      {g.status}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button className="text-slate-400 hover:text-indigo-600 p-1"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleArchive(g.id)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
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
            <h2 className="text-xl font-bold mb-4">Add Guardian</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input required type="text" className="w-full border border-gray-300 rounded p-2" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input required type="text" className="w-full border border-gray-300 rounded p-2" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                <input required type="tel" className="w-full border border-gray-300 rounded p-2" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full border border-gray-300 rounded p-2" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" disabled={formLoading} className="btn btn-primary disabled:opacity-50">
                  {formLoading ? 'Saving...' : 'Save Guardian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
