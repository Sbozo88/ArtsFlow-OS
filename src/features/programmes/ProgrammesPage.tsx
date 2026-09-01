/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { Programme, ProgrammeType } from '../../types';
import { programmeService } from '../../services/programmeService';
import { useAuth } from '../../contexts/AuthContext';

export function ProgrammesPage() {
  const { organizationId, user } = useAuth();
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<ProgrammeType>('Music');
  const [description, setDescription] = useState('');

  const loadProgrammes = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const data = await programmeService.getProgrammes(organizationId);
      setProgrammes(data);
    } catch (error) {
      console.error('Failed to load programmes', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgrammes();
  }, [organizationId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !type || !organizationId || !user) return;

    try {
      await programmeService.createProgramme(organizationId, user.uid, {
        name,
        type,
        description,
      });
      setIsCreating(false);
      setName('');
      setDescription('');
      setType('Music');
      loadProgrammes();
    } catch (error) {
      console.error('Failed to create programme', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Programmes</h1>
        <Button onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'Cancel' : 'Add Programme'}
        </Button>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">New Programme</h2>
          <form onSubmit={handleCreate} className="space-y-4 max-w-md">
            <Input 
              label="Programme Name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
            />
            
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-slate-700">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ProgrammeType)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="Music">Music</option>
                <option value="Dance">Dance</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <Input 
              label="Description" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
            />

            <div className="pt-2">
              <Button type="submit">Save Programme</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <Input placeholder="Search programmes..." className="max-w-sm" />
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading programmes...</div>
        ) : programmes.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No programmes found. Click "Add Programme" to create one.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {programmes.map(prog => (
                <tr key={prog.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {prog.name}
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {prog.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-600 truncate max-w-xs">
                    {prog.description || '-'}
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
