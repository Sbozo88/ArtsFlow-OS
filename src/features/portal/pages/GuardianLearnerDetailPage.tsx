import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Clock, 
  MapPin, 
  CheckSquare, 
  ChevronLeft, 
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { guardianPortalService } from '../../../services/guardianPortalService';
import type { 
  GuardianLearnerSummaryDto, 
  GuardianProgrammeInfoDto, 
  GuardianSessionDto 
} from '../../../types';

export const GuardianLearnerDetailPage: React.FC = () => {
  const { learnerId } = useParams<{ learnerId: string }>();
  const { authUser, organisationId } = useAuth();

  const [detail, setDetail] = useState<{
    learner: GuardianLearnerSummaryDto;
    programmes: GuardianProgrammeInfoDto[];
    upcomingSessions: GuardianSessionDto[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser || !organisationId || !learnerId) return;
    guardianPortalService.getLearnerDetail(organisationId, authUser.uid, learnerId)
      .then(setDetail)
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [authUser, organisationId, learnerId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800">
          <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
          <p className="text-sm font-semibold">{error || 'Learner record not found.'}</p>
        </div>
        <div className="mt-4">
          <Link to="/portal/learners" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Learners</span>
          </Link>
        </div>
      </div>
    );
  }

  const { learner, programmes, upcomingSessions } = detail;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Link to="/portal/learners" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        <span>All Learners</span>
      </Link>

      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-sm">
            {learner.firstName.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {learner.preferredName || learner.firstName} {learner.lastName}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              <span>DOB: {learner.dateOfBirth || 'Not recorded'}</span>
              <span>•</span>
              <span className="capitalize">{learner.relationshipType}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/portal/attendance"
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            <span>Attendance: {learner.attendanceRate.toFixed(0)}%</span>
          </Link>
        </div>
      </div>

      {/* Enrolled Programmes */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <GraduationCap className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Programmes & Classes</h2>
        </div>

        {programmes.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No active enrolments</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programmes.map(p => (
              <div key={p.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {p.type}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                {p.groupName && <p className="text-xs text-slate-600">Group: {p.groupName}</p>}
                {p.venue && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{p.venue}</span>
                  </div>
                )}
                {p.schedule && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{p.schedule}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Timetable */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Upcoming Timetable</h2>
        </div>

        {upcomingSessions.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No upcoming sessions scheduled in the next 30 days.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcomingSessions.map(s => (
              <div key={s.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-slate-900">{s.programmeName}</div>
                  <div className="text-xs text-slate-500">{s.groupName || s.sessionType}</div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <div className="font-semibold text-slate-900">{s.sessionDate}</div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{s.startTime} - {s.endTime}</span>
                  </div>
                  {s.venue && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.venue}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
