import React, { useEffect, useState } from 'react';
import {
  FileText,
  Send,
  Trash2,
  Lock,
  Clock,
  User,
  AlertCircle
} from 'lucide-react';
import { founderNotesService } from '../../../services/platform/founderNotesService';
import { useAuth } from '../../../contexts/AuthContext';
import type { FounderCustomerNote, FounderNoteCategory } from '../../../types';

interface FounderNotesCardProps {
  organisationId: string;
}

export const FounderNotesCard: React.FC<FounderNotesCardProps> = ({ organisationId }) => {
  const { authUser, user } = useAuth();
  const [notes, setNotes] = useState<FounderCustomerNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [noteContent, setNoteContent] = useState('');
  const [category, setCategory] = useState<FounderNoteCategory>('commercial');
  const [submitting, setSubmitting] = useState(false);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = await founderNotesService.listNotes(organisationId);
      setNotes(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to load founder notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [organisationId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !noteContent.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const authorName = authUser.displayName || user?.displayName || authUser.email || 'Platform Super Admin';
      await founderNotesService.addNote(authUser.uid, authorName, organisationId, noteContent, category);
      setNoteContent('');
      await loadNotes();
    } catch (err) {
      setError((err as Error).message || 'Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveNote = async (noteId: string) => {
    if (!authUser) return;
    try {
      await founderNotesService.archiveNote(authUser.uid, noteId);
      await loadNotes();
    } catch (err) {
      setError((err as Error).message || 'Failed to archive note');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-white text-base">Founder Internal Customer Notes</h3>
          <div className="flex items-center gap-1 text-[10px] uppercase font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded ml-2">
            <Lock className="w-2.5 h-2.5" />
            <span>Platform Internal Only</span>
          </div>
        </div>
        <span className="text-xs text-slate-500">
          Never visible to school admins or users
        </span>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Note Form */}
      <form onSubmit={handleAddNote} className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-300">Add Founder Note</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as FounderNoteCategory)}
            className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 capitalize focus:outline-none"
          >
            <option value="commercial">Commercial / Pricing</option>
            <option value="sales">Sales & Discovery</option>
            <option value="onboarding">Onboarding Assistance</option>
            <option value="support">Operational Support</option>
            <option value="feedback">Product Feedback</option>
            <option value="general">General</option>
          </select>
        </div>

        <textarea
          rows={3}
          required
          placeholder="Record conversation insights, pilot feedback, or agreed custom arrangements..."
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !noteContent.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Saving...' : 'Post Internal Note'}</span>
          </button>
        </div>
      </form>

      {/* Notes List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-6 text-xs text-slate-500">Loading founder notes...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No founder internal notes recorded yet for this customer.
          </div>
        ) : (
          notes.map((n) => (
            <div
              key={n.id}
              className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-2 group hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-300 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    {n.authorName}
                  </span>
                  <span className="px-2 py-0.2 rounded text-[10px] font-bold uppercase bg-slate-900 text-indigo-400 border border-indigo-500/20">
                    {n.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(n.createdAt).toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={() => handleArchiveNote(n.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-all ml-1"
                    title="Archive Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {n.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
