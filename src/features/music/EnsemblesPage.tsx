
import { useProgrammeGroups } from '../../hooks/useProgrammeGroups';
import { useProgrammes } from '../../hooks/useProgrammes';
import { useNavigate } from 'react-router-dom';

export const EnsemblesPage = () => {
  const { groups, loading: groupsLoading } = useProgrammeGroups();
  const { programmes, loading: programmesLoading } = useProgrammes();
  const navigate = useNavigate();

  const loading = groupsLoading || programmesLoading;

  // Filter groups to only include those belonging to 'Music' programmes
  const musicProgrammeIds = programmes.filter(p => p.programmeType === 'Music').map(p => p.id);
  const ensembles = groups.filter(g => musicProgrammeIds.includes(g.programmeId));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ensembles & Music Groups</h1>
          <p className="text-sm text-gray-500">Manage orchestras, bands, and music classes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center text-gray-500">Loading ensembles...</div>
        ) : ensembles.length > 0 ? (
          ensembles.map(ensemble => {
            const programme = programmes.find(p => p.id === ensemble.programmeId);
            return (
              <div 
                key={ensemble.id} 
                onClick={() => navigate(`/groups/${ensemble.id}`)}
                className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900">{ensemble.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{programme?.name || 'Unknown Programme'}</p>
                <div className="mt-4 text-sm text-gray-600">
                  <span className="font-medium">Capacity:</span> {ensemble.capacity ? `${ensemble.capacity} members max` : 'Unlimited'}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200 shadow-sm">
            No ensembles found. Ensure you have 'Music' programmes created with associated groups.
          </div>
        )}
      </div>
    </div>
  );
};
