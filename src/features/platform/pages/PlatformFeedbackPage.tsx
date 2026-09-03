import React, { useEffect, useState, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Star,
  RefreshCw,
  AlertCircle,
  User,
  Mail
} from 'lucide-react';
import { feedbackService } from '../../../services/feedbackService';
import { useAuth } from '../../../contexts/AuthContext';
import type { CustomerFeedbackRecord, CustomerFeedbackStatus } from '../../../types';

export const PlatformFeedbackPage: React.FC = () => {
  const { authUser } = useAuth();
  const [feedback, setFeedback] = useState<CustomerFeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');

  const [selectedItem, setSelectedItem] = useState<CustomerFeedbackRecord | null>(null);
  const [internalNotes, setInternalNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  const loadFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await feedbackService.listAllFeedback();
      setFeedback(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to load customer feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const filteredItems = useMemo(() => {
    return feedback.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (ratingFilter !== 'all' && item.rating !== Number(ratingFilter)) return false;

      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        item.organisationName.toLowerCase().includes(q) ||
        item.comment.toLowerCase().includes(q) ||
        (item.submittedByName && item.submittedByName.toLowerCase().includes(q)) ||
        (item.improvements && item.improvements.toLowerCase().includes(q))
      );
    });
  }, [feedback, statusFilter, categoryFilter, ratingFilter, search]);

  const handleUpdateStatus = async (status: CustomerFeedbackStatus) => {
    if (!selectedItem || !authUser) return;
    setSavingStatus(true);
    try {
      await feedbackService.updateFeedbackStatus(authUser.uid, selectedItem.id, status, internalNotes);
      setSelectedItem((prev) => (prev ? { ...prev, status, internalNotes } : null));
      await loadFeedback();
    } catch (err) {
      setError((err as Error).message || 'Failed to update feedback status');
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-indigo-400" />
            <span>Pilot Customer Feedback</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Structured operational feedback, bug reports, and ratings from Founding Partners.
          </p>
        </div>
        <button
          type="button"
          onClick={loadFeedback}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by school, comment, submitter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="planned">Planned</option>
            <option value="resolved">Resolved</option>
            <option value="declined">Declined</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="music">Music</option>
            <option value="dance">Dance</option>
            <option value="learners">Learners</option>
            <option value="attendance">Attendance</option>
            <option value="finance">Finance</option>
            <option value="events">Events</option>
            <option value="parent_portal">Parent Portal</option>
            <option value="bug">Bug</option>
            <option value="missing_feature">Missing Feature</option>
          </select>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Main Grid: List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table / List */}
        <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/70 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-700/80 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Organisation</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Rating</th>
                  <th className="py-3.5 px-3">Comment Preview</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                      Loading pilot feedback...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No feedback matches the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setSelectedItem(item);
                        setInternalNotes(item.internalNotes || '');
                      }}
                      className={`hover:bg-slate-700/30 cursor-pointer transition-colors ${
                        selectedItem?.id === item.id ? 'bg-indigo-950/40 border-l-2 border-indigo-500' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-semibold text-white truncate max-w-[140px]">
                        {item.organisationName}
                      </td>
                      <td className="py-3.5 px-3 capitalize text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[11px]">
                          {item.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span className="font-bold">{item.rating}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 truncate max-w-[200px] text-slate-400">
                        {item.comment}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            item.status === 'resolved'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : item.status === 'planned'
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                              : item.status === 'reviewed'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-slate-700/30 text-slate-300 border-slate-600'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feedback Details Panel */}
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-5 space-y-4 shadow-xs">
          {selectedItem ? (
            <>
              <div className="flex items-start justify-between gap-3 border-b border-slate-700/60 pb-4">
                <div>
                  <h3 className="font-bold text-white text-base">{selectedItem.organisationName}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                    <User className="w-3.5 h-3.5" />
                    <span>{selectedItem.submittedByName || 'Staff Member'}</span>
                    {selectedItem.submittedByEmail && (
                      <>
                        <span>•</span>
                        <Mail className="w-3.5 h-3.5" />
                        <span>{selectedItem.submittedByEmail}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg text-amber-400 font-bold text-xs">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{selectedItem.rating} / 5</span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Category:</span>
                  <span className="ml-2 font-semibold text-slate-200 capitalize">
                    {selectedItem.category.replace(/_/g, ' ')}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Submitted on:</span>
                  <span className="ml-2 text-slate-300">
                    {new Date(selectedItem.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/80 space-y-2">
                  <div className="font-semibold text-indigo-400 text-xs">What worked well:</div>
                  <p className="text-slate-200 leading-relaxed">{selectedItem.comment}</p>
                </div>

                {selectedItem.improvements && (
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/80 space-y-2">
                    <div className="font-semibold text-amber-400 text-xs">Suggested Improvements:</div>
                    <p className="text-slate-200 leading-relaxed">{selectedItem.improvements}</p>
                  </div>
                )}

                {/* Status Update & Notes */}
                <div className="pt-2 border-t border-slate-700/60 space-y-3">
                  <div className="font-bold text-white text-xs">Founder Action & Notes:</div>

                  <div className="flex flex-wrap gap-1.5">
                    {(['reviewed', 'planned', 'resolved', 'declined'] as CustomerFeedbackStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleUpdateStatus(st)}
                        disabled={savingStatus}
                        className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] capitalize transition-colors ${
                          selectedItem.status === st
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Internal review notes or action plan..."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedItem.status)}
                    disabled={savingStatus}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                  >
                    {savingStatus ? 'Saving...' : 'Save Internal Note'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-slate-500 text-xs">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              Select a feedback record from the table to view details and take founder action.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
