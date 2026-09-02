import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { user, authUser, organisationId, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  // Isolate portal guardians from internal staff routes
  if (authUser?.role === 'guardian') {
    return <Navigate to="/portal" replace />;
  }

  if (user && !organisationId) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

export const OnboardingRoute: React.FC = () => {
  const { user, organisationId, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (user && organisationId) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
