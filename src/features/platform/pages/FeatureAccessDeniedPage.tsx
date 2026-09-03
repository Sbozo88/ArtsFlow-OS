import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowLeft, ShieldAlert } from 'lucide-react';

interface FeatureAccessDeniedPageProps {
  feature?: string;
}

export const FeatureAccessDeniedPage: React.FC<FeatureAccessDeniedPageProps> = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5 text-amber-600">
          <Lock className="w-7 h-7" />
        </div>

        <h1 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
          Feature Not Available
        </h1>

        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          This capability is not included in your organisation&apos;s current plan or entitlement configuration.
        </p>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl mb-6 text-xs text-slate-500 flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Contact your ArtsFlow administrator or account owner to request access.</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
