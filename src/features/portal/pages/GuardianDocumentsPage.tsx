import React from 'react';
import { FolderLock, Download, FileText, Calendar, AlertCircle } from 'lucide-react';
import { useGuardianPortal } from '../../../hooks/useGuardianPortal';
import { useGuardianDocuments } from '../../../hooks/useGuardianDocuments';

export const GuardianDocumentsPage: React.FC = () => {
  const { selectedLearner, selectedLearnerId } = useGuardianPortal();
  const { documents, loading, error } = useGuardianDocuments(selectedLearnerId);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Document Vault
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-1">
          Documents & Downloads — {selectedLearner?.preferredName || selectedLearner?.firstName || 'Learner'}
        </h1>
        <p className="text-sm text-slate-500">
          Official policies, certificates, event schedules, and permission slips published for families.
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <FolderLock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">No Documents Available</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are currently no guardian-visible documents or certificates published for this learner.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
          {documents.map(doc => (
            <div key={doc.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{doc.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="uppercase font-bold text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      {doc.documentType}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{doc.createdAt.split('T')[0]}</span>
                    </span>
                    {doc.fileSize && (
                      <>
                        <span>•</span>
                        <span>{(doc.fileSize / 1024).toFixed(0)} KB</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {doc.downloadUrl && (
                <a
                  href={doc.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors shrink-0 self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
