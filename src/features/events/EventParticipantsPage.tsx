
export const EventParticipantsPage = () => {
  // In a real implementation this would fetch across multiple events or allow global participant viewing
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Global Event Participants</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-sm">This page provides an overview of all event participants for reporting purposes.</p>
      </div>
    </div>
  );
};
