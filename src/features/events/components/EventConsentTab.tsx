import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useConsentTemplates } from '../../../hooks/useConsentTemplates';
import { useConsentRequests } from '../../../hooks/useConsentRequests';
import { useConsentSubmissions } from '../../../hooks/useConsentSubmissions';
import { useEventConsentReadiness } from '../../../hooks/useEventConsentReadiness';
import { useEventParticipants } from '../../../hooks/useEventParticipants';
import { useLearners } from '../../../hooks/useLearners';
import { useGuardians } from '../../../hooks/useGuardians';
import { consentRequestService } from '../../../services/consentRequestService';
import { consentSubmissionService } from '../../../services/consentSubmissionService';
import { 
  FileCheck, 
  CheckCircle2, 
  XCircle, 
  Send, 
  ShieldAlert, 
  Link as LinkIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface EventConsentTabProps {
  eventId: string;
}

export const EventConsentTab: React.FC<EventConsentTabProps> = ({ eventId }) => {
  const { organisationId, user } = useAuth();
  const { templates } = useConsentTemplates();
  const { requests, refresh: refreshRequests } = useConsentRequests(eventId);
  const { submissions, refresh: refreshSubmissions } = useConsentSubmissions(eventId);
  const { readinessList, refresh: refreshReadiness } = useEventConsentReadiness(eventId);
  const { participants } = useEventParticipants(eventId);
  const { learners } = useLearners();
  const { guardians } = useGuardians();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const learnerMap = new Map(learners.map(l => [l.id, l]));
  const guardianMap = new Map(guardians.map(g => [g.id, g]));
  const templateMap = new Map(templates.map(t => [t.id, t]));

  // Calculate Metrics
  const totalParticipants = participants.length;
  const approvedCount = requests.filter(r => r.requestStatus === 'approved').length;
  const submittedCount = requests.filter(r => r.requestStatus === 'submitted').length;
  const pendingCount = requests.filter(r => ['pending', 'sent'].includes(r.requestStatus)).length;
  const declinedCount = requests.filter(r => r.requestStatus === 'declined').length;
  const missingCount = participants.filter(p => {
    const req = requests.find(r => r.learnerId === p.learnerId);
    return !req || req.requestStatus === 'pending' || req.requestStatus === 'declined';
  }).length;

  // Safeguarding Alerts
  const medicalAlerts = submissions.filter(
    s => s.submissionStatus !== 'superseded' && (s.medicalConditions || s.allergies || s.medication)
  );

  const handleGenerateRequests = async () => {
    if (!organisationId || !user || !selectedTemplateId) return;
    setIsGenerating(true);
    setGenerateMessage(null);
    try {
      const result = await consentRequestService.generateRequestsForConfirmedParticipants(
        organisationId,
        eventId,
        selectedTemplateId,
        user.uid,
        dueDate || undefined
      );
      setGenerateMessage(`Created ${result.created} new request(s). Skipped ${result.skipped} already active.`);
      refreshRequests();
      refreshReadiness();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setGenerateMessage(`Error: ${err.message}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVerify = async (submissionId: string) => {
    if (!organisationId || !user) return;
    setActionLoading(submissionId);
    try {
      await consentSubmissionService.verifySubmission(organisationId, submissionId, user.uid);
      refreshSubmissions();
      refreshRequests();
      refreshReadiness();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error verifying submission');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (submissionId: string) => {
    const reason = prompt('Reason for declining this consent submission:');
    if (reason === null) return;
    if (!organisationId || !user) return;

    setActionLoading(submissionId);
    try {
      await consentSubmissionService.declineSubmission(organisationId, submissionId, user.uid, reason);
      refreshSubmissions();
      refreshRequests();
      refreshReadiness();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error declining submission');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(r => {
    if (statusFilter !== 'all' && r.requestStatus !== statusFilter) return false;
    if (searchFilter) {
      const learner = learnerMap.get(r.learnerId);
      const name = `${learner?.firstName || ''} ${learner?.lastName || ''}`.toLowerCase();
      if (!name.includes(searchFilter.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Participants</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalParticipants}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Pending</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Submitted</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{submittedCount}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Approved</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{approvedCount}</p>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">Declined</p>
          <p className="text-2xl font-bold text-rose-700 mt-1">{declinedCount}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">Missing</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{missingCount}</p>
        </div>
      </div>

      {/* Safeguarding Warnings */}
      {medicalAlerts.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <h4 className="text-sm font-semibold text-amber-800">
              Safeguarding & Medical Declarations ({medicalAlerts.length})
            </h4>
          </div>
          <div className="mt-2 space-y-1 text-xs text-amber-900">
            {medicalAlerts.map(alert => {
              const l = learnerMap.get(alert.learnerId);
              return (
                <div key={alert.id} className="flex items-start space-x-2 py-1 border-t border-amber-200">
                  <span className="font-semibold">{l ? `${l.firstName} ${l.lastName}` : 'Learner'}:</span>
                  <span>
                    {alert.allergies && `Allergies: ${alert.allergies}. `}
                    {alert.medicalConditions && `Conditions: ${alert.medicalConditions}. `}
                    {alert.medication && `Medication: ${alert.medication}. `}
                    {alert.emergencyContactName && `Emergency Contact: ${alert.emergencyContactName} (${alert.emergencyContactPhone || 'No phone'}).`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Request Generation Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Send className="w-4 h-4 text-indigo-600" /> Generate Consent Requests
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Consent Template</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Select Template --</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.consentType.replace('_', ' ')})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Due Date (Optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-sm border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <button
              onClick={handleGenerateRequests}
              disabled={isGenerating || !selectedTemplateId}
              className="w-full inline-flex justify-center items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-md shadow-sm transition"
            >
              {isGenerating ? 'Generating...' : 'Generate for All Confirmed'}
            </button>
          </div>
        </div>
        {generateMessage && (
          <p className="text-xs text-indigo-700 mt-2 font-medium">{generateMessage}</p>
        )}
      </div>

      {/* Requests & Submissions Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-slate-600" />
            <h3 className="text-base font-semibold text-slate-800">Consent Requests & Submissions</h3>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Search learner..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold">
              <tr>
                <th className="py-3 px-4 text-left">Learner</th>
                <th className="py-3 px-4 text-left">Guardian</th>
                <th className="py-3 px-4 text-left">Template</th>
                <th className="py-3 px-4 text-center">Participation</th>
                <th className="py-3 px-4 text-center">Transport</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Public Link</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500 text-xs">
                    No consent requests match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => {
                  const learner = learnerMap.get(req.learnerId);
                  const guardian = req.guardianId ? guardianMap.get(req.guardianId) : null;
                  const template = templateMap.get(req.templateId);
                  const sub = submissions.find(s => s.consentRequestId === req.id && s.submissionStatus !== 'superseded');

                  return (
                    <tr key={req.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {learner ? `${learner.firstName} ${learner.lastName}` : req.learnerId}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {sub?.guardianName || (guardian ? `${guardian.firstName} ${guardian.lastName}` : 'Not assigned')}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {template?.name || 'General'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {sub ? (
                          sub.participationApproved ? (
                            <span className="inline-flex items-center text-emerald-600 font-semibold text-xs gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-rose-600 font-semibold text-xs gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Declined
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {sub ? (
                          sub.transportApproved ? (
                            <span className="inline-flex items-center text-emerald-600 font-semibold text-xs gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-rose-600 font-semibold text-xs gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Declined
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          req.requestStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          req.requestStatus === 'submitted' ? 'bg-blue-100 text-blue-800' :
                          req.requestStatus === 'declined' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {req.requestStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          to={`/consent/submit/${req.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          <LinkIcon className="w-3.5 h-3.5" /> Open Form
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {sub && sub.submissionStatus === 'submitted' && (
                          <>
                            <button
                              onClick={() => handleVerify(sub.id)}
                              disabled={actionLoading === sub.id}
                              className="text-xs px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium shadow-sm transition"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => handleDecline(sub.id)}
                              disabled={actionLoading === sub.id}
                              className="text-xs px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium shadow-sm transition"
                            >
                              Decline
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Participant Operational Readiness Matrix */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
        <h3 className="text-base font-semibold text-slate-800 mb-2">Participant Operational Readiness</h3>
        <p className="text-xs text-slate-500 mb-4">
          Live derived readiness based on actual confirmation, consent verification, and transport assignment.
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="py-2.5 px-3 text-left">Learner</th>
                <th className="py-2.5 px-3 text-center">Participant Confirmed</th>
                <th className="py-2.5 px-3 text-center">Consent Approved</th>
                <th className="py-2.5 px-3 text-center">Transport Consent</th>
                <th className="py-2.5 px-3 text-center">Seat Assigned</th>
                <th className="py-2.5 px-3 text-center">Overall Readiness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {readinessList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400">
                    No participants enrolled for this event yet.
                  </td>
                </tr>
              ) : (
                readinessList.map(r => {
                  const learner = learnerMap.get(r.learnerId);
                  return (
                    <tr key={r.participantId} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {learner ? `${learner.firstName} ${learner.lastName}` : r.learnerId}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {r.isConfirmed ? (
                          <span className="text-emerald-600 font-bold">✓</span>
                        ) : (
                          <span className="text-amber-500 font-medium">Pending</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {r.isConsentApproved ? (
                          <span className="text-emerald-600 font-bold">✓</span>
                        ) : (
                          <span className="text-rose-500 font-medium">Pending</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {r.hasTransportConsent ? (
                          <span className="text-emerald-600 font-bold">✓</span>
                        ) : (
                          <span className="text-slate-400">None / No</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {r.isTransportAssigned ? (
                          <span className="text-emerald-600 font-bold">✓ Assigned</span>
                        ) : (
                          <span className="text-amber-500">Unassigned</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {r.overallReady ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded-full">
                            Ready
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-semibold rounded-full">
                            Action Needed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
