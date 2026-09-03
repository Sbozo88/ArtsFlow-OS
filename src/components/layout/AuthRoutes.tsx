import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const INTERNAL_ROLES = new Set([
  'super_admin',
  'organisation_admin',
  'programme_director',
  'finance',
  'teacher',
  'viewer',
]);

export const ProtectedRoute: React.FC = () => {
  const { user, authUser, organisationId, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (authUser?.accountStatus === 'disabled') return <Navigate to="/access-disabled" replace />;
  
  // External identities must never render the internal application shell.
  if (authUser?.role === 'guardian') {
    return <Navigate to="/portal" replace />;
  }

  if (authUser?.role === 'learner') {
    return <Navigate to="/learner-portal" replace />;
  }

  if (user && !organisationId) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!authUser?.role || !INTERNAL_ROLES.has(authUser.role)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const OnboardingRoute: React.FC = () => {
  const { user, authUser, organisationId, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (authUser?.accountStatus === 'disabled') return <Navigate to="/access-disabled" replace />;
  
  if (user && organisationId) {
    if (authUser?.role === 'guardian') return <Navigate to="/portal" replace />;
    if (authUser?.role === 'learner') return <Navigate to="/learner-portal" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
