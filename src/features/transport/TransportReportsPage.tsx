import React, { useState } from 'react';
import { useEvents } from '../../hooks/useEvents';
import { useConsentRequests } from '../../hooks/useConsentRequests';
import { useConsentSubmissions } from '../../hooks/useConsentSubmissions';
import { useEventTransportPlans } from '../../hooks/useEventTransportPlans';
import { useTransportPassengers } from '../../hooks/useTransportPassengers';
import { useLearners } from '../../hooks/useLearners';
import { useStaff } from '../../hooks/useStaff';
import { useGuardians } from '../../hooks/useGuardians';
import { 
  FileSpreadsheet, 
  Printer
} from 'lucide-react';

type ReportType = 'consent_status' | 'missing_consent' | 'passenger_manifest' | 'transport_capacity' | 'transport_exceptions';

export const TransportReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('consent_status');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');

  const { events } = useEvents();
  const { requests } = useConsentRequests();
  const { submissions } = useConsentSubmissions();
  const { plans } = useEventTransportPlans();
  const { passengers } = useTransportPassengers();
  const { learners } = useLearners();
  const { staff } = useStaff();
  const { guardians } = useGuardians();

  const learnerMap = new Map(learners.map(l => [l.id, l]));
  const guardianMap = new Map(guardians.map(g => [g.id, g]));
  const eventMap = new Map(events.map(e => [e.id, e]));
  const planMap = new Map(plans.map(p => [p.id, p]));
  const staffMap = new Map(staff.map(s => [s.id, s]));

  const filteredRequests = selectedEventId === 'all' 
    ? requests 
    : requests.filter(r => r.eventId === selectedEventId);

  const filteredPlans = selectedEventId === 'all'
    ? plans
    : plans.filter(p => p.eventId === selectedEventId);

  const filteredPassengers = selectedEventId === 'all'
    ? passengers
    : passengers.filter(p => p.eventId === selectedEventId);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-indigo-600" /> Operational Transport & Consent Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Standardised compliance, safety audits, passenger manifests, and fleet capacity reports.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md shadow-sm transition"
        >
          <Printer className="w-4 h-4" /> Print / Export Report
        </button>
      </div>

      {/* Filter and Switcher */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="text-xs font-semibold border-slate-300 rounded px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="consent_status">1. Consent Status Report</option>
            <option value="missing_consent">2. Missing Consent Report</option>
            <option value="passenger_manifest">3. Passenger Manifest Report</option>
            <option value="transport_capacity">4. Transport Capacity Report</option>
            <option value="transport_exceptions">5. Transport Exceptions Report</option>
          </select>

          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="text-xs border-slate-300 rounded px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Events</option>
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Report Table Card */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden p-6 printable-report">
        {/* Report 1: Consent Status */}
        {reportType === 'consent_status' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Consent Status Report</h3>
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 text-left">Learner</th>
                  <th className="py-2.5 px-3 text-left">Event</th>
                  <th className="py-2.5 px-3 text-left">Guardian</th>
                  <th className="py-2.5 px-3 text-center">Participation</th>
                  <th className="py-2.5 px-3 text-center">Transport</th>
                  <th className="py-2.5 px-3 text-center">Submission Status</th>
                  <th className="py-2.5 px-3 text-right">Submitted Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map(r => {
                  const l = learnerMap.get(r.learnerId);
                  const ev = eventMap.get(r.eventId);
                  const sub = submissions.find(s => s.consentRequestId === r.id && s.submissionStatus !== 'superseded');
                  const g = r.guardianId ? guardianMap.get(r.guardianId) : null;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-900">{l ? `${l.firstName} ${l.lastName}` : r.learnerId}</td>
                      <td className="py-2.5 px-3 text-slate-600">{ev?.name || r.eventId}</td>
                      <td className="py-2.5 px-3 text-slate-600">{sub?.guardianName || (g ? `${g.firstName} ${g.lastName}` : '—')}</td>
                      <td className="py-2.5 px-3 text-center font-semibold">{sub ? (sub.participationApproved ? '✓ Yes' : '✗ No') : '—'}</td>
                      <td className="py-2.5 px-3 text-center font-semibold">{sub ? (sub.transportApproved ? '✓ Yes' : '✗ No') : '—'}</td>
                      <td className="py-2.5 px-3 text-center capitalize">{sub?.submissionStatus || r.requestStatus}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 2: Missing Consent */}
        {reportType === 'missing_consent' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Missing Consent Warning Report</h3>
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 text-left">Learner</th>
                  <th className="py-2.5 px-3 text-left">Event</th>
                  <th className="py-2.5 px-3 text-left">Assigned Guardian</th>
                  <th className="py-2.5 px-3 text-left">Contact Phone</th>
                  <th className="py-2.5 px-3 text-center">Due Date</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.filter(r => ['pending', 'sent'].includes(r.requestStatus)).map(r => {
                  const l = learnerMap.get(r.learnerId);
                  const ev = eventMap.get(r.eventId);
                  const g = r.guardianId ? guardianMap.get(r.guardianId) : null;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-rose-700">{l ? `${l.firstName} ${l.lastName}` : r.learnerId}</td>
                      <td className="py-2.5 px-3 text-slate-600">{ev?.name || r.eventId}</td>
                      <td className="py-2.5 px-3 text-slate-600">{g ? `${g.firstName} ${g.lastName}` : 'No Guardian Linked'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{g?.mobileNumber || '—'}</td>
                      <td className="py-2.5 px-3 text-center">{r.dueDate || 'Immediate'}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-amber-600">Pending Consent</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 3: Passenger Manifest */}
        {reportType === 'passenger_manifest' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Passenger Manifest Report</h3>
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 text-left">Passenger</th>
                  <th className="py-2.5 px-3 text-left">Type</th>
                  <th className="py-2.5 px-3 text-left">Transport Plan</th>
                  <th className="py-2.5 px-3 text-center">Seat</th>
                  <th className="py-2.5 px-3 text-center">Departure Boarding</th>
                  <th className="py-2.5 px-3 text-center">Return Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPassengers.map(p => {
                  const l = p.learnerId ? learnerMap.get(p.learnerId) : null;
                  const s = p.staffId ? staffMap.get(p.staffId) : null;
                  const pl = planMap.get(p.eventTransportPlanId);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {l ? `${l.firstName} ${l.lastName}` : s ? `${s.firstName} ${s.lastName} (Staff)` : 'Unknown'}
                      </td>
                      <td className="py-2.5 px-3 capitalize text-slate-600">{p.passengerType}</td>
                      <td className="py-2.5 px-3 text-slate-600">{pl?.planName || p.eventTransportPlanId}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{p.seatNumber || '—'}</td>
                      <td className="py-2.5 px-3 text-center capitalize">{p.boardingStatus}</td>
                      <td className="py-2.5 px-3 text-center capitalize">{p.returnStatus || 'pending'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 4: Transport Capacity */}
        {reportType === 'transport_capacity' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Transport Fleet Capacity Audit</h3>
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 text-left">Transport Plan</th>
                  <th className="py-2.5 px-3 text-left">Event</th>
                  <th className="py-2.5 px-3 text-center">Vehicle Capacity</th>
                  <th className="py-2.5 px-3 text-center">Assigned Passengers</th>
                  <th className="py-2.5 px-3 text-center">Remaining Seats</th>
                  <th className="py-2.5 px-3 text-right">Capacity State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlans.map(pl => {
                  const ev = eventMap.get(pl.eventId);
                  const count = passengers.filter(p => p.eventTransportPlanId === pl.id).length;
                  const rem = pl.vehicleCapacity - count;
                  const isOver = count > pl.vehicleCapacity;

                  return (
                    <tr key={pl.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-900">{pl.planName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{ev?.name || pl.eventId}</td>
                      <td className="py-2.5 px-3 text-center font-bold">{pl.vehicleCapacity}</td>
                      <td className="py-2.5 px-3 text-center font-bold">{count}</td>
                      <td className={`py-2.5 px-3 text-center font-extrabold ${isOver ? 'text-rose-600' : 'text-slate-800'}`}>
                        {rem}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isOver ? (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">OVER CAPACITY</span>
                        ) : rem === 0 ? (
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">FULL</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">AVAILABLE</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 5: Transport Exceptions */}
        {reportType === 'transport_exceptions' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Transport Exceptions & Safeguarding Audit</h3>
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 text-left">Passenger</th>
                  <th className="py-2.5 px-3 text-left">Issue / Exception</th>
                  <th className="py-2.5 px-3 text-center">Departure</th>
                  <th className="py-2.5 px-3 text-center">Return</th>
                  <th className="py-2.5 px-3 text-left">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPassengers.filter(p => p.boardingStatus === 'absent' || p.returnStatus === 'not_returning' || (p.notes && p.notes.includes('Admin override'))).map(p => {
                  const l = p.learnerId ? learnerMap.get(p.learnerId) : null;
                  const s = p.staffId ? staffMap.get(p.staffId) : null;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {l ? `${l.firstName} ${l.lastName}` : s ? `${s.firstName} ${s.lastName} (Staff)` : 'Unknown'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-rose-600">
                        {p.boardingStatus === 'absent' ? 'Absent at Departure' :
                         p.returnStatus === 'not_returning' ? 'Not Returning with Group' :
                         'Transport Consent Override'}
                      </td>
                      <td className="py-2.5 px-3 text-center capitalize">{p.boardingStatus}</td>
                      <td className="py-2.5 px-3 text-center capitalize">{p.returnStatus || 'pending'}</td>
                      <td className="py-2.5 px-3 text-slate-500">{p.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
