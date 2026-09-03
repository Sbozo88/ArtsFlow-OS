import React from 'react';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomerLifecycle } from '../../hooks/useCustomerLifecycle';

export interface UpgradePromptProps {
  feature?: string;
  featureName?: string;
  benefit?: string;
  requiredPlan?: string;
  onUpgradeClick?: () => void;
  inline?: boolean;
}

const FEATURE_UPGRADE_METADATA: Record<string, { name: string; benefit: string }> = {
  'events.core': {
    name: 'Event & Performance Management',
    benefit: 'Plan performances, participants, schedules and event attendance with ArtsFlow Professional.'
  },
  'events.transport': {
    name: 'Transport Coordination',
    benefit: 'Coordinate event transport, learners and supervisors with ArtsFlow Professional.'
  },
  'events.consent': {
    name: 'Digital Consent & Permissions',
    benefit: 'Track digital parent consent requests, responses and reminders with ArtsFlow Professional.'
  },
  'automation.core': {
    name: 'Workflow Automation Engine',
    benefit: 'Automate attendance, payment and consent follow-ups with ArtsFlow Professional.'
  },
  'analytics.core': {
    name: 'Operational Analytics & Trends',
    benefit: 'Unlock advanced programme, attendance and operational analytics with ArtsFlow Professional.'
  },
  'analytics.advanced': {
    name: 'Advanced Analytics & Insights',
    benefit: 'Unlock advanced programme and operational analytics with ArtsFlow Professional.'
  },
  'staff_operations.core': {
    name: 'Staff Operations & Timesheets',
    benefit: 'Manage staff timesheets, substitutions and payment preparation with ArtsFlow Professional.'
  },
  'finance.reporting': {
    name: 'Advanced Financial Reporting',
    benefit: 'Access financial reconciliation and advanced revenue reporting with ArtsFlow Professional.'
  }
};

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  featureName,
  benefit,
  requiredPlan = 'Professional',
  onUpgradeClick,
  inline = false
}) => {
  const navigate = useNavigate();
  const { lifecycle } = useCustomerLifecycle();

  const meta = (feature && FEATURE_UPGRADE_METADATA[feature]) || {
    name: featureName || 'Advanced Capability',
    benefit: benefit || `This operational feature is included with ArtsFlow ${requiredPlan}.`
  };

  const currentPlanName = lifecycle?.planName || 'Starter';

  const cardContent = (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-indigo-100 shadow-sm text-center max-w-md w-full mx-auto space-y-5">
      {/* Icon Badge */}
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center mx-auto text-indigo-600 shadow-xs">
        <Sparkles className="w-7 h-7" />
      </div>

      {/* Plan Status Pill */}
      <div className="flex items-center justify-center gap-2 text-xs">
        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
          Current: {currentPlanName}
        </span>
        <span className="text-slate-400">→</span>
        <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">
          Available on {requiredPlan}
        </span>
      </div>

      {/* Heading & Benefit */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {meta.name}
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          {meta.benefit}
        </p>
      </div>

      {/* Business Action Notice */}
      <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed">
        Upgrade your organisation to <strong>ArtsFlow {requiredPlan}</strong> to unlock full operational workflows with higher capacity.
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
        {!inline && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        )}

        <Link
          to="/settings/billing"
          onClick={onUpgradeClick}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <span>Upgrade to {requiredPlan}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );

  if (inline) {
    return cardContent;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6">
      {cardContent}
    </div>
  );
};
