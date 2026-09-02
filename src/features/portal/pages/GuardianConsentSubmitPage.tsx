import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Send 
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useGuardianPortal } from '../../../hooks/useGuardianPortal';
import { guardianPortalService } from '../../../services/guardianPortalService';
import type { GuardianConsentDetailDto } from '../../../types';

export const GuardianConsentSubmitPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const { authUser, organisationId } = useAuth();
  const { context } = useGuardianPortal();
  const navigate = useNavigate();

  const [consentReq, setConsentReq] = useState<GuardianConsentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [participationApproved, setParticipationApproved] = useState(true);
  const [transportApproved, setTransportApproved] = useState(true);
  const [indemnityAccepted, setIndemnityAccepted] = useState(false);
  const [medicalDeclaration, setMedicalDeclaration] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  useEffect(() => {
    if (!authUser || !organisationId || !requestId) return;
    guardianPortalService.getConsentList(organisationId, authUser.uid)
      .then(list => {
        const found = list.find(c => c.requestId === requestId);
        if (found) {
          setConsentReq(found);
          if (found.participationApproved !== undefined) setParticipationApproved(found.participationApproved);
          if (found.transportApproved !== undefined) setTransportApproved(found.transportApproved);
          if (found.indemnityAccepted !== undefined) setIndemnityAccepted(found.indemnityAccepted);
          if (found.medicalDeclaration) setMedicalDeclaration(found.medicalDeclaration);
          if (found.additionalInfo) setAdditionalInfo(found.additionalInfo);
        } else {
          setError('Consent request not found.');
        }
      })
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [authUser, organisationId, requestId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !organisationId || !requestId || !consentReq) return;

    if (consentReq.requiresIndemnity && !indemnityAccepted && participationApproved) {
      setError('You must read and accept the indemnity conditions to approve participation.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await guardianPortalService.submitConsent(organisationId, authUser.uid, requestId, {
        participationApproved,
        transportApproved: consentReq.requiresTransportApproval ? transportApproved : undefined,
        indemnityAccepted: consentReq.requiresIndemnity ? indemnityAccepted : undefined,
        medicalDeclaration: medicalDeclaration.trim() || undefined,
        additionalInfo: additionalInfo.trim() || undefined
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/portal/consent');
      }, 2500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !consentReq) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-rose-800 text-sm font-semibold flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
          <p>{error}</p>
        </div>
        <div className="mt-4">
          <Link to="/portal/consent" className="text-xs font-bold text-indigo-600 flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            <span>Return to Consents</span>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Consent Submitted!</h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Your response has been securely recorded and transmitted to the organisation.
        </p>
        <div className="text-xs text-slate-400">Redirecting to consents...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <Link to="/portal/consent" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Consents</span>
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Official Consent Form
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-1">{consentReq?.eventTitle}</h1>
        <p className="text-sm text-slate-500">
          Consent form for <strong>{consentReq?.learnerName}</strong>.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Event Details Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-900">{consentReq?.eventDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{consentReq?.eventVenue}</span>
          </div>
        </div>
        {consentReq?.deadline && (
          <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
            Please submit this response by <strong>{consentReq.deadline}</strong>.
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Participation Option */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Participation Decision</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
              participationApproved
                ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                : 'border-slate-200 hover:bg-slate-50'
            }`}>
              <input
                type="radio"
                name="participation"
                checked={participationApproved}
                onChange={() => setParticipationApproved(true)}
                className="mt-1 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="text-sm font-bold text-slate-900">Approve Participation</div>
                <div className="text-xs text-slate-500 mt-0.5">My child will attend this event.</div>
              </div>
            </label>

            <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
              !participationApproved
                ? 'border-rose-600 bg-rose-50/50 shadow-sm'
                : 'border-slate-200 hover:bg-slate-50'
            }`}>
              <input
                type="radio"
                name="participation"
                checked={!participationApproved}
                onChange={() => setParticipationApproved(false)}
                className="mt-1 text-rose-600 focus:ring-rose-500"
              />
              <div>
                <div className="text-sm font-bold text-slate-900">Decline Participation</div>
                <div className="text-xs text-slate-500 mt-0.5">My child will not attend.</div>
              </div>
            </label>
          </div>
        </div>

        {participationApproved && (
          <>
            {/* Transport Consent if required */}
            {consentReq?.requiresTransportApproval && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                <h2 className="text-base font-bold text-slate-900">Transport Authorization</h2>
                <p className="text-xs text-slate-500">
                  Authorise your child to travel on organisation-arranged group transport.
                </p>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="transport"
                      checked={transportApproved}
                      onChange={() => setTransportApproved(true)}
                      className="text-indigo-600"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Yes, my child will use organisation transport
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="transport"
                      checked={!transportApproved}
                      onChange={() => setTransportApproved(false)}
                      className="text-indigo-600"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      No, I will provide private transport for my child
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Medical Declarations if required */}
            {consentReq?.requiresMedicalDeclaration && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-2">
                <h2 className="text-base font-bold text-slate-900">Medical Notes for this Event</h2>
                <p className="text-xs text-slate-500">
                  Please list any temporary medical requirements, allergies, or medication required during this event.
                </p>
                <textarea
                  rows={3}
                  value={medicalDeclaration}
                  onChange={e => setMedicalDeclaration(e.target.value)}
                  placeholder="e.g. Needs asthma inhaler before strenuous rehearsal"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 resize-none mt-2"
                />
              </div>
            )}

            {/* Indemnity Clause if required */}
            {consentReq?.requiresIndemnity && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-slate-900">Indemnity Agreement</h2>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 max-h-40 overflow-y-auto leading-relaxed">
                  {consentReq.indemnityText ||
                    'I hereby give permission for my child to participate in this event and agree to indemnify the organisation, its staff, and agents against any claims, losses, or damages arising during the event, save in the event of gross negligence.'}
                </div>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors mt-2">
                  <input
                    type="checkbox"
                    required
                    checked={indemnityAccepted}
                    onChange={e => setIndemnityAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="text-xs font-bold text-slate-900 leading-snug">
                    I have read, understood, and agree to the indemnity terms above.
                  </span>
                </label>
              </div>
            )}

            {/* Additional Info */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Additional Comments / Special Instructions
              </label>
              <textarea
                rows={2}
                value={additionalInfo}
                onChange={e => setAdditionalInfo(e.target.value)}
                placeholder="Any other notes for event supervisors..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </>
        )}

        {/* Digital Signature Confirmation */}
        <div className="p-4 bg-slate-100 rounded-2xl text-xs text-slate-500">
          Digital submission signed by: <strong>{context?.guardian.firstName} {context?.guardian.lastName}</strong> ({context?.guardian.email}).
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>{submitting ? 'Submitting...' : 'Submit Consent'}</span>
        </button>
      </form>
    </div>
  );
};
