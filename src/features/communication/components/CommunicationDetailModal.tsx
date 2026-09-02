import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { communicationService } from '../../../services/communicationService';
import { Communication, CommunicationRecipient, DocumentRecord } from '../../../types';
import { 
  X, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Download, 
  ExternalLink, 
  MessageSquare, 
  Ban 
} from 'lucide-react';

interface CommunicationDetailModalProps {
  communicationId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export const CommunicationDetailModal: React.FC<CommunicationDetailModalProps> = ({
  communicationId,
  onClose,
  onUpdated
}) => {
  const { organisationId, user } = useAuth();
  const [comm, setComm] = useState<Communication | null>(null);
  const [recipients, setRecipients] = useState<CommunicationRecipient[]>([]);
  const [attachments, setAttachments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!organisationId || !communicationId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const fetchDetails = async () => {
      try {
        const [c, recs, atts] = await Promise.all([
          communicationService.getCommunicationById(organisationId, communicationId),
          communicationService.getRecipientsForCommunication(organisationId, communicationId),
          communicationService.getAttachmentsForCommunication(organisationId, communicationId)
        ]);

        if (mounted) {
          setComm(c);
          setRecipients(recs);
          setAttachments(atts);
        }
      } catch (err) {
        console.error('Error fetching communication details:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDetails();
    return () => { mounted = false; };
  }, [organisationId, communicationId]);

  if (!communicationId) return null;

  const handleCancel = async () => {
    if (!organisationId || !comm) return;
    if (!confirm('Are you sure you want to cancel this communication?')) return;
    setActionLoading(true);
    try {
      await communicationService.cancelCommunication(organisationId, comm.id, user?.uid || 'system');
      const updated = await communicationService.getCommunicationById(organisationId, comm.id);
      setComm(updated);
      onUpdated?.();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: Communication['communicationStatus']) => {
    switch (status) {
      case 'sent':
      case 'completed':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 uppercase flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Sent</span>;
      case 'ready':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 uppercase flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Prepared</span>;
      case 'partially_sent':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 uppercase flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Partial</span>;
      case 'failed':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 uppercase flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Failed</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-200 text-slate-700 uppercase flex items-center gap-1"><Ban className="w-3.5 h-3.5" /> Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 uppercase">Draft</span>;
    }
  };

  const getRecipientStatusBadge = (status: CommunicationRecipient['deliveryStatus']) => {
    switch (status) {
      case 'delivered':
      case 'sent':
        return <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">Sent</span>;
      case 'prepared':
        return <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200">Prepared</span>;
      case 'failed':
        return <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-rose-50 text-rose-700 border border-rose-200">Failed</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-slate-50 text-slate-700 border border-slate-200">Pending</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {comm?.subject || 'Communication Record'}
                </h2>
                {comm && getStatusBadge(comm.communicationStatus)}
              </div>
              <p className="text-xs text-slate-500">
                Type: <span className="font-semibold capitalize">{comm?.communicationType}</span> • Channel: <span className="font-semibold uppercase">{comm?.channel}</span> • Date: {comm?.createdAt ? new Date(comm.createdAt).toLocaleString() : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-indigo-600 mb-2"></div>
              <p>Loading message details...</p>
            </div>
          ) : !comm ? (
            <p className="text-center py-8 text-slate-500">Communication record not found.</p>
          ) : (
            <>
              {/* Message Body */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Message Body</h3>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {comm.body}
                </div>
              </div>

              {/* Attachments */}
              {attachments.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Attached Documents ({attachments.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attachments.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="text-xs font-semibold text-slate-800 truncate">{doc.name}</span>
                        </div>
                        {doc.downloadUrl && (
                          <a
                            href={doc.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 p-1 text-xs flex items-center gap-1 font-semibold"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recipients Roster */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Recipients ({recipients.length})
                  </h3>
                  <div className="text-xs text-slate-500">
                    Sent: {recipients.filter(r => r.deliveryStatus === 'sent' || r.deliveryStatus === 'delivered').length} • Prepared: {recipients.filter(r => r.deliveryStatus === 'prepared').length} • Failed: {recipients.filter(r => r.deliveryStatus === 'failed').length}
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold">
                      <tr>
                        <th className="px-4 py-2.5">Recipient</th>
                        <th className="px-4 py-2.5">Contact</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5 text-right">Actions / Info</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {recipients.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50/75">
                          <td className="px-4 py-2 font-medium text-slate-800">
                            {r.recipientName}
                            <span className="block text-[10px] text-slate-400 capitalize">{r.recipientType}</span>
                          </td>
                          <td className="px-4 py-2 text-slate-600 font-mono text-[11px]">
                            {r.recipientEmail || r.recipientPhone || '—'}
                          </td>
                          <td className="px-4 py-2">
                            {getRecipientStatusBadge(r.deliveryStatus)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {r.failureReason ? (
                              <span className="text-rose-600 text-[11px] font-medium" title={r.failureReason}>
                                {r.failureReason}
                              </span>
                            ) : r.metadata?.whatsappLink ? (
                              <a
                                href={r.metadata.whatsappLink as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-semibold text-[11px]"
                              >
                                <ExternalLink className="w-3 h-3" /> WhatsApp
                              </a>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            {comm && (comm.communicationStatus === 'draft' || comm.communicationStatus === 'ready') && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-3 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Ban className="w-3.5 h-3.5" /> Cancel Communication
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
