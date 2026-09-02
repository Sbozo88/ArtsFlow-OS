import { Link } from 'react-router-dom';
import { 
  CalendarDays, 
  ArrowLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Bus, 
  Users, 
  ShieldCheck 
} from 'lucide-react';
import { useDateRangeFilter } from '../../hooks/useDateRangeFilter';
import { useEventAnalytics } from '../../hooks/useEventAnalytics';
import { DateRangeSelector } from './components/DateRangeSelector';
import { MetricKpiCard } from './components/MetricKpiCard';

export function EventAnalyticsPage() {
  const { filter, setPreset, setCustomRange } = useDateRangeFilter();
  const { readiness, completedCount, upcomingCount, loading } = useEventAnalytics(filter.startDate, filter.endDate);

  const getReadinessBadge = (status: 'ready' | 'attention_needed' | 'critical') => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Operational Ready
          </span>
        );
      case 'attention_needed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Needs Attention
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Critical Deficiency
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/analytics" className="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back to Analytics
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-7 h-7 text-indigo-600" />
            <span>Event Operational Readiness & Compliance</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Pre-event auditing across participant consent, supervisor staffing, transport capacity, and schedule readiness.
          </p>
        </div>

        <DateRangeSelector
          filter={filter}
          onPresetChange={setPreset}
          onCustomChange={setCustomRange}
        />
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricKpiCard
          title="Upcoming Events"
          value={loading ? '...' : upcomingCount}
          subtitle="Scheduled on or after today"
          icon={<CalendarDays className="w-5 h-5" />}
          iconBg="bg-indigo-50 text-indigo-600"
        />

        <MetricKpiCard
          title="Past Events Completed"
          value={loading ? '...' : completedCount}
          subtitle="Successfully concluded"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />

        <MetricKpiCard
          title="Events Requiring Attention"
          value={loading ? '...' : readiness.filter(r => r.overallReadiness !== 'ready').length}
          subtitle="Deficiencies detected"
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg="bg-rose-50 text-rose-600"
          highlight={readiness.some(r => r.overallReadiness !== 'ready') ? 'urgent' : 'normal'}
        />
      </div>

      {/* Readiness Cards Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Upcoming Events Operational Scorecards</h2>

        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            Evaluating upcoming event readiness parameters...
          </div>
        ) : readiness.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            No upcoming events scheduled within the selected date window.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {readiness.map(ev => (
              <div
                key={ev.eventId}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{ev.eventName}</h3>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">Date: {ev.eventDate}</div>
                    </div>
                    {getReadinessBadge(ev.overallReadiness)}
                  </div>

                  {/* 4 Dimension Chips */}
                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Participants</div>
                        <div className="font-semibold text-slate-800">{ev.participantsCount} Registered</div>
                      </div>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-slate-500" />
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Consent</div>
                        <div className="font-semibold text-slate-800">
                          {ev.consentApproved} / {ev.consentTotal} Approved
                        </div>
                      </div>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2">
                      <Bus className="w-4 h-4 text-slate-500" />
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Transport</div>
                        <div className="font-semibold text-slate-800">
                          {ev.transportCapacity} seats ({ev.transportSeatsNeeded} booked)
                        </div>
                      </div>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Staff Supervision</div>
                        <div className="font-semibold text-slate-800">{ev.staffCount} Assigned</div>
                      </div>
                    </div>
                  </div>

                  {/* Issues List */}
                  {ev.readinessIssues.length > 0 && (
                    <div className="mt-4 p-3 bg-amber-50/50 rounded-lg border border-amber-200/60">
                      <div className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Action Required:</span>
                      </div>
                      <ul className="text-xs text-amber-900 list-disc list-inside space-y-0.5">
                        {ev.readinessIssues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                  <Link
                    to={`/events/${ev.eventId}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    <span>Manage Event Details</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
