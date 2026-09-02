import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useGuardianPortal, GuardianPortalProvider } from '../../../hooks/useGuardianPortal';
import { ShieldAlert, LogOut } from 'lucide-react';

const InnerGuardianRoute: React.FC = () => {
  const { context, loading, error } = useGuardianPortal();
  const { logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold text-slate-600">Loading Guardian Portal...</p>
      </div>
    );
  }

  if (error || !context) {
    const errorMsg = error?.message || 'Access to the Guardian Portal is not available.';
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-slate-900">Portal Access Notice</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {errorMsg}
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500">
            If you believe this is an error or need an invitation link, please contact your arts organisation administration office.
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export const GuardianProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/portal/login" replace />;
  }

  return (
    <GuardianPortalProvider>
      <InnerGuardianRoute />
    </GuardianPortalProvider>
  );
};
