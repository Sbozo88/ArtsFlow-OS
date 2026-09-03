import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

export const LearnerPortalNoticePage: React.FC = () => {
  const { user, authUser, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-sm text-slate-600">Loading...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (authUser?.role === 'guardian') return <Navigate to="/portal" replace />;
  if (authUser?.role !== 'learner') return <Navigate to="/" replace />;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <main className="min-h-screen bg-slate-50 grid place-items-center px-4">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
          <GraduationCap className="h-9 w-9" />
        </div>
        <h1 className="mt-6 text-2xl font-black text-slate-900">Learner Portal</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your learner identity is isolated from staff and guardian records. Learner self-service is
          not enabled in this v1.0 release; contact your organisation for schedules or learning records.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          <span>Your account cannot access the internal administration system.</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </section>
    </main>
  );
};
