import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LockKeyhole, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AccessDisabledPage: React.FC = () => {
  const { user, authUser, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="min-h-screen grid place-items-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (authUser?.accountStatus !== 'disabled') return <Navigate to="/" replace />;

  const signOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <main className="min-h-screen bg-slate-50 grid place-items-center px-4">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <LockKeyhole className="mx-auto h-12 w-12 text-rose-600" />
        <h1 className="mt-5 text-2xl font-black text-slate-900">Account access disabled</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your organisation has disabled this account. Contact an organisation administrator if you need access restored.
        </p>
        <button type="button" onClick={signOut} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </section>
    </main>
  );
};
