import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ChevronRight, FileCheck2, CreditCard } from 'lucide-react';
import { useGuardianLearners } from '../../../hooks/useGuardianLearners';

export const GuardianLearnersPage: React.FC = () => {
  const { learners, loading, error } = useGuardianLearners();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-semibold">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Family Directory
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-1">My Linked Learners</h1>
        <p className="text-sm text-slate-500">
          View enrolled arts disciplines, attendance compliance, and active classes for your children.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {learners.map(learner => (
          <div
            key={learner.id}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-sm">
                    {learner.firstName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {learner.preferredName || learner.firstName} {learner.lastName}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="capitalize">{learner.relationshipType}</span>
                      {learner.financialContact && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200">
                          Financial Contact
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attendance</span>
                  <span className={`text-xl font-black ${learner.attendanceRate >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {learner.attendanceRate.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Programmes */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Enrolled Programmes
                </div>
                {learner.programmes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No active programme enrolments</p>
                ) : (
                  <div className="space-y-1.5">
                    {learner.programmes.map(p => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-indigo-500" />
                          <span className="font-bold text-slate-800">{p.name}</span>
                        </div>
                        {p.groupName && (
                          <span className="text-slate-500 font-medium">{p.groupName}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 pt-2">
                {learner.outstandingConsentCount > 0 && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>{learner.outstandingConsentCount} Consent Action Required</span>
                  </span>
                )}
                {learner.balanceDueCents > 0 && learner.financialContact && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                    <span>Due: R{(learner.balanceDueCents / 100).toFixed(2)}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
              <Link
                to={`/portal/learners/${learner.id}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors"
              >
                <span>View Full Profile & Timetable</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
