import { useState } from 'react';
import { useInstruments } from '../../hooks/useInstruments';

export const InstrumentsPage = () => {
  const { instruments, loading } = useInstruments();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInstruments = instruments.filter(i => 
    i.assetNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.make && i.make.toLowerCase().includes(searchTerm.toLowerCase())) ||
    i.instrumentType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instruments Inventory</h1>
          <p className="text-sm text-gray-500">Manage all musical assets and their current status</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
          Add Instrument
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search by asset number, type, or make..."
            className="w-full md:w-1/3 px-3 py-2 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading instruments...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type / Make</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInstruments.length > 0 ? (
                filteredInstruments.map(instrument => (
                  <tr key={instrument.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {instrument.assetNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {instrument.instrumentType} {instrument.make && `(${instrument.make})`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {instrument.condition}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${instrument.instrumentStatus === 'available' ? 'bg-green-100 text-green-800' : 
                          instrument.instrumentStatus === 'allocated' ? 'bg-blue-100 text-blue-800' : 
                          instrument.instrumentStatus === 'repair' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                        {instrument.instrumentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No instruments found.
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
