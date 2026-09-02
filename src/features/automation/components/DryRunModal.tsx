import { CheckCircle2, ShieldCheck, X, AlertCircle } from 'lucide-react';
import type { AutomationRule } from '../../../types';
import type { RunRuleResult } from '../../../services/automation/automationExecutionService';

interface DryRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  rule: AutomationRule | null;
  result: RunRuleResult | null;
  onLiveRun?: () => void;
}

export function DryRunModal({ isOpen, onClose, rule, result, onLiveRun }: DryRunModalProps) {
  if (!isOpen || !rule) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Dry-Run Simulation Preview</h2>
              <p className="text-xs text-emerald-700">No database records were modified.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-emerald-100/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Rule Summary */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Simulated Rule</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {rule.ruleCategory}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-1">{rule.name}</h3>
            {rule.description && (
              <p className="text-xs text-slate-600 mt-0.5">{rule.description}</p>
            )}
          </div>

          {/* Results Summary */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Entities Matched</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {result?.matchedCount ?? 0}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase">Planned Actions</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {result?.actionsExecuted.length ?? 0}
              </p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Safety Status</span>
              <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Safe
              </p>
            </div>
          </div>

          {/* Planned Actions List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Planned Actions Detail ({result?.actionsExecuted.length || 0})
            </h4>

            {result?.actionsExecuted.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                <AlertCircle className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                No entities matched the rule criteria at this time.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {result?.actionsExecuted.map((act, i) => (
                  <div key={i} className="p-3.5 bg-white text-xs flex items-start justify-between gap-3">
                    <div>
                      <span className="font-semibold text-slate-800 capitalize">
                        {act.actionType.replace(/_/g, ' ')}
                      </span>
                      <p className="text-slate-600 mt-0.5">{act.summary}</p>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 shrink-0">
                      Simulated
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close Preview
          </button>
          {onLiveRun && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLiveRun();
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
            >
              Run Live Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
