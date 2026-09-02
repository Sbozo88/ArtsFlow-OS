import React from 'react';
import { Bus, MapPin, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useGuardianPortal } from '../../../hooks/useGuardianPortal';
import { useGuardianTransport } from '../../../hooks/useGuardianTransport';

export const GuardianTransportPage: React.FC = () => {
  const { selectedLearner, selectedLearnerId } = useGuardianPortal();
  const { plans, loading, error } = useGuardianTransport(selectedLearnerId);

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
            Travel & Logistics
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-1">
          Transport Itinerary — {selectedLearner?.preferredName || selectedLearner?.firstName || 'Learner'}
        </h1>
        <p className="text-sm text-slate-500">
          Departure times, meeting points, return schedules, and live boarding status for performance tours.
        </p>
      </div>

      {plans.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Bus className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">No Transport Bookings</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are currently no active transport itineraries or bus allocations assigned to this learner.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map(plan => (
            <div
              key={plan.planId}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {plan.eventTitle}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">{plan.planName}</h2>
                </div>

                {/* Boarding Status Badge */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    plan.boardingStatus === 'boarded'
                      ? 'bg-emerald-100 text-emerald-800'
                      : plan.boardingStatus === 'planned'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {plan.boardingStatus === 'boarded' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Boarding: {plan.boardingStatus}</span>
                  </span>

                  {plan.returnStatus && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      Return: {plan.returnStatus}
                    </span>
                  )}
                </div>
              </div>

              {/* Itinerary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outbound Journey</div>
                  <div className="flex items-start gap-2 text-slate-800 font-semibold">
                    <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <div>Pickup: {plan.pickupLocation}</div>
                      <div className="text-slate-500 font-normal">Destination: {plan.destination}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 pt-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Depart: {plan.departureDate} at {plan.departureTime}</span>
                    </div>
                  </div>
                  {plan.meetingTime && (
                    <div className="text-[11px] text-indigo-700 font-bold">
                      Meeting time: {plan.meetingTime}
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Return Journey</div>
                  {plan.returnTime ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-slate-800 font-semibold">
                        <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span>Return: {plan.returnDate || plan.departureDate} at {plan.returnTime}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Arrival back at {plan.pickupLocation}.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">One-way transfer or return schedule TBD.</p>
                  )}
                  {plan.seatNumber && (
                    <div className="text-xs font-semibold text-slate-700 pt-1">
                      Allocated Seat: <span className="font-bold text-indigo-600">{plan.seatNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {plan.notes && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                  <strong>Notice:</strong> {plan.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
