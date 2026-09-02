import React, { useState, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { documentUploadService, ALLOWED_DOCUMENT_EXTENSIONS } from '../../../services/documentUploadService';
import { DocumentType, DocumentRecord } from '../../../types';
import { 
  X, 
  UploadCloud, 
  FileText, 
  AlertCircle 
} from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded?: (doc: DocumentRecord) => void;
  defaultType?: DocumentType;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

const DOCUMENT_TYPES: DocumentType[] = [
  'general',
  'learner',
  'guardian',
  'staff',
  'programme',
  'group',
  'music',
  'dance',
  'event',
  'consent',
  'transport',
  'finance',
  'report',
  'policy',
  'agreement',
  'other'
];

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onUploaded,
  defaultType = 'general',
  relatedEntityType,
  relatedEntityId
}) => {
  const { organisationId, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<DocumentType>(defaultType);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!docName) {
        setDocName(file.name.replace(/\.[^/.]+$/, ''));
      }
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const doc = await documentUploadService.uploadDocument(
        organisationId,
        {
          file: selectedFile,
          name: docName || selectedFile.name,
          documentType: docType,
          relatedEntityType,
          relatedEntityId,
          notes
        },
        user?.uid || 'system'
      );

      onUploaded?.(doc);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
            <UploadCloud className="w-5 h-5 text-indigo-600" /> Upload Operational Document
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* File Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/20"
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold text-xs">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            ) : (
              <div>
                <UploadCloud className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-xs font-semibold text-slate-700">Click to select file for upload</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supported: {ALLOWED_DOCUMENT_EXTENSIONS.join(', ').toUpperCase()} (Max 25MB)
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Document Display Title *</label>
            <input
              type="text"
              value={docName}
              onChange={e => setDocName(e.target.value)}
              placeholder="e.g. 2026 Indemnity Form or Repertoire Score"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Document Category *</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value as DocumentType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs capitalize"
            >
              {DOCUMENT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Notes / Description</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Operational notes, confidentiality or context..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-sans"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
