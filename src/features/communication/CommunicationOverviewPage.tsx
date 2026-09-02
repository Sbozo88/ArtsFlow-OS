import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCommunications } from '../../hooks/useCommunications';
import { CommunicationDetailModal } from './components/CommunicationDetailModal';
import { Communication } from '../../types';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  AlertCircle, 
  Plus, 
  FileCheck, 
  CreditCard, 
  Filter, 
  Eye 
} from 'lucide-react';

export const CommunicationOverviewPage: React.FC = () => {
  const { communications, loading, refresh } = useCommunications();
  const [selectedCommId, setSelectedCommId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const today = new Date().toISOString().split('T')[0];

  const messagesToday = communications.filter(c => c.createdAt.startsWith(today)).length;
  const readyCount = communications.filter(c => c.communicationStatus === 'ready').length;
  const failedCount = communications.filter(c => c.communicationStatus === 'failed' || c.communicationStatus === 'partially_sent').length;
  const consentCount = communications.filter(c => c.communicationType === 'consent').length;
  const financeCount = communications.filter(c => c.communicationType === 'finance').length;

  const filteredCommunications = communications.filter(c => {
    if (typeFilter !== 'all' && c.communicationType !== typeFilter) return false;
    return true;
  });

  const getStatusBadge = (status: Communication['communicationStatus']) => {
    switch (status) {
      case 'sent':
      case 'completed':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 uppercase">Sent</span>;
      case 'ready':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800 uppercase">Prepared</span>;
      case 'partially_sent':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 uppercase">Partial</span>;
      case 'failed':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-800 uppercase">Failed</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-200 text-slate-700 uppercase">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700 uppercase">Draft</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-indigo-600" /> Communication Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Central operational messaging for learners, guardians, staff, events, consent, and finance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/communication/templates"
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-semibold transition-colors"
          >
            Manage Templates
          </Link>
          <Link
            to="/communication/compose"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Compose Message
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today</span>
            <Send className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{messagesToday}</div>
          <div className="text-xs text-slate-400 mt-1">Messages initiated today</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Prepared</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700">{readyCount}</div>
          <div className="text-xs text-slate-400 mt-1">Ready for manual dispatch</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Attention</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{failedCount}</div>
          <div className="text-xs text-slate-400 mt-1">Failed delivery issues</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Consent</span>
            <FileCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{consentCount}</div>
          <div className="text-xs text-slate-400 mt-1">Consent reminders total</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Finance</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{financeCount}</div>
          <div className="text-xs text-slate-400 mt-1">Payment reminders total</div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50 border border-indigo-100 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Operational Communication Workflows</h3>
          <p className="text-xs text-slate-500 mt-0.5">Send targeted messages linked directly to your ArtsFlow events, consent, or overdue fees.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/communication/compose?type=consent&audience=missing_consent"
            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <FileCheck className="w-3.5 h-3.5 text-indigo-600" /> Missing Consent Reminder
          </Link>
          <Link
            to="/communication/compose?type=finance&audience=outstanding_invoices"
            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-600" /> Overdue Fees Reminder
          </Link>
          <Link
            to="/communication/compose?type=event&audience=event_participants"
            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-emerald-600" /> Event Participants Notice
          </Link>
        </div>
      </div>

      {/* Recent Communications Feed */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-800">Recent Communications</h2>
            <p className="text-xs text-slate-500">Live operational dispatch and message preparation feed</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white"
              >
                <option value="all">All Communication Types</option>
                <option value="general">General</option>
                <option value="guardian">Guardian</option>
                <option value="staff">Staff</option>
                <option value="event">Event</option>
                <option value="consent">Consent</option>
                <option value="transport">Transport</option>
                <option value="finance">Finance</option>
                <option value="attendance">Attendance</option>
              </select>
            </div>
            <Link
              to="/communication/history"
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              View Full History →
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-indigo-600 mb-2"></div>
            <p className="text-xs">Loading communications...</p>
          </div>
        ) : filteredCommunications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No communication records found</p>
            <p className="text-xs text-slate-400 mt-1">Start by composing your first message or reminder</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Subject / Preview</th>
                  <th className="px-5 py-3">Channel</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredCommunications.slice(0, 15).map(c => (
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
                      <div className="font-semibold text-slate-900 truncate max-w-xs">{c.subject || 'Notice'}</div>
                      <div className="text-slate-500 text-[11px] truncate max-w-xs">{c.body}</div>
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
