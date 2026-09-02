import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileCheck2, 
  Calendar, 
  CreditCard, 
  MessageSquare, 
  ChevronRight, 
  Clock, 
  MapPin, 
  GraduationCap, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { guardianPortalService } from '../../../services/guardianPortalService';
import type { GuardianDashboardDto } from '../../../types';

export const GuardianDashboardPage: React.FC = () => {
  const { authUser, organisationId } = useAuth();
  const [dashboard, setDashboard] = useState<GuardianDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser || !organisationId) return;
    guardianPortalService.getDashboard(organisationId, authUser.uid)
      .then(setDashboard)
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [authUser, organisationId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800">
          <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
          <p className="text-sm font-semibold">{error || 'Unable to load dashboard data.'}</p>
        </div>
      </div>
    );
  }

  const { guardian, actionCards, learners, nextUpcomingSession, nextUpcomingEvent } = dashboard;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>ArtsFlow Guardian Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {guardian.displayName}!
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Stay up to date with your {learners.length === 1 ? 'child\'s' : 'children\'s'} classes, upcoming rehearsals, event consent, and attendance.
          </p>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Consent Needed */}
        <Link
          to="/portal/consent"
          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            actionCards.pendingConsentCount > 0
              ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400 shadow-sm'
              : 'bg-white border-slate-200 hover:border-indigo-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              actionCards.pendingConsentCount > 0 ? 'bg-amber-500 text-white' : 'bg-indigo-50 text-indigo-600'
            }`}>
              <FileCheck2 className="w-5 h-5" />
            </div>
            {actionCards.pendingConsentCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 animate-pulse">
                Action Req.
              </span>
            )}
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{actionCards.pendingConsentCount}</div>
            <div className="text-xs font-bold text-slate-600 mt-0.5">Pending Consents</div>
          </div>
        </Link>

        {/* Upcoming Events */}
        <Link
          to="/portal/events"
          className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 shadow-sm transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{actionCards.upcomingEventsCount}</div>
            <div className="text-xs font-bold text-slate-600 mt-0.5">Upcoming Events</div>
          </div>
        </Link>

        {/* Balance Due */}
        <Link
          to="/portal/finance"
          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            actionCards.overdueInvoicesCount > 0
              ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-indigo-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              actionCards.overdueInvoicesCount > 0 ? 'bg-rose-500 text-white' : 'bg-indigo-50 text-indigo-600'
            }`}>
              <CreditCard className="w-5 h-5" />
            </div>
            {actionCards.overdueInvoicesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-200 text-rose-900">
                Overdue
              </span>
            )}
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              R{(actionCards.totalOutstandingBalanceCents / 100).toFixed(2)}
            </div>
            <div className="text-xs font-bold text-slate-600 mt-0.5">Outstanding Balance</div>
          </div>
        </Link>

        {/* Unread Messages */}
        <Link
          to="/portal/messages"
          className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 shadow-sm transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{actionCards.unreadNotificationsCount}</div>
            <div className="text-xs font-bold text-slate-600 mt-0.5">Notifications</div>
          </div>
        </Link>
      </div>

      {/* Up Next: Next Session & Event */}
      {(nextUpcomingSession || nextUpcomingEvent) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nextUpcomingSession && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Next Scheduled Class</span>
                </span>
                <span className="text-xs font-bold text-slate-500">{nextUpcomingSession.sessionDate}</span>
              </div>
              <div className="mt-3">
                <h3 className="text-base font-bold text-slate-900">{nextUpcomingSession.programmeName}</h3>
                {nextUpcomingSession.groupName && (
                  <p className="text-xs text-slate-500">{nextUpcomingSession.groupName}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{nextUpcomingSession.startTime} - {nextUpcomingSession.endTime}</span>
                  </div>
                  {nextUpcomingSession.venue && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{nextUpcomingSession.venue}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {nextUpcomingEvent && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Upcoming Event</span>
                </span>
                <span className="text-xs font-bold text-slate-500">{nextUpcomingEvent.startDate}</span>
              </div>
              <div className="mt-3">
                <h3 className="text-base font-bold text-slate-900">{nextUpcomingEvent.name}</h3>
                <p className="text-xs text-slate-500 capitalize">{nextUpcomingEvent.eventType}</p>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{nextUpcomingEvent.venue}</span>
                  </div>
                  {nextUpcomingEvent.consentRequired && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      nextUpcomingEvent.consentStatus === 'approved' || nextUpcomingEvent.consentStatus === 'submitted'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      Consent: {nextUpcomingEvent.consentStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Linked Learners Directory Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">Linked Learners</h2>
          <Link to="/portal/learners" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {learners.map(learner => (
            <Link
              key={learner.id}
              to={`/portal/learners/${learner.id}`}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                      {learner.firstName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {learner.preferredName || learner.firstName} {learner.lastName}
                      </h3>
                      <p className="text-xs text-slate-500 capitalize">{learner.relationshipType}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance</div>
                    <div className={`text-base font-black ${
                      learner.attendanceRate >= 80 ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {learner.attendanceRate.toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {learner.programmes.map(p => (
                    <span
                      key={p.id}
                      className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 flex items-center gap-1"
                    >
                      <GraduationCap className="w-3 h-3 text-slate-400" />
                      <span>{p.name}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-bold">
                <span>View Timetable & Records</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
