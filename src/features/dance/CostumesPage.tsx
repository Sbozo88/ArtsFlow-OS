import { useCostumes } from '../../hooks/useCostumes';

export const CostumesPage = () => {
  const { costumes, loading, error } = useCostumes();

  if (loading) return <div className="p-8">Loading Costumes...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error.message}</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Costume Inventory</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
          Add Costume
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type / Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {costumes.map((costume) => (
              <tr key={costume.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{costume.assetNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="font-medium text-gray-900">{costume.costumeType}</div>
                  <div className="text-gray-500">{costume.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{costume.size || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{costume.condition}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${costume.costumeStatus === 'available' ? 'bg-green-100 text-green-800' : costume.costumeStatus === 'allocated' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                    {costume.costumeStatus}
                  </span>
                </td>
              </tr>
            ))}
            {costumes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No costumes found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
