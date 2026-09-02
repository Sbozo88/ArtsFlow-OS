import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCommunications } from '../../hooks/useCommunications';
import { CommunicationDetailModal } from './components/CommunicationDetailModal';
import { CommunicationStatus } from '../../types';
import { 
  MessageSquare, 
  Search, 
  Plus, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Ban
} from 'lucide-react';

export const CommunicationHistoryPage: React.FC = () => {
  const { communications, loading, refresh } = useCommunications();
  const [selectedCommId, setSelectedCommId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = communications.filter(c => {
    if (typeFilter !== 'all' && c.communicationType !== typeFilter) return false;
    if (channelFilter !== 'all' && c.channel !== channelFilter) return false;
    if (statusFilter !== 'all' && c.communicationStatus !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchSubject = c.subject?.toLowerCase().includes(q);
      const matchBody = c.body.toLowerCase().includes(q);
      if (!matchSubject && !matchBody) return false;
    }
    return true;
  });

  const getStatusBadge = (status: CommunicationStatus) => {
    switch (status) {
      case 'sent':
      case 'completed':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Sent</span>;
      case 'ready':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800 uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> Prepared</span>;
      case 'partially_sent':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 uppercase flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Partial</span>;
      case 'failed':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-800 uppercase flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Failed</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-200 text-slate-700 uppercase flex items-center gap-1"><Ban className="w-3 h-3" /> Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700 uppercase">Draft</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-indigo-600" /> Communication History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete audit record of dispatched, prepared, and archived communications.
          </p>
        </div>
        <Link
          to="/communication/compose"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Compose Message
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search subject or body content..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs"
          />
        </div>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 capitalize bg-white"
        >
          <option value="all">All Types</option>
          <option value="general">General</option>
          <option value="guardian">Guardian</option>
          <option value="staff">Staff</option>
          <option value="event">Event</option>
          <option value="consent">Consent</option>
          <option value="transport">Transport</option>
          <option value="finance">Finance</option>
          <option value="attendance">Attendance</option>
        </select>

        <select
          value={channelFilter}
          onChange={e => setChannelFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 uppercase bg-white"
        >
          <option value="all">All Channels</option>
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="sms">SMS</option>
          <option value="manual">Manual</option>
          <option value="print">Print</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 capitalize bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="sent">Sent / Delivered</option>
          <option value="ready">Prepared</option>
          <option value="partially_sent">Partially Sent</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-indigo-600 mb-2"></div>
            <p className="text-xs">Loading communication log...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No communication records match your filter</p>
            <p className="text-xs text-slate-400 mt-1">Try broadening your search criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Subject & Content</th>
                  <th className="px-5 py-3">Channel</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-5 py-3.5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700 capitalize border border-slate-200">
                        {c.communicationType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 truncate max-w-sm">{c.subject || 'Operational Message'}</div>
                      <div className="text-slate-500 text-[11px] truncate max-w-sm">{c.body}</div>
                    </td>
                    <td className="px-5 py-3.5 uppercase font-bold text-slate-600 text-[10px]">
                      {c.channel}
                    </td>
                    <td className="px-5 py-3.5">
                      {getStatusBadge(c.communicationStatus)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedCommId(c.id)}
                        className="px-2.5 py-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:bg-indigo-50 rounded-md inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedCommId && (
        <CommunicationDetailModal
          communicationId={selectedCommId}
          onClose={() => setSelectedCommId(null)}
          onUpdated={refresh}
        />
      )}
    </div>
  );
};
