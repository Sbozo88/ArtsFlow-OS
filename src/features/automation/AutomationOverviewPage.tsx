import { useState, useEffect, useCallback } from 'react';
import { 
  Zap, 
  Play, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { automationExecutionService } from '../../services/automation/automationExecutionService';
import { automationRuleService, type CreateRuleInput } from '../../services/automation/automationRuleService';
import { TemplateGalleryModal } from './components/TemplateGalleryModal';
import { RuleBuilderModal } from './components/RuleBuilderModal';
import type { AutomationExecution } from '../../types';

export function AutomationOverviewPage() {
  const { organisationId, user, authUser } = useAuth();
  const actorId = authUser?.uid || user?.uid || '';

  const [stats, setStats] = useState<{
    activeRulesCount: number;
    disabledRulesCount: number;
    runsTodayCount: number;
    actionsTriggeredTodayCount: number;
    openAutomationFollowUpsCount: number;
    notificationsPendingCount: number;
    failedRunsCount: number;
    rulesRequiringAttention: import('../../types').AutomationRule[];
    recentExecutions: AutomationExecution[];
  }>({
    activeRulesCount: 0,
    disabledRulesCount: 0,
    runsTodayCount: 0,
    actionsTriggeredTodayCount: 0,
    openAutomationFollowUpsCount: 0,
    notificationsPendingCount: 0,
    failedRunsCount: 0,
    rulesRequiringAttention: [],
    recentExecutions: []
  });

  const [loading, setLoading] = useState(true);
  const [runningAll, setRunningAll] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  // Modals
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isNewRuleModalOpen, setIsNewRuleModalOpen] = useState(false);

  const loadStats = useCallback(async () => {
    if (!organisationId) return;
    try {
      setLoading(true);
      const data = await automationExecutionService.getAutomationOverviewStats(organisationId);
      setStats(data);
    } catch (err) {
      console.error('Failed to load automation stats:', err);
    } finally {
      setLoading(false);
    }
  }, [organisationId]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const load = async () => {
      try {
        const data = await automationExecutionService.getAutomationOverviewStats(organisationId);
        if (mounted) {
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to load automation stats:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [organisationId]);

  const handleRunAll = async () => {
    if (!organisationId || !actorId) return;
    try {
      setRunningAll(true);
      setRunMessage(null);
      const results = await automationExecutionService.evaluateAllActiveRules(organisationId, actorId);
      const totalActions = results.reduce((sum, r) => sum + r.actionsExecuted.length, 0);
      setRunMessage(`Successfully evaluated ${results.length} active rule(s). Processed ${totalActions} action(s).`);
      await loadStats();
    } catch (err: unknown) {
      setRunMessage(err instanceof Error ? err.message : 'Batch evaluation failed');
    } finally {
      setRunningAll(false);
    }
  };

  const handleInstantiateTemplate = async (templateId: string) => {
    if (!organisationId || !actorId) return;
    await automationRuleService.instantiateTemplate(organisationId, templateId, actorId);
    await loadStats();
  };

  const handleCreateCustomRule = async (ruleInput: CreateRuleInput) => {
    if (!organisationId || !actorId) return;
    await automationRuleService.createRule(organisationId, actorId, ruleInput);
    await loadStats();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Zap className="w-7 h-7 text-indigo-600" />
            Workflow Automation & Notifications
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Deterministic, rule-based operations with transparent execution history and human safeguards.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Templates
          </button>
          <button
            onClick={() => setIsNewRuleModalOpen(true)}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            New Rule
          </button>
          <button
            onClick={handleRunAll}
            disabled={runningAll || stats.activeRulesCount === 0}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${runningAll ? 'animate-spin' : ''}`} />
            {runningAll ? 'Evaluating Rules...' : 'Run All Active Rules'}
          </button>
        </div>
      </div>

      {runMessage && (
        <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs font-medium flex items-center justify-between">
          <span>{runMessage}</span>
          <button onClick={() => setRunMessage(null)} className="text-indigo-500 hover:text-indigo-800">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Rules</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Zap className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-900">{stats.activeRulesCount}</span>
            <span className="text-[11px] text-slate-500 font-medium">enabled</span>
          </div>
          <Link to="/automation/rules" className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium mt-2 inline-flex items-center gap-1">
            Rules <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Disabled Rules</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-900">{stats.disabledRulesCount}</span>
            <span className="text-[11px] text-slate-500 font-medium">inactive</span>
          </div>
          <Link to="/automation/rules" className="text-[11px] text-amber-600 hover:text-amber-800 font-medium mt-2 inline-flex items-center gap-1">
            Inspect <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions Today</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Activity className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-900">{stats.actionsTriggeredTodayCount}</span>
            <span className="text-[11px] text-slate-500 font-medium">completed</span>
          </div>
          <Link to="/automation/activity" className="text-[11px] text-emerald-600 hover:text-emerald-800 font-medium mt-2 inline-flex items-center gap-1">
            Activity <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Auto Follow-Ups</span>
            <span className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-900">{stats.openAutomationFollowUpsCount}</span>
            <span className="text-[11px] text-slate-500 font-medium">open tasks</span>
          </div>
          <Link to="/follow-ups" className="text-[11px] text-sky-600 hover:text-sky-800 font-medium mt-2 inline-flex items-center gap-1">
            Follow-Ups <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Alerts</span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-900">{stats.notificationsPendingCount}</span>
            <span className="text-[11px] text-slate-500 font-medium">unread</span>
          </div>
          <Link to="/notifications" className="text-[11px] text-purple-600 hover:text-purple-800 font-medium mt-2 inline-flex items-center gap-1">
            Notifications <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Failed Runs</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-900">{stats.failedRunsCount}</span>
            <span className="text-[11px] text-slate-500 font-medium">issues</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            {stats.failedRunsCount === 0 ? 'All normal' : 'Inspect logs'}
          </span>
        </div>
      </div>

      {/* Rules Requiring Attention */}
      {stats.rulesRequiringAttention.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Rules Requiring Attention ({stats.rulesRequiringAttention.length})
            </div>
            <Link to="/automation/activity" className="text-xs font-semibold text-rose-700 hover:text-rose-900">
              View Failures &rarr;
            </Link>
          </div>
          <div className="mt-3 divide-y divide-rose-100">
            {stats.rulesRequiringAttention.map(rule => (
              <div key={rule.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-rose-950">{rule.name}</span>
                  <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 uppercase font-medium">
                    {rule.ruleCategory}
                  </span>
                </div>
                <Link
                  to={`/automation/rules/${rule.id}`}
                  className="text-xs font-medium text-rose-700 hover:underline inline-flex items-center gap-1"
                >
                  Configure Rule <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety Boundary Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-xl flex items-start gap-3.5 shadow-sm">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-indigo-300 uppercase tracking-wider">
            Operational Safety & Human Decision Guard
          </p>
          <p className="text-slate-300 leading-relaxed">
            ArtsFlow OS automations flag exceptions, create follow-up assignments, notify staff, and prepare draft communications.
            Automation never silently removes learners, writes off balances, approves consent, or overrides staff authority.
          </p>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-600" />
            <h2 className="font-bold text-sm text-slate-900">Recent Automation Activity</h2>
          </div>
          <Link
            to="/automation/activity"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Full Activity Log
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading activity...</div>
        ) : stats.recentExecutions.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            <Zap className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-medium text-slate-600">No automation activity recorded yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;Run All Active Rules&quot; or explore templates to begin.
            </p>
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
                  <th className="px-6 py-3">Actions Completed</th>
                  <th className="px-6 py-3">Execution Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {stats.recentExecutions.slice(0, 10).map(exec => (
                  <tr key={exec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(exec.triggeredAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
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
                          <Clock className="w-3 h-3" /> Skipped (Cooldown)
                        </span>
                      )}
                      {exec.executionStatus === 'partially_completed' && (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                          <AlertTriangle className="w-3 h-3" /> Partial
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      {exec.actionsCompleted} of {exec.actionsAttempted} action(s)
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <TemplateGalleryModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleInstantiateTemplate}
      />

      <RuleBuilderModal
        isOpen={isNewRuleModalOpen}
        onClose={() => setIsNewRuleModalOpen(false)}
        onSave={handleCreateCustomRule}
      />
    </div>
  );
}
