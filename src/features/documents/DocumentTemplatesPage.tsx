import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDocumentTemplates } from '../../hooks/useDocumentTemplates';
import { documentTemplateService } from '../../services/documentTemplateService';
import { DocumentTemplate, DocumentType, DocumentTemplateFormat } from '../../types';
import { 
  FileCode, 
  Plus, 
  Edit2, 
  Archive, 
  X
} from 'lucide-react';

const DOC_TYPES: DocumentType[] = [
  'general',
  'learner',
  'staff',
  'event',
  'consent',
  'transport',
  'finance',
  'report',
  'policy',
  'agreement'
];

export const DocumentTemplatesPage: React.FC = () => {
  const { organisationId, user } = useAuth();
  const { templates, loading, refresh } = useDocumentTemplates();

  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);

  const [name, setName] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('general');
  const [titleTemplate, setTitleTemplate] = useState('');
  const [bodyTemplate, setBodyTemplate] = useState('');
  const [templateFormat, setTemplateFormat] = useState<DocumentTemplateFormat>('html');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setName('');
    setDocumentType('general');
    setTitleTemplate('');
    setBodyTemplate('');
    setTemplateFormat('html');
    setActionError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (t: DocumentTemplate) => {
    setEditingTemplate(t);
    setName(t.name);
    setDocumentType(t.documentType);
    setTitleTemplate(t.titleTemplate || '');
    setBodyTemplate(t.bodyTemplate || '');
    setTemplateFormat(t.templateFormat);
    setActionError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId) return;
    setActionLoading(true);
    setActionError(null);

    try {
      if (editingTemplate) {
        await documentTemplateService.updateTemplate(
          organisationId,
          editingTemplate.id,
          {
            name,
            documentType,
            titleTemplate,
            bodyTemplate,
            templateFormat
          },
          user?.uid || 'system'
        );
      } else {
        await documentTemplateService.createTemplate(
          organisationId,
          {
            name,
            documentType,
            titleTemplate,
            bodyTemplate,
            templateFormat
          },
          user?.uid || 'system'
        );
      }

      await refresh();
      setShowModal(false);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!organisationId) return;
    if (!confirm('Archive this document template?')) return;
    try {
      await documentTemplateService.archiveTemplate(organisationId, id, user?.uid || 'system');
      await refresh();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileCode className="w-7 h-7 text-indigo-600" /> Document Templates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Standard templates for generating printable forms, manifests, notices, and agreements.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Document Template
        </button>
      </div>

      {/* Template Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-indigo-600 mb-2"></div>
          <p className="text-xs">Loading document templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <FileCode className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">No document templates configured</p>
          <p className="text-xs text-slate-400 mt-1">Define HTML, Markdown or Text templates for your arts projects</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 text-indigo-700 uppercase border border-indigo-200">
                    {t.templateFormat}
                  </span>
                </div>
                <div className="text-xs text-slate-500 capitalize mb-3">
                  Domain: <span className="font-semibold text-slate-700">{t.documentType}</span>
                </div>
                {t.titleTemplate && (
                  <div className="text-xs text-slate-700 font-semibold mb-2">
                    Title: {t.titleTemplate}
                  </div>
                )}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-600 line-clamp-4">
                  {t.bodyTemplate || '(Blank template)'}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEdit(t)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md"
                  title="Edit Template"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleArchive(t.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                  title="Archive Template"
                >
                  <Archive className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingTemplate ? 'Edit Document Template' : 'New Document Template'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                  {actionError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Template Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Standard Repertoire License Agreement"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Document Type *</label>
                  <select
                    value={documentType}
                    onChange={e => setDocumentType(e.target.value as DocumentType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs capitalize"
                  >
                    {DOC_TYPES.map(dt => (
                      <option key={dt} value={dt}>{dt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Format *</label>
                  <select
                    value={templateFormat}
                    onChange={e => setTemplateFormat(e.target.value as DocumentTemplateFormat)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs uppercase"
                  >
                    <option value="html">HTML</option>
                    <option value="markdown">Markdown</option>
                    <option value="text">Plain Text</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Title Template</label>
                <input
                  type="text"
                  value={titleTemplate}
                  onChange={e => setTitleTemplate(e.target.value)}
                  placeholder="e.g. Agreement - {{learnerFullName}}"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Body Template (HTML/Text)</label>
                <textarea
                  value={bodyTemplate}
                  onChange={e => setBodyTemplate(e.target.value)}
                  rows={8}
                  placeholder="Write your document markup or text..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-mono leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : editingTemplate ? 'Update' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
