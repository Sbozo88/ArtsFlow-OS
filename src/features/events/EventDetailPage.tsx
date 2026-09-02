import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useEvent } from '../../hooks/useEvents';
import { useEventGroups } from '../../hooks/useEventGroups';
import { useEventParticipants } from '../../hooks/useEventParticipants';
import { useEventStaff } from '../../hooks/useEventStaff';
import { useEventSchedule } from '../../hooks/useEventSchedule';
import { useEventPerformanceItems } from '../../hooks/useEventPerformanceItems';
import { useEventAttendance } from '../../hooks/useEventAttendance';

import { EventConsentTab } from './components/EventConsentTab';
import { EventTransportTab } from './components/EventTransportTab';
import { EventFinanceTab } from './components/EventFinanceTab';

type Tab = 'overview' | 'participants' | 'groups' | 'staff' | 'schedule' | 'performances' | 'attendance' | 'consent' | 'transport' | 'finance' | 'notes';

export const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { event, loading: eventLoading } = useEvent(id);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const { eventGroups } = useEventGroups(id);
  const { participants } = useEventParticipants(id);
  const { eventStaff } = useEventStaff(id);
  const { scheduleItems } = useEventSchedule(id);
  const { performanceItems } = useEventPerformanceItems(id);
  const { attendance } = useEventAttendance(id);

  if (eventLoading) return <div className="p-8">Loading Event Details...</div>;
  if (!event) return <div className="p-8 text-red-600">Event not found.</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
          <p className="text-sm text-gray-500 capitalize">{event.eventType.replace('_', ' ')} • {event.eventStatus}</p>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {(['overview', 'participants', 'groups', 'staff', 'schedule', 'performances', 'attendance', 'consent', 'transport', 'finance', 'notes'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Overview</h3>
            <p className="text-gray-600">{event.description || 'No description provided.'}</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <span className="font-semibold text-gray-700">Start Date: </span>
                <span>{new Date(event.startDate).toLocaleDateString()}</span>
              </div>
              {event.venue && (
                <div>
                  <span className="font-semibold text-gray-700">Venue: </span>
                  <span>{event.venue}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Participants ({participants.length})</h3>
            {participants.length === 0 ? (
              <p className="text-gray-500">No participants registered yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {participants.map((p) => (
                  <li key={p.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Learner ID: {p.learnerId}</p>
                      <p className="text-xs text-gray-500">Role: {p.participantRole || 'Participant'}</p>
                    </div>
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {p.participationStatus}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'groups' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Event Groups ({eventGroups.length})</h3>
            {eventGroups.length === 0 ? (
              <p className="text-gray-500">No groups assigned to this event.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {eventGroups.map((eg) => (
                  <li key={eg.id} className="py-3 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Group ID: {eg.groupId}</span>
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {eg.participationStatus}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'staff' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Event Staff ({eventStaff.length})</h3>
            {eventStaff.length === 0 ? (
              <p className="text-gray-500">No staff assigned yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {eventStaff.map((es) => (
                  <li key={es.id} className="py-3 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Staff ID: {es.staffId}</span>
                    <span className="text-sm text-gray-500">{es.eventRole}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule ({scheduleItems.length})</h3>
            {scheduleItems.length === 0 ? (
              <p className="text-gray-500">No schedule items added.</p>
            ) : (
              <div className="space-y-4">
                {scheduleItems.map((item) => (
                  <div key={item.id} className="border-l-4 border-indigo-500 pl-4 py-2">
                    <p className="text-sm font-bold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.startTime} - {item.endTime || ''}</p>
                    {item.notes && <p className="text-sm text-gray-600 mt-1">{item.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'performances' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Items ({performanceItems.length})</h3>
            {performanceItems.length === 0 ? (
              <p className="text-gray-500">No performance items programmed.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {performanceItems.map((pi) => (
                  <li key={pi.id} className="py-3">
                    <p className="text-sm font-medium text-gray-900">{pi.title}</p>
                    <p className="text-xs text-gray-500">Duration: {pi.estimatedDurationMinutes || '—'} mins | Type: {pi.itemType}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'attendance' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Event Attendance ({attendance.length})</h3>
            {attendance.length === 0 ? (
              <p className="text-gray-500">No attendance recorded.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {attendance.map((a) => (
                  <li key={a.id} className="py-3 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Learner ID: {a.learnerId}</span>
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                      {a.attendanceStatus}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'consent' && (
          <EventConsentTab eventId={event.id} />
        )}

        {activeTab === 'transport' && (
          <EventTransportTab eventId={event.id} />
        )}

        {activeTab === 'finance' && (
          <EventFinanceTab eventId={event.id} />
        )}

        {activeTab === 'notes' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Event Notes</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{event.notes || 'No notes added.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
