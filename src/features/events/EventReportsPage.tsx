export const EventReportsPage = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Event Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 cursor-pointer hover:shadow-md">
          <h3 className="text-lg font-medium text-indigo-600">Event Participant List</h3>
          <p className="mt-2 text-sm text-gray-500">View detailed participant lists across programmes and groups.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 cursor-pointer hover:shadow-md">
          <h3 className="text-lg font-medium text-indigo-600">Running Order</h3>
          <p className="mt-2 text-sm text-gray-500">Generate running orders for performances and competitions.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 cursor-pointer hover:shadow-md">
          <h3 className="text-lg font-medium text-indigo-600">Event Attendance</h3>
          <p className="mt-2 text-sm text-gray-500">Review event attendance statistics by learner and group.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 cursor-pointer hover:shadow-md">
          <h3 className="text-lg font-medium text-indigo-600">Event Summary</h3>
          <p className="mt-2 text-sm text-gray-500">High-level summary of completed and upcoming events.</p>
        </div>
      </div>
    </div>
  );
};
