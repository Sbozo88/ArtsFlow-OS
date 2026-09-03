import React from 'react';
import { Check, Minus, Sparkles } from 'lucide-react';

interface ComparisonRow {
  category: string;
  starter: string | boolean;
  professional: string | boolean;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  { category: 'Active Learners Limit', starter: '100 learners', professional: '500 learners' },
  { category: 'Staff User Seats', starter: '10 seats', professional: '50 seats' },
  { category: 'Organisation Admins', starter: '2 admins', professional: '10 admins' },
  { category: 'Core Administration (Programmes, Classes, Enrolments)', starter: true, professional: true },
  { category: 'Teaching & Attendance Registers', starter: true, professional: true },
  { category: 'Music Operations (Instruments, Repertoire, Practice)', starter: true, professional: true },
  { category: 'Dance Operations (Choreography, Levels, Wardrobe)', starter: true, professional: true },
  { category: 'Parent / Guardian Self-Service Portal', starter: true, professional: true },
  { category: 'School Invoicing & Fee Collection', starter: 'Core Invoicing', professional: 'Core + Advanced Reconciliation' },
  { category: 'Event & Showcase Management', starter: 'Calendar Only', professional: 'Full Production & Rosters' },
  { category: 'Digital Parent Consent & Sign-offs', starter: false, professional: 'Full Requests & Monitoring' },
  { category: 'Event Transport Planning & Bus Rosters', starter: false, professional: 'Full Manifests & Allocation' },
  { category: 'Parent Communications & Reminders', starter: 'Individual & Direct', professional: 'Bulk & Automated Workflows' },
  { category: 'Staff Operations & Timesheet Logging', starter: false, professional: 'Timesheets & Payroll Prep' },
  { category: 'Workflow Automation Engine', starter: false, professional: 'Attendance, Fee & Alert Rules' },
  { category: 'Analytics & Management Trends', starter: 'Basic KPIs', professional: 'Advanced Trends & Exports' },
  { category: 'Storage Quota', starter: '5 GB (5,000 MB)', professional: '25 GB (25,000 MB)' },
  { category: 'Support & Onboarding', starter: 'Standard Help & Docs', professional: 'Priority Support & Migration Assistance' }
];

export const PlanComparisonView: React.FC<{
  currentPlanCode?: string;
  onSelectPlan?: (planCode: 'starter' | 'professional') => void;
}> = ({ currentPlanCode }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>ArtsFlow Commercial Plans Comparison</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent breakdown of operational capabilities and plan allowances.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-700 font-semibold">
              <th className="py-3.5 px-4 sm:px-6 w-1/2">Capability / Quota</th>
              <th className="py-3.5 px-3 sm:px-4 text-center w-1/4">
                <div className="font-bold text-slate-900 text-sm">Starter</div>
                <div className="text-[11px] font-normal text-slate-500 mt-0.5">R499/mo · R4,990/yr</div>
                {currentPlanCode === 'starter' && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold">
                    Current Plan
                  </span>
                )}
              </th>
              <th className="py-3.5 px-3 sm:px-4 text-center w-1/4 bg-indigo-50/40 border-l border-r border-indigo-100/60">
                <div className="flex items-center justify-center gap-1.5 font-bold text-indigo-950 text-sm">
                  <span>Professional</span>
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-indigo-600 text-white">
                    Most Popular
                  </span>
                </div>
                <div className="text-[11px] font-normal text-indigo-800/80 mt-0.5">R999/mo · R9,990/yr</div>
                {currentPlanCode === 'professional' && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-800 text-[10px] font-semibold">
                    Current Plan
                  </span>
                )}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.category} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4 sm:px-6 font-medium text-slate-800">{row.category}</td>
                <td className="py-3 px-3 sm:px-4 text-center text-xs">
                  {typeof row.starter === 'boolean' ? (
                    row.starter ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <Minus className="w-4 h-4 text-slate-300 mx-auto" />
                    )
                  ) : (
                    <span>{row.starter}</span>
                  )}
                </td>
                <td className="py-3 px-3 sm:px-4 text-center text-xs bg-indigo-50/20 border-l border-r border-indigo-100/40 font-medium text-indigo-950">
                  {typeof row.professional === 'boolean' ? (
                    row.professional ? (
                      <Check className="w-4 h-4 text-indigo-600 mx-auto" />
                    ) : (
                      <Minus className="w-4 h-4 text-slate-300 mx-auto" />
                    )
                  ) : (
                    <span>{row.professional}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
