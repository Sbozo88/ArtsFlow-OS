import { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Users, 
  CalendarCheck, 
  GraduationCap, 
  CalendarDays, 
  CreditCard, 
  Music, 
  ClipboardList, 
  ArrowLeft 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { reportingService, ReportDefinition } from '../../services/reportingService';
import { useReportData } from '../../hooks/useReportData';
import { useDateRangeFilter } from '../../hooks/useDateRangeFilter';
import { DateRangeSelector } from './components/DateRangeSelector';
import { ReportTableView } from './components/ReportTableView';
import { exportToCsv } from '../../lib/csvExport';

export function ReportsPage() {
  const { authUser } = useAuth();
  const availableReports = useMemo(() => {
    return reportingService.getAvailableReports(authUser?.role);
  }, [authUser?.role]);

  const [selectedReportId, setSelectedReportId] = useState<string>(
    availableReports[0]?.id || 'learner-register'
  );

  const selectedReport = useMemo(() => {
    return availableReports.find(r => r.id === selectedReportId) || availableReports[0] || null;
  }, [availableReports, selectedReportId]);

  const { filter, setPreset, setCustomRange } = useDateRangeFilter();

  const queryFilters = useMemo(() => ({
    startDate: filter.startDate,
    endDate: filter.endDate
  }), [filter.startDate, filter.endDate]);

  const { data, loading } = useReportData(selectedReport, queryFilters);

  const getReportIcon = (category: ReportDefinition['category']) => {
    switch (category) {
      case 'learners':
        return <Users className="w-4 h-4" />;
      case 'attendance':
        return <CalendarCheck className="w-4 h-4" />;
      case 'programmes':
        return <GraduationCap className="w-4 h-4" />;
      case 'events':
        return <CalendarDays className="w-4 h-4" />;
      case 'finance':
        return <CreditCard className="w-4 h-4" />;
      case 'assets':
        return <Music className="w-4 h-4" />;
      default:
        return <ClipboardList className="w-4 h-4" />;
    }
  };

  const handleExport = () => {
    if (!selectedReport || data.length === 0) return;
    const dateTag = new Date().toISOString().split('T')[0];
    exportToCsv({
      filename: `artsflow-${selectedReport.id}-${dateTag}`,
      columns: selectedReport.columns,
      data
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/analytics" className="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back to Analytics
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-indigo-600" />
            <span>Management & Operational Reports Hub</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Standardized operational registers, audits, attendance rosters, and accounts receivable exports.
          </p>
        </div>

        <DateRangeSelector
          filter={filter}
          onPresetChange={setPreset}
          onCustomChange={setCustomRange}
        />
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Reports Navigation Menu (Hidden in print) */}
        <div className="lg:col-span-1 space-y-1 bg-white p-3 rounded-xl border border-slate-200 shadow-xs h-fit print:hidden">
          <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Available Reports ({availableReports.length})
          </div>
          {availableReports.map(rep => {
            const isSelected = rep.id === selectedReportId;
            return (
              <button
                key={rep.id}
                type="button"
                onClick={() => setSelectedReportId(rep.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs rounded-lg text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {getReportIcon(rep.category)}
                </div>
                <div className="truncate flex-1">
                  <div className="truncate">{rep.name}</div>
                </div>
                {rep.sensitive && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-800 font-medium shrink-0">
                    Restricted
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Report View Area */}
        <div className="lg:col-span-3">
          {selectedReport && (
            <ReportTableView
              title={selectedReport.name}
              description={selectedReport.description}
              columns={selectedReport.columns}
              data={data}
              loading={loading}
              onExportCsv={handleExport}
            />
          )}
        </div>
      </div>
    </div>
  );
}
