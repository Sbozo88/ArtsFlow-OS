import React, { useState } from 'react';
import { useFollowUps } from '../../hooks/useFollowUps';
import { useLearners } from '../../hooks/useLearners';
import { useStaff } from '../../hooks/useStaff';
import { useAuth } from '../../contexts/AuthContext';
import { followUpService } from '../../services/followUpService';
import type { FollowUpCategory, FollowUpPriority, FollowUpStatus } from '../../types';
import { Plus, Search, CheckCircle2, Clock, CircleDot } from 'lucide-react';

export const FollowUpsPage: React.FC = () => {
  const { followUps, loading, error } = useFollowUps();
  const { learners } = useLearners();
  const { staff } = useStaff();
  const { authUser, organisationId } = useAuth();

  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [completeModal, setCompleteModal] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');

  // Form state
  const [learnerId, setLearnerId] = useState('');
  const [category, setCategory] = useState<FollowUpCategory>('general');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<FollowUpPriority>('normal');
  const [formLoading, setFormLoading] = useState(false);

  const categories: FollowUpCategory[] = ['attendance', 'payment', 'behaviour', 'instrument', 'consent', 'parent_contact', 'event', 'general'];
  const priorities: FollowUpPriority[] = ['low', 'normal', 'high', 'urgent'];
  const statuses: FollowUpStatus[] = ['open', 'in_progress', 'waiting', 'completed', 'cancelled'];

  const filtered = followUps.filter(f => {
    const learner = learners.find(l => l.id === f.learnerId);
    const matchesStatus = f.followUpStatus === statusFilter;
    const matchesCategory = categoryFilter === 'All' || f.category === categoryFilter;
    const matchesPriority = priorityFilter === 'All' || f.priority === priorityFilter;
    const matchesSearch = !search || f.subject.toLowerCase().includes(search.toLowerCase()) ||
      (learner && `${learner.firstName} ${learner.lastName}`.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesCategory && matchesPriority && matchesSearch;
  }).sort((a, b) => {
    const pOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    return (pOrder[a.priority] || 2) - (pOrder[b.priority] || 2);
  });

  const handleCreate = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!organisationId || !authUser) return;
    setFormLoading(true);
    try {
      await followUpService.createFollowUp(organisationId, authUser.uid, {
        learnerId: learnerId || undefined,
        category,
        subject,
        description,
        ownerId: ownerId || authUser.uid,
        dueDate: dueDate || undefined,
        priority,
      });
      setIsModalOpen(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to create follow-up');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: FollowUpStatus) => {
    if (!organisationId || !authUser) return;
    try {
      await followUpService.updateFollowUp(organisationId, authUser.uid, id, { followUpStatus: newStatus });
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to update follow-up');
    }
  };

  const handleComplete = async (id: string) => {
    if (!organisationId || !authUser || !resolution) return;
    setFormLoading(true);
    try {
      await followUpService.completeFollowUp(organisationId, authUser.uid, id, resolution);
      setCompleteModal(null);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to complete follow-up');
    } finally {
      setFormLoading(false);
    }
  };

  const priorityBadge = (p: string) => {
    switch (p) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'normal': return 'bg-blue-100 text-blue-700';
      case 'low': return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  if (loading) return <div className="p-8">Loading follow-ups...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Follow-Ups</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Follow-Up
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-lg shadow-sm border border-slate-200">
        {statuses.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusFilter === s ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-md" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border border-slate-300 rounded-md px-4 py-2">
          <option value="All">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="border border-slate-300 rounded-md px-4 py-2">
          <option value="All">All Priorities</option>
          {priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200 text-slate-500">No follow-ups found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(f => {
            const learner = learners.find(l => l.id === f.learnerId);
            const owner = staff.find(s => s.id === f.ownerId);

            return (
              <div key={f.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge(f.priority)}`}>{f.priority}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{f.category}</span>
                    </div>
                    <h3 className="font-medium text-slate-800">{f.subject}</h3>
                    <p className="text-sm text-slate-500 mt-1">{f.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-2">
                      {learner && <span>Learner: {learner.firstName} {learner.lastName}</span>}
                      {owner && <span>Owner: {owner.firstName} {owner.lastName}</span>}
                      {f.dueDate && <span>Due: {f.dueDate}</span>}
                    </div>
                  </div>
                  <div className="flex items-start gap-1">
                    {f.followUpStatus === 'open' && (
                      <button onClick={() => handleStatusChange(f.id, 'in_progress')} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100" title="Start"><CircleDot className="w-3 h-3 inline mr-1" />Start</button>
                    )}
                    {(f.followUpStatus === 'open' || f.followUpStatus === 'in_progress') && (
                      <button onClick={() => handleStatusChange(f.id, 'waiting')} className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100" title="Wait"><Clock className="w-3 h-3 inline mr-1" />Wait</button>
                    )}
                    {f.followUpStatus !== 'completed' && f.followUpStatus !== 'cancelled' && (
                      <button onClick={() => { setCompleteModal(f.id); setResolution(''); }} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100" title="Complete"><CheckCircle2 className="w-3 h-3 inline mr-1" />Done</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Follow-Up</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select required className="w-full border border-gray-300 rounded p-2" value={category} onChange={e => setCategory(e.target.value as FollowUpCategory)}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input required type="text" className="w-full border border-gray-300 rounded p-2" value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea required className="w-full border border-gray-300 rounded p-2" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Learner</label>
                <select className="w-full border border-gray-300 rounded p-2" value={learnerId} onChange={e => setLearnerId(e.target.value)}>
                  <option value="">None</option>
                  {learners.map(l => <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                <select className="w-full border border-gray-300 rounded p-2" value={ownerId} onChange={e => setOwnerId(e.target.value)}>
                  <option value="">Me</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" className="w-full border border-gray-300 rounded p-2" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                  <select required className="w-full border border-gray-300 rounded p-2" value={priority} onChange={e => setPriority(e.target.value as FollowUpPriority)}>
                    {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" disabled={formLoading} className="btn btn-primary disabled:opacity-50">
                  {formLoading ? 'Saving...' : 'Create Follow-Up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {completeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Complete Follow-Up</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resolution *</label>
              <textarea required className="w-full border border-gray-300 rounded p-2" value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Describe how this was resolved..." />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setCompleteModal(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
              <button onClick={() => handleComplete(completeModal)} disabled={!resolution || formLoading} className="btn btn-primary disabled:opacity-50">
                {formLoading ? 'Completing...' : 'Mark Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
