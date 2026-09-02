import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, FileCheck2, Bus, ChevronRight, AlertCircle } from 'lucide-react';
import { useGuardianPortal } from '../../../hooks/useGuardianPortal';
import { useGuardianEvents } from '../../../hooks/useGuardianEvents';

export const GuardianEventsPage: React.FC = () => {
  const { selectedLearner, selectedLearnerId } = useGuardianPortal();
  const { events, loading, error } = useGuardianEvents(selectedLearnerId);

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Calendar & Performances
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-1">
          Events — {selectedLearner?.preferredName || selectedLearner?.firstName || 'Learner'}
        </h1>
        <p className="text-sm text-slate-500">
          Upcoming concerts, dance recitals, competitions, and rehearsals requiring attendance or consent.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">No Events Scheduled</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are currently no upcoming events or performances scheduled for this learner.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <div
              key={event.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 hover:border-indigo-200 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {event.eventType}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{event.startDate}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">{event.name}</h2>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-auto ${
                  event.participationStatus === 'confirmed' || event.participationStatus === 'registered'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {event.participationStatus}
                </span>
              </div>

              {event.description && (
                <p className="text-xs text-slate-600 leading-relaxed">{event.description}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{event.venue} {event.address ? `• ${event.address}` : ''}</span>
                </div>
                {event.startTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{event.startTime} {event.endTime ? `- ${event.endTime}` : ''}</span>
                  </div>
                )}
              </div>

              {/* Status Badges & Consent CTA */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {event.consentRequired && (
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                      event.consentStatus === 'approved' || event.consentStatus === 'submitted'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Consent: {event.consentStatus}</span>
                    </span>
                  )}

                  {event.transportAvailable && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1.5">
                      <Bus className="w-3.5 h-3.5" />
                      <span>Transport: {event.transportStatus}</span>
                    </span>
                  )}
                </div>

                {event.consentRequired && event.consentStatus === 'pending' && event.consentRequestId && (
                  <Link
                    to={`/portal/consent/${event.consentRequestId}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    <span>Submit Consent</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
