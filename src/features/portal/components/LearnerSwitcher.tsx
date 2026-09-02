import React from 'react';
import { Users, ChevronDown, Check } from 'lucide-react';
import { useGuardianPortal } from '../../../hooks/useGuardianPortal';

export const LearnerSwitcher: React.FC = () => {
  const { context, selectedLearnerId, setSelectedLearnerId } = useGuardianPortal();
  const [open, setOpen] = React.useState(false);

  if (!context || context.linkedLearners.length <= 1) {
    return null;
  }

  const currentLearner = context.linkedLearners.find(l => l.id === selectedLearnerId) || context.linkedLearners[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200/80 rounded-xl text-xs font-bold text-indigo-900 transition-colors shadow-sm"
      >
        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
          {currentLearner.firstName.charAt(0)}
        </div>
        <span className="truncate max-w-[120px] sm:max-w-[160px]">
          {currentLearner.preferredName || currentLearner.firstName} {currentLearner.lastName}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3.5 py-2 border-b border-slate-100 flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>Switch Learner</span>
            </div>

            <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
              {context.linkedLearners.map(learner => {
                const isSelected = learner.id === selectedLearnerId;
                return (
                  <button
                    key={learner.id}
                    type="button"
                    onClick={() => {
                      setSelectedLearnerId(learner.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {learner.firstName.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="truncate">{learner.preferredName || learner.firstName} {learner.lastName}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
