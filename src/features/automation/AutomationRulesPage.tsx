import { useState } from 'react';
import { 
  Zap, 
  Plus, 
  Sparkles, 
  Search, 
  Play, 
  Eye, 
  Edit, 
  Pause, 
  Archive, 
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAutomationRules } from '../../hooks/useAutomationRules';
import { automationExecutionService, type RunRuleResult } from '../../services/automation/automationExecutionService';
import { automationRuleService, type CreateRuleInput } from '../../services/automation/automationRuleService';
import { RuleBuilderModal } from './components/RuleBuilderModal';
import { DryRunModal } from './components/DryRunModal';
import { TemplateGalleryModal } from './components/TemplateGalleryModal';
import type { AutomationRule } from '../../types';

export function AutomationRulesPage() {
  const { organisationId, user, authUser } = useAuth();
  const actorId = authUser?.uid || user?.uid || '';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { rules, loading, refresh, toggleRuleStatus, instantiateTemplate } = useAutomationRules();

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  
  // Dry run modal state
  const [dryRunRule, setDryRunRule] = useState<AutomationRule | null>(null);
  const [dryRunResult, setDryRunResult] = useState<RunRuleResult | null>(null);
  const [isDryRunModalOpen, setIsDryRunModalOpen] = useState(false);

  // Action status message
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const filteredRules = rules.filter(r => {
    if (selectedCategory !== 'all' && r.ruleCategory !== selectedCategory) return false;
    if (selectedStatus !== 'all' && r.ruleStatus !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.name.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q));
    }
    return true;
  });

  const handleRunRule = async (rule: AutomationRule, isDryRun = false) => {
    if (!organisationId || !actorId) return;
    try {
      setActionNotice(`Evaluating rule: ${rule.name}...`);
      const result = await automationExecutionService.runRule(organisationId, rule.id, actorId, isDryRun);

      if (isDryRun) {
        setDryRunRule(rule);
        setDryRunResult(result);
        setIsDryRunModalOpen(true);
        setActionNotice(null);
      } else {
        setActionNotice(`Executed "${rule.name}": ${result.actionsExecuted.length} action(s) taken.`);
        await refresh();
      }
    } catch (err: unknown) {
      setActionNotice(`Execution failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSaveRule = async (ruleData: CreateRuleInput) => {
    if (!organisationId || !actorId) return;
    if (editingRule) {
      await automationRuleService.updateRule(organisationId, editingRule.id, actorId, ruleData);
    } else {
      await automationRuleService.createRule(organisationId, actorId, ruleData);
    }
    await refresh();
  };

  const handleArchive = async (ruleId: string) => {
    if (!organisationId || !actorId) return;
    if (window.confirm('Are you sure you want to archive this rule?')) {
      await automationRuleService.archiveRule(organisationId, ruleId, actorId);
      await refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-indigo-600" />
            Automation Rules Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure triggers, condition checks, and automated human follow-ups.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Explore Templates
          </button>
          <button
            onClick={() => {
              setEditingRule(null);
              setIsNewModalOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Rule
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs font-medium flex items-center justify-between">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-indigo-500 hover:text-indigo-800">
            Dismiss
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search rules by name or keywords..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none"
          >
            <option value="all">All Categories</option>
            <option value="attendance">Attendance</option>
            <option value="finance">Finance</option>
            <option value="consent">Consent</option>
            <option value="event">Events</option>
            <option value="transport">Transport</option>
            <option value="instrument">Instruments</option>
            <option value="costume">Costumes</option>
            <option value="follow_up">Follow-Ups</option>
            <option value="communication">Communication</option>
            <option value="general">Data Quality</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      {/* Rules Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading automation rules...</div>
      ) : filteredRules.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-white border border-dashed border-slate-200 rounded-2xl">
          <Zap className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-slate-700 text-base">No automation rules match the filter criteria.</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Get started by creating a custom rule or selecting from the built-in operational templates.
          </p>
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            Browse Recommended Templates
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRules.map(rule => (
            <div
              key={rule.id}
              className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                        {rule.ruleCategory}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Trigger: {rule.triggerType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <Link
                      to={`/automation/rules/${rule.id}`}
                      className="font-bold text-slate-900 text-base hover:text-indigo-600 transition-colors"
                    >
                      {rule.name}
                    </Link>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      rule.ruleStatus === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {rule.ruleStatus}
                  </span>
                </div>

                {rule.description && (
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {rule.description}
                  </p>
                )}

                {/* Actions Pill List */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {rule.actions.map((act, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                    >
                      {act.actionType.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>

                {/* Rule Safeguards Info */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Cooldown: {rule.cooldownMinutes ? `${Math.round(rule.cooldownMinutes / 60)}h` : 'None'}
                  </span>
                  <span>Dedup Window: {rule.deduplicationWindowHours || 24}h</span>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleRunRule(rule, false)}
                    className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Run Rule Now (Production)"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Run Now</span>
                  </button>
                  <button
                    onClick={() => handleRunRule(rule, true)}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Dry-Run Simulation Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Dry Run</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleRuleStatus(rule.id, rule.ruleStatus)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title={rule.ruleStatus === 'active' ? 'Pause Rule' : 'Activate Rule'}
                  >
                    {rule.ruleStatus === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-600" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingRule(rule);
                      setIsNewModalOpen(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit Rule"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleArchive(rule.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Archive Rule"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <RuleBuilderModal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          setEditingRule(null);
        }}
        onSave={handleSaveRule}
        initialRule={editingRule}
      />

      <DryRunModal
        isOpen={isDryRunModalOpen}
        onClose={() => setIsDryRunModalOpen(false)}
        rule={dryRunRule}
        result={dryRunResult}
        onLiveRun={dryRunRule ? () => handleRunRule(dryRunRule, false) : undefined}
      />

      <TemplateGalleryModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={async (tplId) => {
          await instantiateTemplate(tplId);
          await refresh();
        }}
      />
    </div>
  );
}
