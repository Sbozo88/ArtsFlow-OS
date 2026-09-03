import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft, Home, HelpCircle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isPortalRoute = location.pathname.startsWith('/portal');
  const homeLink = isPortalRoute ? '/portal' : '/';
  const homeLabel = isPortalRoute ? 'Return to Portal Home' : 'Return to Dashboard';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl mx-auto flex items-center justify-center text-indigo-600">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>

        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider mb-2">
            Error 404
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Page Not Found
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            The requested destination <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono text-slate-700">{location.pathname}</code> does not exist or you may not have permission to access it.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 shadow-2xs text-sm font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <Link
            to={homeLink}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-transparent shadow-2xs text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>{homeLabel}</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>ArtsFlow OS v1.0.0-rc.1 • Release Readiness</span>
        </div>
      </div>
    </div>
  );
};
