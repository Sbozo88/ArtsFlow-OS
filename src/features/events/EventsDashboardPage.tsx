import { useEvents } from '../../hooks/useEvents';

export const EventsDashboardPage = () => {
  const { events, loading } = useEvents();

  if (loading) {
    return <div className="p-8 text-gray-500">Loading Events Dashboard...</div>;
  }

  const upcomingEvents = events.filter(e => new Date(e.startDate) >= new Date() && e.eventStatus !== 'cancelled').length;
  const draftEvents = events.filter(e => e.eventStatus === 'draft').length;
  const confirmedEvents = events.filter(e => e.eventStatus === 'confirmed').length;
  const completedEvents = events.filter(e => e.eventStatus === 'completed').length;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Events Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 truncate">Upcoming Events</h3>
          <p className="mt-2 text-3xl font-semibold text-indigo-600">{upcomingEvents}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 truncate">Draft Events</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{draftEvents}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 truncate">Confirmed Events</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">{confirmedEvents}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 truncate">Completed Events</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{completedEvents}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Events</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.slice(0, 5).map((event) => (
                <tr key={event.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{event.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{event.eventType.replace('_', ' ')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(event.startDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{event.eventStatus}</td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No events found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
