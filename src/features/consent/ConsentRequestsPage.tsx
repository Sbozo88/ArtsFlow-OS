import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useConsentRequests } from '../../hooks/useConsentRequests';
import { useConsentSubmissions } from '../../hooks/useConsentSubmissions';
import { useConsentTemplates } from '../../hooks/useConsentTemplates';
import { useEvents } from '../../hooks/useEvents';
import { useLearners } from '../../hooks/useLearners';
import { useGuardians } from '../../hooks/useGuardians';
import { consentSubmissionService } from '../../services/consentSubmissionService';
import { 
  FileCheck, 
  CheckCircle2, 
  XCircle, 
  Link as LinkIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ConsentRequestsPage: React.FC = () => {
  const { organisationId, user } = useAuth();
  const { requests, loading: requestsLoading, refresh: refreshRequests } = useConsentRequests();
  const { submissions, refresh: refreshSubmissions } = useConsentSubmissions();
  const { templates } = useConsentTemplates();
  const { events } = useEvents();
  const { learners } = useLearners();
  const { guardians } = useGuardians();

  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const learnerMap = new Map(learners.map(l => [l.id, l]));
  const guardianMap = new Map(guardians.map(g => [g.id, g]));
  const eventMap = new Map(events.map(e => [e.id, e]));
  const templateMap = new Map(templates.map(t => [t.id, t]));

  const filteredRequests = requests.filter(r => {
    if (selectedEventId !== 'all' && r.eventId !== selectedEventId) return false;
    if (selectedStatus !== 'all' && r.requestStatus !== selectedStatus) return false;
    if (search) {
      const l = learnerMap.get(r.learnerId);
      const name = `${l?.firstName || ''} ${l?.lastName || ''}`.toLowerCase();
      if (!name.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const handleVerify = async (submissionId: string) => {
    if (!organisationId || !user) return;
    setActionLoading(submissionId);
    try {
      await consentSubmissionService.verifySubmission(organisationId, submissionId, user.uid);
      refreshSubmissions();
      refreshRequests();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error verifying');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (submissionId: string) => {
    const reason = prompt('Reason for declining:');
    if (reason === null) return;
    if (!organisationId || !user) return;

    setActionLoading(submissionId);
    try {
      await consentSubmissionService.declineSubmission(organisationId, submissionId, user.uid, reason);
      refreshSubmissions();
      refreshRequests();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error declining');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FileCheck className="w-7 h-7 text-indigo-600" /> Consent Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Central operational register of consent requests, parent submissions, and verification workflows.
          </p>
        </div>

        <Link
          to="/consent/templates"
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-md shadow-sm transition"
        >
          Manage Templates
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by learner name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs border border-slate-300 rounded px-3 py-1.5 w-60"
          />

          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="text-xs border border-slate-300 rounded px-3 py-1.5"
          >
            <option value="all">All Events</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-slate-300 rounded px-3 py-1.5"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted (Awaiting Review)</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
          </select>
        </div>

        <p className="text-xs text-slate-500">
          Showing {filteredRequests.length} of {requests.length} total requests
        </p>
      </div>

      {/* Requests Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold">
              <tr>
                <th className="py-3 px-4 text-left">Learner</th>
                <th className="py-3 px-4 text-left">Event</th>
                <th className="py-3 px-4 text-left">Template</th>
                <th className="py-3 px-4 text-left">Guardian</th>
                <th className="py-3 px-4 text-center">Participation</th>
                <th className="py-3 px-4 text-center">Transport</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Public Link</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {requestsLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">Loading consent requests...</td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">No consent requests found.</td>
                </tr>
              ) : (
                filteredRequests.map(req => {
                  const learner = learnerMap.get(req.learnerId);
                  const guardian = req.guardianId ? guardianMap.get(req.guardianId) : null;
                  const event = eventMap.get(req.eventId);
                  const template = templateMap.get(req.templateId);
                  const sub = submissions.find(s => s.consentRequestId === req.id && s.submissionStatus !== 'superseded');

                  return (
                    <tr key={req.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {learner ? `${learner.firstName} ${learner.lastName}` : req.learnerId}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs font-medium">
                        {event?.name || req.eventId}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {template?.name || 'General'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {sub?.guardianName || (guardian ? `${guardian.firstName} ${guardian.lastName}` : 'Unassigned')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {sub ? (
                          sub.participationApproved ? (
                            <span className="inline-flex items-center text-emerald-600 font-semibold text-xs gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-rose-600 font-semibold text-xs gap-1">
                              <XCircle className="w-3.5 h-3.5" /> No
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
                              <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-rose-600 font-semibold text-xs gap-1">
                              <XCircle className="w-3.5 h-3.5" /> No
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
                          <LinkIcon className="w-3.5 h-3.5" /> Form Link
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
    </div>
  );
};
