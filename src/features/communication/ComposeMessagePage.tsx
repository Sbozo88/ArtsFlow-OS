import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProgrammes } from '../../hooks/useProgrammes';
import { useProgrammeGroups } from '../../hooks/useProgrammeGroups';
import { useEvents } from '../../hooks/useEvents';
import { useCommunicationTemplates } from '../../hooks/useCommunicationTemplates';
import { useDocuments } from '../../hooks/useDocuments';
import { recipientResolverService, AudienceType, ResolvedAudienceResult } from '../../services/recipientResolverService';
import { communicationTemplateService } from '../../services/communicationTemplateService';
import { communicationService } from '../../services/communicationService';
import { 
  CommunicationType, 
  CommunicationChannel 
} from '../../types';
import { 
  Send, 
  Users, 
  FileText, 
  Paperclip, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  ArrowLeft
} from 'lucide-react';

const MERGE_VARIABLES = [
  { label: 'Guardian First Name', tag: '{{guardianFirstName}}' },
  { label: 'Guardian Full Name', tag: '{{guardianFullName}}' },
  { label: 'Learner First Name', tag: '{{learnerFirstName}}' },
  { label: 'Learner Full Name', tag: '{{learnerFullName}}' },
  { label: 'Event Name', tag: '{{eventName}}' },
  { label: 'Event Date', tag: '{{eventDate}}' },
  { label: 'Invoice Number', tag: '{{invoiceNumber}}' },
  { label: 'Invoice Balance', tag: '{{invoiceBalance}}' },
  { label: 'Invoice Due Date', tag: '{{invoiceDueDate}}' },
  { label: 'Consent Link', tag: '{{consentLink}}' }
];

export const ComposeMessagePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { organisationId, user } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const initialType = (queryParams.get('type') as CommunicationType) || 'general';
  const initialAudience = (queryParams.get('audience') as AudienceType) || 'all_guardians';
  const initialEventId = queryParams.get('eventId') || '';
  const initialGroupId = queryParams.get('groupId') || '';
  const initialLearnerId = queryParams.get('learnerId') || '';
  const initialGuardianId = queryParams.get('guardianId') || '';

  // Datasets for audience pickers
  const { programmes } = useProgrammes();
  const { groups } = useProgrammeGroups();
  const { events } = useEvents();
  const { templates } = useCommunicationTemplates();
  const { documents } = useDocuments({ documentStatus: 'active' });

  // Form State
  const [commType, setCommType] = useState<CommunicationType>(initialType);
  const [audienceType, setAudienceType] = useState<AudienceType>(initialAudience);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [selectedLearnerId, setSelectedLearnerId] = useState(initialLearnerId);
  const [selectedGuardianId, setSelectedGuardianId] = useState(initialGuardianId);
  const [channel, setChannel] = useState<CommunicationChannel>('email');

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  // Resolution & Preview State
  const [resolving, setResolving] = useState(false);
  const [resolvedAudience, setResolvedAudience] = useState<ResolvedAudienceResult>({
    recipients: [],
    totalCount: 0,
    missingEmailCount: 0,
    missingPhoneCount: 0,
    mergeContexts: {}
  });

  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Recipient resolution effect
  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const resolve = async () => {
      setResolving(true);
      try {
        const res = await recipientResolverService.resolveAudience(organisationId, {
          audienceType,
          channel,
          programmeId: selectedProgrammeId || undefined,
          groupId: selectedGroupId || undefined,
          eventId: selectedEventId || undefined,
          learnerId: selectedLearnerId || undefined,
          guardianId: selectedGuardianId || undefined
        });

        if (mounted) {
          setResolvedAudience(res);
        }
      } catch (err) {
        console.error('Error resolving audience:', err);
      } finally {
        if (mounted) setResolving(false);
      }
    };

    resolve();
    return () => { mounted = false; };
  }, [
    organisationId,
    audienceType,
    channel,
    selectedProgrammeId,
    selectedGroupId,
    selectedEventId,
    selectedLearnerId,
    selectedGuardianId
  ]);

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = templates.find(t => t.id === templateId);
    if (tmpl) {
      if (tmpl.subjectTemplate) setSubject(tmpl.subjectTemplate);
      setBody(tmpl.bodyTemplate);
      if (tmpl.defaultChannel) setChannel(tmpl.defaultChannel);
    }
  };

  const handleInsertVariable = (tag: string) => {
    setBody(prev => prev + ' ' + tag);
  };

  const handleToggleDocument = (docId: string) => {
    setSelectedDocIds(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  // Preview for first recipient
  const firstRecipient = resolvedAudience.recipients[0];
  const firstContextKey = firstRecipient
    ? (firstRecipient.guardianId 
        ? `${firstRecipient.guardianId}_${firstRecipient.learnerId || 'none'}`
        : firstRecipient.staffId || firstRecipient.learnerId || 'none')
    : 'none';
  const firstContext = resolvedAudience.mergeContexts[firstContextKey] || {};

  const previewBodyResult = communicationTemplateService.resolveTemplate(body, firstContext);
  const previewSubjectResult = subject ? communicationTemplateService.resolveTemplate(subject, firstContext) : null;

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || resolvedAudience.recipients.length === 0) return;
    if (!body.trim()) {
      alert('Please enter a message body.');
      return;
    }

    setDispatchLoading(true);
    try {
      // 1. Create communication record and snapshot recipients
      const { communication } = await communicationService.createCommunication(
        organisationId,
        {
          communicationType: commType,
          channel,
          subject: subject.trim() || undefined,
          body: body.trim(),
          relatedEntityType: selectedEventId ? 'event' : selectedGroupId ? 'group' : selectedProgrammeId ? 'programme' : undefined,
          relatedEntityId: selectedEventId || selectedGroupId || selectedProgrammeId || undefined,
          templateId: selectedTemplateId || undefined,
          documentIds: selectedDocIds,
          recipients: resolvedAudience.recipients,
          mergeContexts: resolvedAudience.mergeContexts
        },
        user?.uid || 'system'
      );

      // 2. Dispatch / prepare
      await communicationService.sendCommunication(
        organisationId,
        communication.id,
        resolvedAudience.mergeContexts,
        user?.uid || 'system'
      );

      setDispatchSuccess(true);
      setTimeout(() => {
        navigate('/communication/history');
      }, 1500);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setDispatchLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/communication')}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compose Communication</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational messaging with merge variable validation and recipient contact verification.
          </p>
        </div>
      </div>

      {dispatchSuccess ? (
        <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-lg font-bold text-emerald-900">Communication Successfully Processed!</h2>
          <p className="text-xs text-emerald-700">
            Messages have been sent or prepared according to your selected channel. Redirecting to history...
          </p>
        </div>
      ) : (
        <form onSubmit={handleDispatch} className="space-y-6">
          {/* Step 1: Type & Audience */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" /> 1. Audience & Scope
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Communication Type</label>
                <select
                  value={commType}
                  onChange={e => setCommType(e.target.value as CommunicationType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs capitalize"
                >
                  <option value="general">General Notice</option>
                  <option value="guardian">Guardian Notice</option>
                  <option value="staff">Staff Notice</option>
                  <option value="event">Event Notice</option>
                  <option value="consent">Consent Reminder</option>
                  <option value="transport">Transport Information</option>
                  <option value="finance">Finance / Fee Reminder</option>
                  <option value="attendance">Attendance Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Audience</label>
                <select
                  value={audienceType}
                  onChange={e => setAudienceType(e.target.value as AudienceType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs capitalize"
                >
                  <option value="all_guardians">All Organisation Guardians</option>
                  <option value="programme_guardians">Guardians of Programme</option>
                  <option value="group_guardians">Guardians of Group / Class</option>
                  <option value="event_participants">Event Participants' Guardians</option>
                  <option value="event_staff">Event Staff</option>
                  <option value="missing_consent">Learners Missing Consent</option>
                  <option value="outstanding_invoices">Outstanding Invoices (Debtors)</option>
                  <option value="staff">All Staff Members</option>
                  <option value="single_guardian">Single Guardian</option>
                  <option value="single_learner">Single Learner</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Channel</label>
                <select
                  value={channel}
                  onChange={e => setChannel(e.target.value as CommunicationChannel)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs uppercase font-semibold text-indigo-700 bg-indigo-50/50"
                >
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp (Prepared / Web Link)</option>
                  <option value="sms">SMS (Prepared / Text)</option>
                  <option value="manual">Manual Record</option>
                  <option value="print">Print Notice</option>
                </select>
              </div>
            </div>

            {/* Contextual Target Dropdowns */}
            {audienceType === 'programme_guardians' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Programme *</label>
                <select
                  value={selectedProgrammeId}
                  onChange={e => setSelectedProgrammeId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="">-- Choose Programme --</option>
                  {programmes.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {audienceType === 'group_guardians' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Group / Class *</label>
                <select
                  value={selectedGroupId}
                  onChange={e => setSelectedGroupId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="">-- Choose Group --</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}

            {(audienceType === 'event_participants' || audienceType === 'event_staff' || audienceType === 'missing_consent') && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Event *</label>
                <select
                  value={selectedEventId}
                  onChange={e => setSelectedEventId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="">-- Choose Event --</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.name} ({ev.startDate})</option>
                  ))}
                </select>
              </div>
            )}

            {audienceType === 'single_guardian' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Guardian ID *</label>
                <input
                  type="text"
                  value={selectedGuardianId}
                  onChange={e => setSelectedGuardianId(e.target.value)}
                  placeholder="Enter Guardian ID"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            )}

            {audienceType === 'single_learner' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Learner ID *</label>
                <input
                  type="text"
                  value={selectedLearnerId}
                  onChange={e => setSelectedLearnerId(e.target.value)}
                  placeholder="Enter Learner ID"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            )}

            {/* Audience Stats Banner */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800">
                  {resolving ? 'Resolving recipients...' : `Audience: ${resolvedAudience.totalCount} recipients resolved`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {channel === 'email' && (
                  <span className={resolvedAudience.missingEmailCount > 0 ? 'text-amber-700 font-semibold' : 'text-slate-500'}>
                    Missing Email: {resolvedAudience.missingEmailCount}
                  </span>
                )}
                {(channel === 'whatsapp' || channel === 'sms') && (
                  <span className={resolvedAudience.missingPhoneCount > 0 ? 'text-amber-700 font-semibold' : 'text-slate-500'}>
                    Missing Phone: {resolvedAudience.missingPhoneCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Content & Templates */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> 2. Message Content
              </h2>
              {templates.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Use Template:</span>
                  <select
                    value={selectedTemplateId}
                    onChange={e => handleTemplateChange(e.target.value)}
                    className="px-2.5 py-1 border border-slate-300 rounded-md text-xs"
                  >
                    <option value="">-- Custom Message --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {channel === 'email' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Important Notice Regarding Rehearsal"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium"
                />
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-600">Message Body *</label>
                {channel === 'sms' && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    {body.length} chars (~{Math.ceil(body.length / 160) || 1} segments)
                  </span>
                )}
              </div>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                required
                rows={6}
                placeholder="Write your message here... Use {{variable}} tags to personalise."
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-xs leading-relaxed font-sans"
              />
            </div>

            {/* Merge Tags Chips */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Insert Merge Field:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {MERGE_VARIABLES.map(v => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => handleInsertVariable(v.tag)}
                    className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-md text-[11px] font-mono border border-slate-200 transition-colors"
                  >
                    + {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 3: Attachments */}
          {documents.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-indigo-600" /> 3. Attach Documents (Optional)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                {documents.map(doc => (
                  <label
                    key={doc.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      selectedDocIds.includes(doc.id) 
                        ? 'bg-indigo-50/70 border-indigo-300 text-indigo-900 font-semibold' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocIds.includes(doc.id)}
                      onChange={() => handleToggleDocument(doc.id)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="truncate">{doc.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Live Verification & Preview */}
          <div className="bg-slate-900 text-slate-100 p-6 rounded-xl shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Recipient Preview</h3>
              </div>
              <span className="text-xs text-slate-400">
                Sample preview for: <strong className="text-slate-200">{firstRecipient?.recipientName || 'Recipient'}</strong>
              </span>
            </div>

            {/* Missing Variables Warning */}
            {previewBodyResult.missingVariables.length > 0 && (
              <div className="p-3 bg-amber-950/80 border border-amber-700 text-amber-200 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Warning:</strong> The following variables could not be resolved for all recipients: {previewBodyResult.missingVariables.map(v => `{{${v}}}`).join(', ')}. Please verify before sending.
                </span>
              </div>
            )}

            {channel === 'email' && previewSubjectResult && (
              <div>
                <span className="text-[11px] text-slate-400 block font-mono">Subject Preview:</span>
                <p className="text-xs font-semibold text-white mt-0.5">{previewSubjectResult.resolvedText || '(Empty subject)'}</p>
              </div>
            )}

            <div>
              <span className="text-[11px] text-slate-400 block font-mono">Body Preview:</span>
              <div className="mt-1 p-4 bg-slate-950/70 rounded-lg border border-slate-800 font-sans text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {previewBodyResult.resolvedText || '(No message body)'}
              </div>
            </div>

            {channel === 'whatsapp' && (
              <div className="p-3 bg-slate-800/80 rounded-lg text-xs text-slate-300 flex items-center justify-between">
                <div>
                  <strong>WhatsApp Protocol:</strong> Prepared message links will be generated. Status is strictly saved as <em>Prepared</em> until manual/API confirmation.
                </div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => navigate('/communication')}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={dispatchLoading || resolvedAudience.recipients.length === 0 || !body.trim()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
              {dispatchLoading ? 'Processing...' : channel === 'whatsapp' || channel === 'sms' ? `Prepare ${channel.toUpperCase()} (${resolvedAudience.totalCount})` : `Send Message (${resolvedAudience.totalCount})`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
