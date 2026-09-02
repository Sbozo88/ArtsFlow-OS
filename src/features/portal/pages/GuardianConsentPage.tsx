import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useGuardianPortal } from '../../../hooks/useGuardianPortal';
import { useGuardianConsent } from '../../../hooks/useGuardianConsent';

export const GuardianConsentPage: React.FC = () => {
  const { selectedLearner, selectedLearnerId } = useGuardianPortal();
  const { consents, loading, error } = useGuardianConsent(selectedLearnerId);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const pending = consents.filter(c => c.submissionStatus === 'pending');
  const completed = consents.filter(c => c.submissionStatus !== 'pending');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Permission & Indemnity
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-1">
          Consent Management — {selectedLearner?.preferredName || selectedLearner?.firstName || 'Learner'}
        </h1>
        <p className="text-sm text-slate-500">
          Review event participation forms, provide transport authorization, and accept legal indemnities.
        </p>
      </div>

      {/* Pending Consent Action Required Banner */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Action Required ({pending.length})</span>
          </div>

          <div className="space-y-3">
            {pending.map(req => (
              <div
                key={req.requestId}
                className="bg-amber-50/60 border border-amber-300 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900">
                      Pending Action
                    </span>
                    {req.deadline && (
                      <span className="text-xs font-bold text-amber-900">
                        Due by: {req.deadline}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{req.eventTitle}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                    <span>{req.eventDate}</span>
                    <span>•</span>
                    <span>{req.eventVenue}</span>
                  </div>
                </div>

                <Link
                  to={`/portal/consent/${req.requestId}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow"
                >
                  <span>Review & Complete Form</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Consents Archive */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Completed Consents</h2>

        {completed.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-xs text-slate-400 italic">
            No completed consent submissions recorded yet.
          </div>
        ) : (
          <div className="bg-white rounded-3xl divide-y divide-slate-100 border border-slate-200 overflow-hidden shadow-sm">
            {completed.map(sub => (
              <div key={sub.requestId} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">{sub.eventTitle}</h3>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Submitted by {sub.signedByGuardianName || 'Guardian'} {sub.signedAt ? `on ${sub.signedAt.split('T')[0]}` : ''}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    sub.submissionStatus === 'approved' || sub.submissionStatus === 'submitted'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {sub.submissionStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
