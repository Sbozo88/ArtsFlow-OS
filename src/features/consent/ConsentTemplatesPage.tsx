import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useConsentTemplates } from '../../hooks/useConsentTemplates';
import { consentTemplateService } from '../../services/consentTemplateService';
import { ConsentType, ConsentTemplate } from '../../types';
import { 
  FileText, 
  Plus, 
  CheckCircle2, 
  Archive, 
  Edit3
} from 'lucide-react';

export const ConsentTemplatesPage: React.FC = () => {
  const { organisationId, user } = useAuth();
  const { templates, loading, refresh } = useConsentTemplates();

  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ConsentTemplate | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [consentType, setConsentType] = useState<ConsentType>('event_participation');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [requiresGuardianSignature, setRequiresGuardianSignature] = useState(true);
  const [requiresEmergencyContact, setRequiresEmergencyContact] = useState(true);
  const [requiresMedicalDeclaration, setRequiresMedicalDeclaration] = useState(true);
  const [requiresTransportApproval, setRequiresTransportApproval] = useState(true);
  const [requiresPhotoMediaConsent, setRequiresPhotoMediaConsent] = useState(false);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setName('');
    setConsentType('event_participation');
    setTitle('');
    setDescription('');
    setBodyText('');
    setRequiresGuardianSignature(true);
    setRequiresEmergencyContact(true);
    setRequiresMedicalDeclaration(true);
    setRequiresTransportApproval(true);
    setRequiresPhotoMediaConsent(false);
    setShowModal(true);
  };

  const handleOpenEdit = (t: ConsentTemplate) => {
    setEditingTemplate(t);
    setName(t.name);
    setConsentType(t.consentType);
    setTitle(t.title);
    setDescription(t.description || '');
    setBodyText(t.bodyText || '');
    setRequiresGuardianSignature(t.requiresGuardianSignature);
    setRequiresEmergencyContact(t.requiresEmergencyContact);
    setRequiresMedicalDeclaration(t.requiresMedicalDeclaration);
    setRequiresTransportApproval(t.requiresTransportApproval);
    setRequiresPhotoMediaConsent(!!t.requiresPhotoMediaConsent);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !user || !name || !title) return;

    setActionLoading(true);
    try {
      if (editingTemplate) {
        await consentTemplateService.updateTemplate(organisationId, editingTemplate.id, {
          name,
          consentType,
          title,
          description: description || undefined,
          bodyText: bodyText || undefined,
          requiresGuardianSignature,
          requiresEmergencyContact,
          requiresMedicalDeclaration,
          requiresTransportApproval,
          requiresPhotoMediaConsent
        }, user.uid);
      } else {
        await consentTemplateService.createTemplate(organisationId, {
          name,
          consentType,
          title,
          description: description || undefined,
          bodyText: bodyText || undefined,
          requiresGuardianSignature,
          requiresEmergencyContact,
          requiresMedicalDeclaration,
          requiresTransportApproval,
          requiresPhotoMediaConsent,
          templateStatus: 'active'
        }, user.uid);
      }

      refresh();
      setShowModal(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error saving template');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!organisationId || !user) return;
    if (!confirm('Are you sure you want to archive this template?')) return;

    try {
      await consentTemplateService.deleteTemplate(organisationId, id, user.uid);
      refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error archiving template');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-indigo-600" /> Consent Templates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Customise organisation consent forms, indemnity declarations, and transport approvals.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800">No Consent Templates Created</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Create reusable templates for events, excursions, transport, and medical declarations.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(t => (
            <div key={t.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    {t.consentType.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t.templateStatus}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-2">{t.name}</h3>
                <p className="text-xs text-slate-600 font-medium">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                  <p>• Guardian Signature: {t.requiresGuardianSignature ? 'Required' : 'Optional'}</p>
                  <p>• Transport Approval: {t.requiresTransportApproval ? 'Required' : 'Optional'}</p>
                  <p>• Medical Declaration: {t.requiresMedicalDeclaration ? 'Required' : 'Optional'}</p>
                  <p>• Emergency Contact: {t.requiresEmergencyContact ? 'Required' : 'Optional'}</p>
                  {t.requiresPhotoMediaConsent && <p>• Photo/Media Consent: Included</p>}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEdit(t)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-50"
                  title="Edit Template"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleArchive(t.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-50"
                  title="Archive Template"
                >
                  <Archive className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Create / Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">
              {editingTemplate ? 'Edit Consent Template' : 'New Consent Template'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Template Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard Event Consent & Transport"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Consent Type *</label>
                  <select
                    value={consentType}
                    onChange={(e) => setConsentType(e.target.value as ConsentType)}
                    className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  >
                    <option value="event_participation">Event Participation</option>
                    <option value="indemnity">Indemnity</option>
                    <option value="transport">Transport</option>
                    <option value="medical">Medical</option>
                    <option value="media">Media / Photo</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Public Display Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parent/Guardian Event Consent & Indemnity Form"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Short Description</label>
                <input
                  type="text"
                  placeholder="Brief summary for parents"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Full Terms & Body Text</label>
                <textarea
                  rows={4}
                  placeholder="Provide detailed terms, indemnity text, code of conduct..."
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-800 block">Form Requirements</span>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={requiresGuardianSignature}
                    onChange={(e) => setRequiresGuardianSignature(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span>Require Guardian Signature</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={requiresEmergencyContact}
                    onChange={(e) => setRequiresEmergencyContact(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span>Require Emergency Contact details</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={requiresMedicalDeclaration}
                    onChange={(e) => setRequiresMedicalDeclaration(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span>Require Medical Declaration (allergies, medication)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={requiresTransportApproval}
                    onChange={(e) => setRequiresTransportApproval(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span>Include Transport Consent section</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={requiresPhotoMediaConsent}
                    onChange={(e) => setRequiresPhotoMediaConsent(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span>Include Photo / Media Consent section</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded"
                >
                  {actionLoading ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
