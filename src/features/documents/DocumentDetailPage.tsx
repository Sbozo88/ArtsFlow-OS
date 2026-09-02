import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { documentService } from '../../services/documentService';
import { documentVersionService } from '../../services/documentVersionService';
import { useDocumentVersions } from '../../hooks/useDocumentVersions';
import { DocumentRecord, DocumentLink } from '../../types';
import { 
  ArrowLeft, 
  Download, 
  UploadCloud, 
  Clock, 
  Paperclip, 
  Plus, 
  Trash2 
} from 'lucide-react';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { organisationId, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [doc, setDoc] = useState<DocumentRecord | null>(null);
  const [links, setLinks] = useState<DocumentLink[]>([]);
  const [loading, setLoading] = useState(true);

  const { versions, refresh: refreshVersions } = useDocumentVersions(id);

  // New Version Modal
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [versionNotes, setVersionNotes] = useState('');
  const [versionUploading, setVersionUploading] = useState(false);
  const [versionError, setVersionError] = useState<string | null>(null);

  // Link Modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [entityType, setEntityType] = useState('learner');
  const [entityId, setEntityId] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);

  const loadDocument = async () => {
    if (!organisationId || !id) return;
    try {
      const [d, l] = await Promise.all([
        documentService.getDocumentById(organisationId, id),
        documentService.getDocumentLinks(organisationId, id)
      ]);
      setDoc(d);
      setLinks(l);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (!organisationId || !id) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const init = async () => {
      try {
        const [d, l] = await Promise.all([
          documentService.getDocumentById(organisationId, id),
          documentService.getDocumentLinks(organisationId, id)
        ]);
        if (mounted) {
          setDoc(d);
          setLinks(l);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();
    return () => { mounted = false; };
  }, [organisationId, id]);

  const handleUploadNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !id || !newVersionFile) return;

    setVersionUploading(true);
    setVersionError(null);
    try {
      const result = await documentVersionService.uploadNewVersion(
        organisationId,
        id,
        newVersionFile,
        versionNotes,
        user?.uid || 'system'
      );
      setDoc(result.document);
      await refreshVersions();
      setShowVersionModal(false);
      setNewVersionFile(null);
      setVersionNotes('');
    } catch (err) {
      setVersionError((err as Error).message);
    } finally {
      setVersionUploading(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !id || !entityId.trim()) return;

    setLinkLoading(true);
    try {
      await documentService.linkDocument(organisationId, id, entityType, entityId.trim(), user?.uid || 'system');
      await loadDocument();
      setShowLinkModal(false);
      setEntityId('');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLinkLoading(false);
    }
  };

  const handleUnlink = async (linkId: string) => {
    if (!organisationId) return;
    if (!confirm('Remove this entity link?')) return;
    try {
      await documentService.unlinkDocument(organisationId, linkId, user?.uid || 'system');
      await loadDocument();
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

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-indigo-600 mb-2"></div>
        <p className="text-xs">Loading document record...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Document record not found.</p>
        <Link to="/documents" className="text-indigo-600 font-semibold text-xs mt-2 inline-block">
          ← Back to Documents
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/documents')}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{doc.name}</h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800">
                v{doc.versionNumber || 1}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-slate-100 text-slate-700 capitalize border border-slate-200">
                {doc.documentType}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              File: <span className="font-mono text-slate-700">{doc.fileName}</span> • Size: {formatFileSize(doc.fileSize)} • Added on {new Date(doc.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {doc.downloadUrl && (
            <a
              href={doc.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" /> Download Current File
            </a>
          )}
          <button
            onClick={() => setShowVersionModal(true)}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-indigo-600" /> Upload New Version
          </button>
        </div>
      </div>

      {/* Metadata Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs">Metadata & File Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Status</span>
            <span className="font-semibold text-slate-800 uppercase">{doc.documentStatus}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">MIME Type</span>
            <span className="font-mono text-slate-700">{doc.mimeType || 'Unknown'}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Storage Location</span>
            <span className="font-mono text-slate-700 truncate block" title={doc.storagePath || ''}>
              {doc.storagePath || 'Direct'}
            </span>
          </div>
        </div>
        {doc.notes && (
          <div className="pt-3 border-t border-slate-100 text-xs">
            <span className="text-slate-400 block mb-1">Notes:</span>
            <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">{doc.notes}</p>
          </div>
        )}
      </div>

      {/* Version History Timeline */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" /> Version History ({versions.length})
          </h2>
          <span className="text-xs text-slate-500">Historical versions are immutably preserved</span>
        </div>

        <div className="space-y-3">
          {versions.map(v => (
            <div
              key={v.id}
              className={`p-4 rounded-lg border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs transition-colors ${
                v.versionNumber === doc.versionNumber 
                  ? 'bg-indigo-50/50 border-indigo-200' 
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">Version {v.versionNumber}</span>
                  {v.versionNumber === doc.versionNumber && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-600 text-white">Current</span>
                  )}
                  <span className="text-slate-500 font-mono">({v.fileName})</span>
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Size: {formatFileSize(v.fileSize)} • Created on {new Date(v.createdAt).toLocaleString()}
                </div>
                {v.notes && <div className="text-slate-600 mt-1 italic">"{v.notes}"</div>}
              </div>

              {v.downloadUrl && (
                <a
                  href={v.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 border border-slate-300 hover:bg-white rounded-md font-semibold text-slate-700 flex items-center gap-1 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> Download v{v.versionNumber}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Linked Entities */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-indigo-600" /> Linked ArtsFlow Records ({links.length})
          </h2>
          <button
            onClick={() => setShowLinkModal(true)}
            className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Link Entity
          </button>
        </div>

        {links.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No explicit operational links established yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {links.map(link => (
              <div key={link.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700 capitalize border border-slate-200 mr-2">
                    {link.entityType}
                  </span>
                  <span className="font-mono text-slate-600 font-semibold">{link.entityId}</span>
                </div>
                <button
                  onClick={() => handleUnlink(link.id)}
                  className="p-1 text-slate-400 hover:text-rose-600"
                  title="Remove link"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload New Version Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Upload Version {(doc.versionNumber || 1) + 1}</h3>
              <button onClick={() => setShowVersionModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleUploadNewVersion} className="p-6 space-y-4">
              {versionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                  {versionError}
                </div>
              )}

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer bg-slate-50/50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) setNewVersionFile(e.target.files[0]);
                  }}
                  className="hidden"
                />
                {newVersionFile ? (
                  <div className="text-xs font-semibold text-slate-800">{newVersionFile.name}</div>
                ) : (
                  <div>
                    <UploadCloud className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                    <p className="text-xs text-slate-600">Select replacement file version</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Version Notes</label>
                <input
                  type="text"
                  value={versionNotes}
                  onChange={e => setVersionNotes(e.target.value)}
                  placeholder="e.g. Corrected tempo markings or renewed certificate"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVersionModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={versionUploading || !newVersionFile}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {versionUploading ? 'Uploading...' : 'Upload Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Entity Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Link to Operational Entity</h3>
              <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleAddLink} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Entity Type</label>
                <select
                  value={entityType}
                  onChange={e => setEntityType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs capitalize"
                >
                  <option value="learner">Learner</option>
                  <option value="guardian">Guardian</option>
                  <option value="staff">Staff Member</option>
                  <option value="event">Event</option>
                  <option value="group">Group / Ensemble</option>
                  <option value="consentRequest">Consent Request</option>
                  <option value="invoice">Invoice</option>
                  <option value="transportPlan">Transport Plan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Entity ID *</label>
                <input
                  type="text"
                  value={entityId}
                  onChange={e => setEntityId(e.target.value)}
                  placeholder="Record ID to link"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linkLoading || !entityId.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {linkLoading ? 'Linking...' : 'Save Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
