import { useDanceGroups } from '../../hooks/useDanceGroups';
import { useCostumes } from '../../hooks/useCostumes';
import { useChoreography } from '../../hooks/useChoreography';

export const DanceDashboardPage = () => {
  const { danceGroups, loading: groupsLoading } = useDanceGroups();
  const { costumes, loading: costumesLoading } = useCostumes();
  const { choreographyList, loading: choreographyLoading } = useChoreography();

  const loading = groupsLoading || costumesLoading || choreographyLoading;

  if (loading) return <div className="p-8">Loading Dance Dashboard...</div>;

  const activeChoreographies = choreographyList.filter(c => c.choreographyStatus !== 'retired').length;
  const availableCostumes = costumes.filter(c => c.costumeStatus === 'available').length;
  const costumesNeedingAttention = costumes.filter(c => c.costumeStatus === 'repair' || c.costumeStatus === 'lost' || c.condition === 'poor' || c.condition === 'damaged').length;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dance Operations Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 truncate">Dance Classes / Groups</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{danceGroups.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 truncate">Active Choreography</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{activeChoreographies}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 truncate">Costumes Available</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{availableCostumes}</p>
        </div>
        <div className={`bg-white p-6 rounded-lg shadow border border-gray-100 ${costumesNeedingAttention > 0 ? 'border-l-4 border-l-red-500' : ''}`}>
          <h3 className="text-sm font-medium text-gray-500 truncate">Costumes Needing Attention</h3>
          <p className={`mt-2 text-3xl font-semibold ${costumesNeedingAttention > 0 ? 'text-red-600' : 'text-gray-900'}`}>{costumesNeedingAttention}</p>
        </div>
      </div>
      
      {/* Additional dashboard widgets can go here */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Dance Sessions</h2>
        <p className="text-sm text-gray-500">Upcoming rehearsal scheduling will appear here.</p>
      </div>
    </div>
  );
};
