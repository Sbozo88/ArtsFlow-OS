import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCommunicationTemplates } from '../../hooks/useCommunicationTemplates';
import { communicationTemplateService } from '../../services/communicationTemplateService';
import { CommunicationTemplate, TemplateCategory, CommunicationChannel } from '../../types';
import { 
  FileText, 
  Plus, 
  Edit2, 
  Archive, 
  X
} from 'lucide-react';

const CATEGORIES: TemplateCategory[] = [
  'general',
  'attendance',
  'event',
  'consent',
  'transport',
  'finance',
  'programme',
  'guardian',
  'staff',
  'music',
  'dance'
];

const MERGE_TAGS = [
  '{{guardianFirstName}}',
  '{{guardianFullName}}',
  '{{learnerFirstName}}',
  '{{learnerFullName}}',
  '{{programmeName}}',
  '{{groupName}}',
  '{{eventName}}',
  '{{eventDate}}',
  '{{eventVenue}}',
  '{{invoiceNumber}}',
  '{{invoiceBalance}}',
  '{{invoiceDueDate}}',
  '{{transportDepartureTime}}',
  '{{transportPickupLocation}}',
  '{{consentLink}}'
];

export const CommunicationTemplatesPage: React.FC = () => {
  const { organisationId, user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | undefined>(undefined);
  const { templates, loading, refresh } = useCommunicationTemplates(selectedCategory);

  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CommunicationTemplate | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('general');
  const [defaultChannel, setDefaultChannel] = useState<CommunicationChannel>('email');
  const [subjectTemplate, setSubjectTemplate] = useState('');
  const [bodyTemplate, setBodyTemplate] = useState('');
  const [description, setDescription] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setName('');
    setCategory('general');
    setDefaultChannel('email');
    setSubjectTemplate('');
    setBodyTemplate('');
    setDescription('');
    setActionError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (t: CommunicationTemplate) => {
    setEditingTemplate(t);
    setName(t.name);
    setCategory(t.category);
    setDefaultChannel(t.defaultChannel || 'email');
    setSubjectTemplate(t.subjectTemplate || '');
    setBodyTemplate(t.bodyTemplate);
    setDescription(t.description || '');
    setActionError(null);
    setShowModal(true);
  };

  const handleInsertTag = (tag: string) => {
    setBodyTemplate(prev => prev + ' ' + tag);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId) return;
    setActionLoading(true);
    setActionError(null);

    try {
      if (editingTemplate) {
        await communicationTemplateService.updateTemplate(
          organisationId,
          editingTemplate.id,
          {
            name,
            category,
            defaultChannel,
            subjectTemplate: subjectTemplate || undefined,
            bodyTemplate,
            description: description || undefined
          },
          user?.uid || 'system'
        );
      } else {
        await communicationTemplateService.createTemplate(
          organisationId,
          {
            name,
            category,
            defaultChannel,
            subjectTemplate: subjectTemplate || undefined,
            bodyTemplate,
            description: description || undefined
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
    if (!confirm('Are you sure you want to archive this template?')) return;
    try {
      await communicationTemplateService.archiveTemplate(organisationId, id, user?.uid || 'system');
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
            <FileText className="w-7 h-7 text-indigo-600" /> Communication Templates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Standardised message templates with safe merge variables for events, consent, fees, and reminders.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Template
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(undefined)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            selectedCategory === undefined
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Categories
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-indigo-600 mb-2"></div>
          <p className="text-xs">Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">No templates found in this category</p>
          <p className="text-xs text-slate-400 mt-1">Create reusable templates to streamline guardian and student notices</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700 capitalize border border-slate-200 shrink-0">
                    {t.category}
                  </span>
                </div>
                {t.subjectTemplate && (
                  <div className="text-xs text-slate-600 font-semibold mb-2">
                    Subject: {t.subjectTemplate}
                  </div>
                )}
                <p className="text-xs text-slate-500 line-clamp-4 font-sans bg-slate-50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap">
                  {t.bodyTemplate}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <span className="text-[10px] font-semibold uppercase text-slate-400">
                  Channel: {t.defaultChannel || 'Any'}
                </span>
                <div className="flex items-center gap-2">
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
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-indigo-600" />
                {editingTemplate ? 'Edit Template' : 'New Template'}
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
                  placeholder="e.g. Overdue Invoice Reminder"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as TemplateCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs capitalize"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Default Channel</label>
                  <select
                    value={defaultChannel}
                    onChange={e => setDefaultChannel(e.target.value as CommunicationChannel)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs uppercase"
                  >
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                    <option value="manual">Manual</option>
                    <option value="print">Print</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Subject Template (Email)</label>
                <input
                  type="text"
                  value={subjectTemplate}
                  onChange={e => setSubjectTemplate(e.target.value)}
                  placeholder="e.g. Action Required: {{learnerFullName}} - {{eventName}}"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Body Template *</label>
                <textarea
                  value={bodyTemplate}
                  onChange={e => setBodyTemplate(e.target.value)}
                  rows={6}
                  required
                  placeholder="Write your template here... Click below to insert merge tags."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-xs leading-relaxed font-sans"
                />
              </div>

              {/* Merge Tag Chips */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Insert Merge Field:
                </span>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-lg">
                  {MERGE_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleInsertTag(tag)}
                      className="px-2 py-0.5 bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded text-[10px] font-mono border border-slate-200 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
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
                  {actionLoading ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
