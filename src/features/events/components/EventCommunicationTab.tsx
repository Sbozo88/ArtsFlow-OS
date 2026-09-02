import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCommunications } from '../../../hooks/useCommunications';
import { CommunicationDetailModal } from '../../communication/components/CommunicationDetailModal';
import { 
  MessageSquare, 
  Plus, 
  Eye, 
  FileCheck, 
  Bus 
} from 'lucide-react';

interface EventCommunicationTabProps {
  eventId: string;
}

export const EventCommunicationTab: React.FC<EventCommunicationTabProps> = ({ eventId }) => {
  const { communications, loading, refresh } = useCommunications({
    relatedEntityType: 'event',
    relatedEntityId: eventId
  });

  const [selectedCommId, setSelectedCommId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Event Communication Channel</h3>
          <p className="text-xs text-slate-500">Send notifications, consent reminders, arrival times, and dress code instructions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/communication/compose?type=consent&audience=missing_consent&eventId=${eventId}`}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-400 text-slate-700 hover:text-indigo-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <FileCheck className="w-3.5 h-3.5 text-amber-600" /> Consent Reminder
          </Link>
          <Link
            to={`/communication/compose?type=transport&audience=transport_passengers&eventId=${eventId}`}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-400 text-slate-700 hover:text-indigo-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Bus className="w-3.5 h-3.5 text-blue-600" /> Transport Notice
          </Link>
          <Link
            to={`/communication/compose?type=event&audience=event_participants&eventId=${eventId}`}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Message Participants
          </Link>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading event communications...</div>
        ) : communications.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">No communications recorded for this event</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Use the action buttons above to dispatch notices</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Subject / Preview</th>
                <th className="px-4 py-2.5">Channel</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {communications.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/75">
                  <td className="px-4 py-2.5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-slate-800 truncate max-w-xs">{c.subject || 'Event Notice'}</div>
                    <div className="text-slate-400 text-[11px] truncate max-w-xs">{c.body}</div>
                  </td>
                  <td className="px-4 py-2.5 uppercase font-bold text-slate-600 text-[10px]">
                    {c.channel}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700 capitalize">
                      {c.communicationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => setSelectedCommId(c.id)}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
