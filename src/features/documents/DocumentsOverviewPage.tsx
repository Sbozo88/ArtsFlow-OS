import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDocuments } from '../../hooks/useDocuments';
import { documentService } from '../../services/documentService';
import { DocumentUploadModal } from './components/DocumentUploadModal';
import { 
  FolderArchive, 
  Search, 
  UploadCloud, 
  Download, 
  FileText, 
  Archive, 
  Eye, 
  Layers,
  FileCode,
  HardDrive
} from 'lucide-react';

export const DocumentsOverviewPage: React.FC = () => {
  const { organisationId, user } = useAuth();
  const { documents, loading, refresh } = useDocuments();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const filtered = documents.filter(doc => {
    if (typeFilter !== 'all' && doc.documentType !== typeFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = doc.name.toLowerCase().includes(q);
      const matchFile = doc.fileName?.toLowerCase().includes(q);
      const matchNotes = doc.notes?.toLowerCase().includes(q);
      if (!matchName && !matchFile && !matchNotes) return false;
    }
    return true;
  });

  const totalBytes = documents.reduce((sum, d) => sum + (d.fileSize || 0), 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
  const activeCount = documents.filter(d => d.documentStatus === 'active').length;

  const handleArchive = async (id: string) => {
    if (!organisationId) return;
    if (!confirm('Are you sure you want to archive this document?')) return;
    try {
      await documentService.archiveDocument(organisationId, id, user?.uid || 'system');
      await refresh();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderArchive className="w-7 h-7 text-indigo-600" /> Documents & Files
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Central repository for operational documents, scores, agreements, manifests, and compliance records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/documents/generated"
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
          >
            <FileCode className="w-4 h-4 text-indigo-600" /> Generate Forms
          </Link>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors"
          >
            <UploadCloud className="w-4 h-4" /> Upload Document
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Documents</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{documents.length}</div>
          <div className="text-xs text-slate-400 mt-1">{activeCount} active in repository</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Storage Used</span>
            <HardDrive className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700">{totalMB} MB</div>
          <div className="text-xs text-slate-400 mt-1">Firebase Cloud Storage quota</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Categories</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {new Set(documents.map(d => d.documentType)).size}
          </div>
          <div className="text-xs text-slate-400 mt-1">Operational document domains</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search document name, filename or notes..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs"
          />
        </div>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 capitalize bg-white"
        >
          <option value="all">All Document Types</option>
          <option value="general">General</option>
          <option value="learner">Learner</option>
          <option value="guardian">Guardian</option>
          <option value="staff">Staff</option>
          <option value="event">Event</option>
          <option value="consent">Consent</option>
          <option value="transport">Transport</option>
          <option value="finance">Finance</option>
          <option value="music">Music</option>
          <option value="dance">Dance</option>
          <option value="policy">Policy / Agreement</option>
        </select>
      </div>

      {/* Documents Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-indigo-600 mb-2"></div>
            <p className="text-xs">Loading documents...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FolderArchive className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No documents found</p>
            <p className="text-xs text-slate-400 mt-1">Upload files or generate forms to populate your hub</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Document Title</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Version</th>
                  <th className="px-5 py-3">File Size</th>
                  <th className="px-5 py-3">Uploaded Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filtered.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div>
                          <Link
                            to={`/documents/${doc.id}`}
                            className="font-bold text-slate-900 hover:text-indigo-600"
                          >
                            {doc.name}
                          </Link>
                          {doc.fileName && (
                            <span className="block text-[11px] text-slate-400 font-mono truncate max-w-xs">
                              {doc.fileName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700 capitalize border border-slate-200">
                        {doc.documentType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        v{doc.versionNumber || 1}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono text-[11px]">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {doc.downloadUrl && (
                          <a
                            href={doc.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md"
                            title="Download File"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <Link
                          to={`/documents/${doc.id}`}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                          title="View Details & Versions"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleArchive(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                          title="Archive Document"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploaded={refresh}
      />
    </div>
  );
};
