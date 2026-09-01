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

type Tab = 'overview' | 'participants' | 'groups' | 'staff' | 'schedule' | 'performances' | 'attendance' | 'consent' | 'transport' | 'notes';

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
          {(['overview', 'participants', 'groups', 'staff', 'schedule', 'performances', 'attendance', 'consent', 'transport', 'notes'] as Tab[]).map((tab) => (
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
            <p className="text-gray-500 text-sm">Participant management interface goes here.</p>
          </div>
        )}

        {activeTab === 'groups' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Event Groups ({eventGroups.length})</h3>
            <p className="text-gray-500 text-sm">Group linking interface goes here.</p>
          </div>
        )}

        {activeTab === 'staff' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Event Staff ({eventStaff.length})</h3>
            <p className="text-gray-500 text-sm">Staff assignment interface goes here.</p>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule ({scheduleItems.length})</h3>
            <p className="text-gray-500 text-sm">Timeline/Running order goes here.</p>
          </div>
        )}

        {activeTab === 'performances' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Items ({performanceItems.length})</h3>
            <p className="text-gray-500 text-sm">Repertoire/Choreography linking goes here.</p>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Event Attendance ({attendance.length})</h3>
            <p className="text-gray-500 text-sm">Attendance marking interface goes here.</p>
          </div>
        )}

        {activeTab === 'consent' && (
          <EventConsentTab eventId={event.id} />
        )}

        {activeTab === 'transport' && (
          <EventTransportTab eventId={event.id} />
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
