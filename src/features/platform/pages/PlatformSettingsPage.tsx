import React, { useState } from 'react';
import { Settings, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const PlatformSettingsPage: React.FC = () => {
  const [platformName, setPlatformName] = useState('ArtsFlow OS');
  const [supportEmail, setSupportEmail] = useState('support@artsflow.com');
  const [environmentLabel] = useState(import.meta.env.MODE || 'production');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-400" />
          Platform Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          High-level SaaS environment parameters and platform branding metadata.
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-emerald-200 text-sm flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Platform metadata updated successfully.</span>
        </div>
      )}

      {/* Scope Disclaimer */}
      <div className="p-4 bg-indigo-950/40 border border-indigo-700/40 rounded-xl text-xs text-indigo-300 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-white block">SaaS 1B Scope Boundary:</span>
          Platform settings govern the overarching SaaS platform. Individual school branding, terms, calendars, and fees remain securely configured inside each school&apos;s workspace. Commercial subscription plans and billing gateways will be introduced in SaaS 2A.
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Platform Name
            </label>
            <input
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Global Support Email
            </label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Deployment Environment
            </label>
            <input
              type="text"
              readOnly
              value={environmentLabel}
              className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-400 font-mono cursor-not-allowed"
            />
          </div>

          <div className="pt-4 border-t border-slate-700 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              Save Platform Metadata
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
