import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Zap, 
  ArrowLeft, 
  Play, 
  Eye, 
  Activity,
  Edit
} from 'lucide-react';
import { useAutomationRule } from '../../hooks/useAutomationRule';
import { useAutomationExecutions } from '../../hooks/useAutomationExecutions';
import { DryRunModal } from './components/DryRunModal';
import { RuleBuilderModal } from './components/RuleBuilderModal';
import type { RunRuleResult } from '../../services/automation/automationExecutionService';

export function AutomationRuleDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { rule, loading, error, running, updateRule, runRule } = useAutomationRule(id);
  const { executions, loading: executionsLoading } = useAutomationExecutions(id);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<RunRuleResult | null>(null);
  const [isDryRunModalOpen, setIsDryRunModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-sm">Loading rule details...</div>;
  }

  if (error || !rule) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 border border-rose-200 rounded-xl">
        <p className="font-bold">Rule not found or could not be loaded.</p>
        <Link to="/automation/rules" className="text-xs text-indigo-600 hover:underline mt-2 inline-block">
          Return to Rules Catalog
        </Link>
      </div>
    );
  }

  const handleExecute = async (isDryRun = false) => {
    try {
      setNotice(`Evaluating rule...`);
      const result = await runRule(isDryRun);
      if (isDryRun) {
        setDryRunResult(result);
        setIsDryRunModalOpen(true);
        setNotice(null);
      } else {
        setNotice(`Rule executed: ${result.actionsExecuted.length} action(s) taken.`);
      }
    } catch (err: unknown) {
      setNotice(`Execution failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/automation/rules"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Rules Catalog
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{rule.name}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                rule.ruleStatus === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {rule.ruleStatus}
            </span>
          </div>
          {rule.description && (
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">{rule.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleExecute(true)}
            disabled={running}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Dry Run
          </button>
          <button
            onClick={() => handleExecute(false)}
            disabled={running}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Running...' : 'Run Live'}
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700 transition-colors"
            title="Edit Rule"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs font-medium flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-indigo-500 hover:text-indigo-800">
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Domain Category</span>
          <p className="text-base font-bold text-slate-900 mt-1 capitalize">{rule.ruleCategory}</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trigger Mechanism</span>
          <p className="text-base font-bold text-slate-900 mt-1 capitalize">{rule.triggerType.replace(/_/g, ' ')}</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cooldown Period</span>
          <p className="text-base font-bold text-slate-900 mt-1">
            {rule.cooldownMinutes ? `${Math.round(rule.cooldownMinutes / 60)} hours` : 'Immediate'}
          </p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Deduplication Window</span>
          <p className="text-base font-bold text-slate-900 mt-1">
            {rule.deduplicationWindowHours ? `${rule.deduplicationWindowHours} hours` : '24 hours'}
          </p>
        </div>
      </div>

      {/* Configured Actions List */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-600" />
          Configured Safe Actions ({rule.actions.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rule.actions.map((act, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 capitalize">
                  {act.actionType.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 uppercase">
                  {act.priority || rule.priority || 'normal'}
                </span>
              </div>
              {act.titleTemplate && (
                <p className="text-slate-700">
                  <strong>Title Template:</strong> {act.titleTemplate}
                </p>
              )}
              {act.messageTemplate && (
                <p className="text-slate-600">
                  <strong>Message:</strong> {act.messageTemplate}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Execution History for this Rule */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-600" />
            Execution History for this Rule
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {executions.length} recorded run(s)
          </span>
        </div>

        {executionsLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading execution history...</div>
        ) : executions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No executions logged for this rule yet. Click &quot;Run Live&quot; or &quot;Dry Run&quot; to test.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions Completed</th>
                  <th className="px-6 py-3">Mode</th>
                  <th className="px-6 py-3">Error / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {executions.map(exec => (
                  <tr key={exec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(exec.triggeredAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5">
                      {exec.executionStatus === 'completed' && (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                          Completed
                        </span>
                      )}
                      {exec.executionStatus === 'skipped' && (
                        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                          Skipped
                        </span>
                      )}
                      {exec.executionStatus === 'failed' && (
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      {exec.actionsCompleted} of {exec.actionsAttempted}
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
                    <td className="px-6 py-3.5 text-slate-400">
                      {exec.errorMessage || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <RuleBuilderModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={async (ruleData) => {
          await updateRule(ruleData);
        }}
        initialRule={rule}
      />

      <DryRunModal
        isOpen={isDryRunModalOpen}
        onClose={() => setIsDryRunModalOpen(false)}
        rule={rule}
        result={dryRunResult}
        onLiveRun={() => handleExecute(false)}
      />
    </div>
  );
}
