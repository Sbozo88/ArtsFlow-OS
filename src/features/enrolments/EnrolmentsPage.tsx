import React, { useState } from 'react';
import { useEnrolments } from '../../hooks/useEnrolments';
import { useLearners } from '../../hooks/useLearners';
import { useProgrammes } from '../../hooks/useProgrammes';
import { useProgrammeGroups } from '../../hooks/useProgrammeGroups';
import { useStaff } from '../../hooks/useStaff';
import { useAuth } from '../../contexts/AuthContext';
import { enrolmentService } from '../../services/enrolmentService';
import type { EnrolmentStatus } from '../../types';
import { Plus, Search, Pause, Play, CheckCircle, XCircle } from 'lucide-react';

export const EnrolmentsPage: React.FC = () => {
  const { enrolments, loading, error } = useEnrolments();
  const { learners } = useLearners();
  const { programmes } = useProgrammes();
  const { groups } = useProgrammeGroups();
  const { staff } = useStaff();
  const { authUser, organisationId } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [programmeFilter, setProgrammeFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [learnerId, setLearnerId] = useState('');
  const [selectedProgrammeId, setSelectedProgrammeId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formLoading, setFormLoading] = useState(false);

  const filteredGroups = selectedProgrammeId
    ? groups.filter(g => g.programmeId === selectedProgrammeId)
    : [];

  const filteredEnrolments = enrolments.filter(e => {
    const learner = learners.find(l => l.id === e.learnerId);
    const matchesStatus = e.enrolmentStatus === statusFilter;
    const matchesProgramme = programmeFilter === 'All' || e.programmeId === programmeFilter;
    const matchesSearch = !search || (learner &&
      `${learner.firstName} ${learner.lastName}`.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesProgramme && matchesSearch;
  });

  const handleCreate = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!organisationId || !authUser) return;
    setFormLoading(true);
    try {
      await enrolmentService.createEnrolment(organisationId, authUser.uid, {
        learnerId,
        groupId,
        startDate,
      });
      setIsModalOpen(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      const error = err as Error;
      alert(error.message || 'Failed to create enrolment');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: EnrolmentStatus) => {
    if (!organisationId || !authUser) return;
    try {
      await enrolmentService.updateEnrolmentStatus(organisationId, authUser.uid, id, status);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to update enrolment');
    }
  };

  if (loading) return <div className="p-8">Loading enrolments...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Enrolments</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Enrolment
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search learners..." className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-md" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={programmeFilter} onChange={e => setProgrammeFilter(e.target.value)} className="border border-slate-300 rounded-md px-4 py-2">
          <option value="All">All Programmes</option>
          {programmes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-slate-300 rounded-md px-4 py-2">
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>

      {filteredEnrolments.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200 text-slate-500">No enrolments found.</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-medium text-slate-600 text-sm">Learner</th>
                <th className="p-4 font-medium text-slate-600 text-sm">Programme</th>
                <th className="p-4 font-medium text-slate-600 text-sm">Group</th>
                <th className="p-4 font-medium text-slate-600 text-sm">Start Date</th>
                <th className="p-4 font-medium text-slate-600 text-sm">Status</th>
                <th className="p-4 font-medium text-slate-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnrolments.map(e => {
                const learner = learners.find(l => l.id === e.learnerId);
                const programme = programmes.find(p => p.id === e.programmeId);
                const group = groups.find(g => g.id === e.groupId);
                const teacher = staff.find(s => s.id === group?.teacherId);

                return (
                  <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800 text-sm">{learner ? `${learner.firstName} ${learner.lastName}` : 'Unknown'}</td>
                    <td className="p-4 text-slate-600 text-sm">{programme?.name || '-'}</td>
                    <td className="p-4 text-slate-600 text-sm">
                      <div>{group?.name || '-'}</div>
                      {teacher && <div className="text-xs text-slate-400">{teacher.firstName} {teacher.lastName}</div>}
                    </td>
                    <td className="p-4 text-slate-600 text-sm">{e.startDate}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        e.enrolmentStatus === 'active' ? 'bg-green-100 text-green-700' :
                        e.enrolmentStatus === 'paused' ? 'bg-amber-100 text-amber-700' :
                        e.enrolmentStatus === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>{e.enrolmentStatus}</span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        {e.enrolmentStatus === 'active' && (
                          <button onClick={() => handleStatusChange(e.id, 'paused')} className="text-slate-400 hover:text-amber-600 p-1" title="Pause"><Pause className="w-4 h-4" /></button>
                        )}
                        {e.enrolmentStatus === 'paused' && (
                          <button onClick={() => handleStatusChange(e.id, 'active')} className="text-slate-400 hover:text-green-600 p-1" title="Resume"><Play className="w-4 h-4" /></button>
                        )}
                        {(e.enrolmentStatus === 'active' || e.enrolmentStatus === 'paused') && (
                          <>
                            <button onClick={() => handleStatusChange(e.id, 'completed')} className="text-slate-400 hover:text-blue-600 p-1" title="Complete"><CheckCircle className="w-4 h-4" /></button>
                            <button onClick={() => handleStatusChange(e.id, 'withdrawn')} className="text-slate-400 hover:text-red-600 p-1" title="Withdraw"><XCircle className="w-4 h-4" /></button>
                          </>
                        )}
                      </div>
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add Enrolment</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Learner *</label>
                <select required className="w-full border border-gray-300 rounded p-2" value={learnerId} onChange={e => setLearnerId(e.target.value)}>
                  <option value="" disabled>Select Learner</option>
                  {learners.map(l => <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Programme *</label>
                <select required className="w-full border border-gray-300 rounded p-2" value={selectedProgrammeId} onChange={e => { setSelectedProgrammeId(e.target.value); setGroupId(''); }}>
                  <option value="" disabled>Select Programme</option>
                  {programmes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group *</label>
                <select required className="w-full border border-gray-300 rounded p-2" value={groupId} onChange={e => setGroupId(e.target.value)} disabled={!selectedProgrammeId}>
                  <option value="" disabled>{selectedProgrammeId ? 'Select Group' : 'Select a programme first'}</option>
                  {filteredGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input required type="date" className="w-full border border-gray-300 rounded p-2" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" disabled={formLoading} className="btn btn-primary disabled:opacity-50">
                  {formLoading ? 'Saving...' : 'Enrol Learner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
