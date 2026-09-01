import { useState } from 'react';
import { useRepertoire } from '../../hooks/useRepertoire';

export const RepertoirePage = () => {
  const { repertoire, loading } = useRepertoire();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRepertoire = repertoire.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.composer && r.composer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Music Repertoire</h1>
          <p className="text-sm text-gray-500">Manage the music library and piece statuses</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
          Add Piece
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search by title or composer..."
            className="w-full md:w-1/3 px-3 py-2 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading repertoire...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Composer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRepertoire.length > 0 ? (
                filteredRepertoire.map(piece => (
                  <tr key={piece.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {piece.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {piece.composer || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {piece.difficulty || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${piece.repertoireStatus === 'performance_ready' ? 'bg-green-100 text-green-800' : 
                          piece.repertoireStatus === 'rehearsing' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {piece.repertoireStatus.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No repertoire found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
