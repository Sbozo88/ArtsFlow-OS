import { useState } from 'react';
import { 
  Activity, 
  Search, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Eye, 
  X
} from 'lucide-react';
import { useAutomationExecutions } from '../../hooks/useAutomationExecutions';
import type { AutomationExecution } from '../../types';

export function AutomationActivityPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<AutomationExecution | null>(null);

  const { executions, loading, refresh, retryExecution } = useAutomationExecutions();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const filteredExecutions = executions.filter(e => {
    if (selectedStatus !== 'all' && e.executionStatus !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.ruleName.toLowerCase().includes(q) ||
        (e.triggerEntityType && e.triggerEntityType.toLowerCase().includes(q)) ||
        (e.deduplicationKey && e.deduplicationKey.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleRetry = async (executionId: string) => {
    try {
      setRetryingId(executionId);
      await retryExecution(executionId);
      await refresh();
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" />
            Automation Activity & Audit Log
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable system evidence and step-by-step audit trace for all rule executions.
          </p>
        </div>

        <button
          onClick={() => refresh()}
          className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Refresh Log
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by rule, entity, or deduplication key..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none"
          >
            <option value="all">All Execution Statuses</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped (Cooldown/Dedup)</option>
            <option value="partially_completed">Partially Completed</option>
          </select>
        </div>
      </div>

      {/* Executions Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading activity logs...</div>
        ) : filteredExecutions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No execution logs matching filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Rule Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions Tally</th>
                  <th className="px-6 py-3">Execution Mode</th>
                  <th className="px-6 py-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredExecutions.map(exec => (
                  <tr key={exec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(exec.triggeredAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">
                      {exec.ruleName}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 capitalize">
                        {exec.ruleCategory}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      {exec.executionStatus === 'completed' && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      )}
                      {exec.executionStatus === 'failed' && (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                          <AlertTriangle className="w-3 h-3" /> Failed
                        </span>
                      )}
                      {exec.executionStatus === 'skipped' && (
                        <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                          <Clock className="w-3 h-3" /> Skipped
                        </span>
                      )}
                      {exec.executionStatus === 'partially_completed' && (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                          <AlertTriangle className="w-3 h-3" /> Partial
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-semibold">{exec.actionsCompleted}</span> succeeded / {exec.actionsAttempted} attempted
                    </td>
                    <td className="px-6 py-3.5">
                      {exec.isDryRun ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          Dry-Run
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          Production
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedExecution(exec)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3 h-3" /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Execution Detail Modal */}
      {selectedExecution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">Execution Audit Trace</h2>
              </div>
              <button
                onClick={() => setSelectedExecution(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Overview */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{selectedExecution.ruleName}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700">
                    {selectedExecution.ruleCategory}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <strong>Execution ID:</strong> {selectedExecution.id}
                  </div>
                  <div>
                    <strong>Triggered At:</strong> {new Date(selectedExecution.triggeredAt).toLocaleString()}
                  </div>
                  {selectedExecution.deduplicationKey && (
                    <div className="col-span-2 text-slate-500 font-mono text-[10px] break-all">
                      <strong>Dedup Key:</strong> {selectedExecution.deduplicationKey}
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Error */}
              {selectedExecution.errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
                  <strong>Error / Skip Reason:</strong> {selectedExecution.errorMessage}
                </div>
              )}

              {/* Actions Detail */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Step Execution Details ({selectedExecution.executionDetails?.actionsTaken?.length || 0})
                </h3>
                {selectedExecution.executionDetails?.actionsTaken?.length ? (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedExecution.executionDetails.actionsTaken.map((step, idx) => (
                      <div key={idx} className="p-3 bg-white flex items-start justify-between gap-3">
                        <div>
                          <span className="font-bold text-slate-800 capitalize">
                            {step.actionType.replace(/_/g, ' ')}
                          </span>
                          {step.summary && <p className="text-slate-600 mt-0.5">{step.summary}</p>}
                          {step.error && <p className="text-rose-600 mt-0.5">{step.error}</p>}
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${
                            step.status === 'success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : step.status === 'failed'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No discrete action steps logged.</p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedExecution(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
              {(selectedExecution.executionStatus === 'failed' || selectedExecution.executionStatus === 'partially_completed') && (
                <button
                  type="button"
                  onClick={() => handleRetry(selectedExecution.id)}
                  disabled={retryingId === selectedExecution.id}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  {retryingId === selectedExecution.id ? 'Retrying...' : 'Retry Execution'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
