import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getDocs, query, where } from 'firebase/firestore';
import { consentRequestRepository } from '../../repositories/consentRequestRepository';
import { eventRepository } from '../../repositories/eventRepository';
import { learnerRepository } from '../../repositories/learnerRepository';
import { consentTemplateRepository } from '../../repositories/consentTemplateRepository';
import { consentSubmissionService } from '../../services/consentSubmissionService';
import { ConsentRequest, Event, Learner, ConsentTemplate } from '../../types';
import { 
  CheckCircle2, 
  Shield, 
  Bus, 
  AlertCircle
} from 'lucide-react';

export const GuardianConsentPublicPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [request, setRequest] = useState<ConsentRequest | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [learner, setLearner] = useState<Learner | null>(null);
  const [template, setTemplate] = useState<ConsentTemplate | null>(null);

  // Form Fields
  const [participationApproved, setParticipationApproved] = useState<boolean>(true);
  const [transportApproved, setTransportApproved] = useState<boolean>(true);
  const [medicalConditions, setMedicalConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medication, setMedication] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [mediaConsent, setMediaConsent] = useState(true);
  const [indemnityAccepted, setIndemnityAccepted] = useState(false);
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('Parent');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadRequest = async () => {
      if (!requestId) {
        setError('No consent request ID provided.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Look up request across organisations defensively for this direct link
        const reqSnapshot = await consentRequestRepository.getCollection();
        const q = query(reqSnapshot, where('id', '==', requestId));
        const snap = await getDocs(q);

        if (snap.empty) {
          if (mounted) {
            setError('Consent request not found or link has expired.');
            setLoading(false);
          }
          return;
        }

        const reqData = snap.docs[0].data() as ConsentRequest;
        if (mounted) setRequest(reqData);

        // Load associated event, learner, and template
        const [ev, lr, tm] = await Promise.all([
          eventRepository.getById(reqData.organisationId, reqData.eventId),
          learnerRepository.getById(reqData.organisationId, reqData.learnerId),
          consentTemplateRepository.getById(reqData.organisationId, reqData.templateId)
        ]);

        if (mounted) {
          setEvent(ev);
          setLearner(lr);
          setTemplate(tm);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Error loading consent form');
          setLoading(false);
        }
      }
    };

    loadRequest();
    return () => { mounted = false; };
  }, [requestId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;

    if (!indemnityAccepted) {
      alert('Please acknowledge and accept the indemnity declaration to continue.');
      return;
    }

    if (!guardianName.trim()) {
      alert('Please enter your full name as signature.');
      return;
    }

    setIsSubmitting(true);
    try {
      await consentSubmissionService.submitConsent(
        request.organisationId,
        {
          consentRequestId: request.id,
          eventId: request.eventId,
          learnerId: request.learnerId,
          guardianId: request.guardianId,
          participationApproved,
          transportApproved,
          medicalConditions: medicalConditions || undefined,
          allergies: allergies || undefined,
          medication: medication || undefined,
          emergencyContactName: emergencyContactName || undefined,
          emergencyContactPhone: emergencyContactPhone || undefined,
          indemnityAccepted,
          mediaConsent,
          guardianName,
          guardianRelationship,
          signatureName: guardianName,
          signatureTimestamp: new Date().toISOString()
        },
        request.guardianId || 'guardian-public'
      );

      setSuccess(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to submit consent');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-sm w-full">
          <p className="text-slate-600 font-medium text-sm">Loading Consent Form...</p>
        </div>
      </div>
    );
  }

  if (error || !request || !event || !learner) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full border border-rose-200">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Unable to Load Consent Form</h2>
          <p className="text-xs text-slate-500 mt-2">{error || 'Invalid or expired consent request.'}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md w-full border border-emerald-200 space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Consent Form Submitted!</h2>
          <p className="text-xs text-slate-600">
            Thank you, <span className="font-semibold text-slate-800">{guardianName}</span>. Your consent decision for{' '}
            <span className="font-semibold text-slate-800">{learner.firstName} {learner.lastName}</span> attending{' '}
            <span className="font-semibold text-slate-800">{event.name}</span> has been securely recorded in ArtsFlow OS.
          </p>
          <div className="bg-slate-50 p-3 rounded text-xs text-slate-500 border border-slate-200 text-left space-y-1">
            <p>• Participation: <strong className={participationApproved ? 'text-emerald-700' : 'text-rose-700'}>{participationApproved ? 'Approved' : 'Declined'}</strong></p>
            <p>• Transport: <strong className={transportApproved ? 'text-emerald-700' : 'text-rose-700'}>{transportApproved ? 'Approved' : 'Declined'}</strong></p>
            <p>• Submission Timestamp: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-700 text-white p-6">
          <div className="flex items-center space-x-2 text-indigo-200 text-xs uppercase tracking-wider font-semibold">
            <Shield className="w-4 h-4" />
            <span>ArtsFlow OS • Secure Consent Portal</span>
          </div>
          <h1 className="text-2xl font-bold mt-2">{template?.title || 'Parent/Guardian Event Consent'}</h1>
          <p className="text-xs text-indigo-100 mt-1">
            Please review the details below and complete all required declarations for your learner.
          </p>
        </div>

        {/* Event & Learner Summary Banner */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block uppercase font-semibold text-[10px]">Learner</span>
            <span className="text-sm font-bold text-slate-900">{learner.firstName} {learner.lastName}</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-semibold text-[10px]">Event</span>
            <span className="text-sm font-bold text-slate-900">{event.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-semibold text-[10px]">Date & Time</span>
            <span className="text-slate-700 font-medium">
              {new Date(event.startDate).toLocaleDateString()} {event.startTime ? `at ${event.startTime}` : ''}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-semibold text-[10px]">Venue</span>
            <span className="text-slate-700 font-medium">{event.venue || 'To be communicated'}</span>
          </div>
        </div>

        {/* Consent Form Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs">
          {/* Participation Decision */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 block">
              1. Event Participation Consent *
            </label>
            <p className="text-slate-500 text-[11px]">
              Do you grant permission for {learner.firstName} {learner.lastName} to participate in {event.name}?
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setParticipationApproved(true)}
                className={`py-2.5 px-4 rounded-lg font-semibold border text-center transition ${
                  participationApproved
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                ✓ Yes, I Approve
              </button>
              <button
                type="button"
                onClick={() => setParticipationApproved(false)}
                className={`py-2.5 px-4 rounded-lg font-semibold border text-center transition ${
                  !participationApproved
                    ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                ✗ No, I Decline
              </button>
            </div>
          </div>

          {/* Transport Decision */}
          {(template?.requiresTransportApproval ?? true) && (
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Bus className="w-4 h-4 text-indigo-600" /> 2. Transport Permission *
              </label>
              <p className="text-slate-500 text-[11px]">
                Do you approve organised group transport (buses, shuttles, school vehicles) for this event?
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setTransportApproved(true)}
                  className={`py-2 px-4 rounded-lg font-semibold border text-center transition ${
                    transportApproved
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Approve Transport
                </button>
                <button
                  type="button"
                  onClick={() => setTransportApproved(false)}
                  className={`py-2 px-4 rounded-lg font-semibold border text-center transition ${
                    !transportApproved
                      ? 'bg-rose-50 border-rose-500 text-rose-800 ring-1 ring-rose-500'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Decline Transport (Private Travel)
                </button>
              </div>
            </div>
          )}

          {/* Medical & Emergency Declarations */}
          {(template?.requiresMedicalDeclaration ?? true) && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="text-sm font-bold text-slate-900 block">
                3. Medical & Health Declaration
              </label>
              <div className="space-y-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Known Medical Conditions</label>
                  <input
                    type="text"
                    placeholder="e.g. Asthma, Diabetes, or None"
                    value={medicalConditions}
                    onChange={(e) => setMedicalConditions(e.target.value)}
                    className="w-full border-slate-300 rounded px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Allergies</label>
                  <input
                    type="text"
                    placeholder="e.g. Peanuts, Penicillin, Bee stings, or None"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full border-slate-300 rounded px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Routine Medication Required During Event</label>
                  <input
                    type="text"
                    placeholder="e.g. Inhaler, Epipen, or None"
                    value={medication}
                    onChange={(e) => setMedication(e.target.value)}
                    className="w-full border-slate-300 rounded px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          {(template?.requiresEmergencyContact ?? true) && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="text-sm font-bold text-slate-900 block">
                4. Emergency Contact Details *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contact person's full name"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    className="w-full border-slate-300 rounded px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Contact Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 082 123 4567"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    className="w-full border-slate-300 rounded px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Media / Photo Consent */}
          {template?.requiresPhotoMediaConsent && (
            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mediaConsent}
                  onChange={(e) => setMediaConsent(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                />
                <span className="text-slate-700">
                  <strong>Photo & Video Consent:</strong> I grant permission for photographs and audio/video recordings of the learner during this performance to be used for educational and promotional materials.
                </span>
              </label>
            </div>
          )}

          {/* Indemnity Terms & Acceptance */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="text-sm font-bold text-slate-900 block">
              5. Indemnity & Code of Conduct Acknowledgement *
            </label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-600 max-h-32 overflow-y-auto leading-relaxed">
              {template?.bodyText || (
                <>
                  I, the undersigned parent/legal guardian, hereby grant permission for the above learner to participate in all activities associated with this event. I understand that reasonable precautions are taken for the safety and welfare of the learners. I indemnify and hold harmless the organisation, its staff, coaches, and agents against any claims arising from accidental injury, loss, or damage, while recognizing that staff will act in loco parentis in the event of an emergency.
                </>
              )}
            </div>
            <label className="flex items-start space-x-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                required
                checked={indemnityAccepted}
                onChange={(e) => setIndemnityAccepted(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
              />
              <span className="text-slate-800 font-semibold">
                I have read, understood, and accept the indemnity and consent conditions outlined above. *
              </span>
            </label>
          </div>

          {/* Guardian Signature */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <label className="text-sm font-bold text-slate-900 block">
              6. Guardian Electronic Signature *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Your Full Name (Electronic Signature) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nomvula Mokoena"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full border-slate-300 rounded px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Relationship to Learner *</label>
                <select
                  value={guardianRelationship}
                  onChange={(e) => setGuardianRelationship(e.target.value)}
                  className="w-full border-slate-300 rounded px-3 py-2 text-xs"
                >
                  <option value="Parent">Parent</option>
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Legal Guardian">Legal Guardian</option>
                  <option value="Grandparent">Grandparent</option>
                  <option value="Other">Other Family Member</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-6 border-t border-slate-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-lg shadow-md transition flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isSubmitting ? 'Submitting Consent...' : 'Submit Consent Declaration'}</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Protected by ArtsFlow OS. Submissions are digitally signed and recorded with immutable audit history.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
