import { useState, useMemo } from 'react';
import { Download, Printer, Search, Loader2, FileSpreadsheet } from 'lucide-react';
import type { OperationalReportRow } from '../../../types';

interface ReportTableViewProps {
  title: string;
  description: string;
  columns: Array<{ key: string; label: string }>;
  data: OperationalReportRow[];
  loading?: boolean;
  onExportCsv: () => void;
}

export function ReportTableView({
  title,
  description,
  columns,
  data,
  loading,
  onExportCsv
}: ReportTableViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(row => {
      return Object.values(row).some(val => 
        val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header (hidden in print, replaced by print-only header) */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search report..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 w-48 sm:w-64"
            />
          </div>

          <button
            type="button"
            onClick={onExportCsv}
            disabled={loading || data.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-xs hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={loading || data.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg shadow-xs disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block p-6 border-b border-slate-300">
        <div className="flex justify-between items-baseline">
          <div>
            <h1 className="text-xl font-bold text-slate-900">ArtsFlow OS — Operational Report</h1>
            <h2 className="text-base font-semibold text-slate-700 mt-1">{title}</h2>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Generated: {new Date().toLocaleString()}</div>
            <div>Total Records: {filteredData.length}</div>
          </div>
        </div>
      </div>

      {/* Table Body */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-xs">Compiling operational dataset...</span>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <div className="text-sm font-medium text-slate-700">No report records found</div>
          <div className="text-xs text-slate-400 mt-1">Try adjusting applied date ranges or filter conditions</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                {columns.map(col => (
                  <th key={col.key} className="px-4 py-3 font-semibold tracking-wider uppercase text-[11px]">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-2.5 whitespace-nowrap">
                      {row[col.key] !== null && row[col.key] !== undefined ? String(row[col.key]) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && filteredData.length > pageSize && (
        <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-2.5 py-1 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 font-medium text-slate-700">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-2.5 py-1 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
