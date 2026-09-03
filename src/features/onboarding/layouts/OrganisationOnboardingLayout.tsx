import React from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OrganisationOnboardingLayoutProps {
  organisationName: string;
  currentStepIndex: number;
  totalSteps: number;
  stepTitle: string;
  children: React.ReactNode;
}

export const OrganisationOnboardingLayout: React.FC<OrganisationOnboardingLayoutProps> = ({
  organisationName,
  currentStepIndex,
  totalSteps,
  stepTitle,
  children
}) => {
  const percentage = Math.min(100, Math.round(((currentStepIndex + 1) / totalSteps) * 100));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white tracking-tight">ArtsFlow OS</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 font-medium px-2 py-0.5 rounded-full">
                  Setup Wizard
                </span>
              </div>
              <p className="text-xs text-slate-400">{organisationName}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Step {currentStepIndex + 1} of {totalSteps}</span>
                <span className="font-semibold text-indigo-400">{percentage}%</span>
              </div>
              <div className="w-36 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            <Link
              to="/dashboard"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-slate-800 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Save & Exit
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">{stepTitle}</h1>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};
