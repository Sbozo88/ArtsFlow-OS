import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEntityDocuments } from '../../../hooks/useEntityDocuments';
import { DocumentUploadModal } from '../../documents/components/DocumentUploadModal';
import { 
  FolderArchive, 
  UploadCloud, 
  Download, 
  FileText, 
  FileCode, 
  Eye 
} from 'lucide-react';

interface EventDocumentsTabProps {
  eventId: string;
}

export const EventDocumentsTab: React.FC<EventDocumentsTabProps> = ({ eventId }) => {
  const { documents, loading, refresh } = useEntityDocuments('event', eventId);
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Event Operational Documents</h3>
          <p className="text-xs text-slate-500">Attach and access running orders, venue maps, schedules, scores, and participant rosters.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/documents/generated"
            className="px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-400 text-slate-700 hover:text-indigo-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-600" /> Generate Forms
          </Link>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" /> Upload File
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 text-xs">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
          <FolderArchive className="w-6 h-6 mx-auto mb-2 text-slate-300" />
          <p className="text-xs font-semibold text-slate-600">No documents attached to this event</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Upload a running order, programme notes, or generate an operational roster</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {documents.map(doc => (
            <div key={doc.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-bold text-slate-800 text-xs truncate">{doc.name}</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-indigo-50 text-indigo-700">
                    v{doc.versionNumber || 1}
                  </span>
                </div>
                {doc.fileName && (
                  <p className="text-[11px] font-mono text-slate-400 truncate mb-2">{doc.fileName}</p>
                )}
                {doc.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic line-clamp-2">
                    "{doc.notes}"
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-2">
                  {doc.downloadUrl && (
                    <a
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-indigo-600 hover:text-indigo-800 font-semibold text-xs flex items-center gap-1"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <Link
                    to={`/documents/${doc.id}`}
                    className="p-1 text-slate-500 hover:text-slate-800 text-xs"
                    title="View Versions"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploaded={refresh}
        defaultType="event"
        relatedEntityType="event"
        relatedEntityId={eventId}
      />
    </div>
  );
};
