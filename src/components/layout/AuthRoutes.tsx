import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlements } from '../../contexts/EntitlementContext';
import { PlatformAccessDeniedPage } from '../../features/platform/pages/PlatformAccessDeniedPage';
import { FeatureAccessDeniedPage } from '../../features/platform/pages/FeatureAccessDeniedPage';
import { useActiveOrganisation } from '../../contexts/ActiveOrganisationContext';

const INTERNAL_ROLES = new Set([
  'super_admin',
  'organisation_admin',
  'programme_director',
  'finance',
  'teacher',
  'viewer',
]);

export const ProtectedRoute: React.FC = () => {
  const { user, authUser, loading } = useAuth();
  const { activeOrganisationId: organisationId, availableOrganisations, isResolvingOrganisation } = useActiveOrganisation();

  if (loading || isResolvingOrganisation) return <div className="min-h-screen flex items-center justify-center">Resolving organisation…</div>;
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
    if (availableOrganisations.length > 1) return <Navigate to="/select-organisation" replace />;
    if (authUser?.platformRole === 'super_admin') return <Navigate to="/platform" replace />;
    return <Navigate to="/onboarding" replace />;
  }

  if (!authUser?.role || !INTERNAL_ROLES.has(authUser.role)) {
    if (authUser?.platformRole === 'super_admin') return <Navigate to="/platform" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const OnboardingRoute: React.FC = () => {
  const { user, authUser, loading } = useAuth();
  const { activeOrganisationId: organisationId } = useActiveOrganisation();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (authUser?.accountStatus === 'disabled') return <Navigate to="/access-disabled" replace />;
  
  if (authUser?.platformRole === 'super_admin' && !organisationId) {
    return <Navigate to="/platform" replace />;
  }

  if (user && organisationId) {
    if (authUser?.role === 'guardian') return <Navigate to="/portal" replace />;
    if (authUser?.role === 'learner') return <Navigate to="/learner-portal" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export const PlatformRoute: React.FC = () => {
  const { user, authUser, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (authUser?.accountStatus === 'disabled') return <Navigate to="/access-disabled" replace />;

  const isSuperAdmin = authUser?.platformRole === 'super_admin';
  if (!isSuperAdmin) {
    return <PlatformAccessDeniedPage />;
  }

  return <Outlet />;
};

export const FeatureRoute: React.FC<{ feature: string; children?: React.ReactNode }> = ({ feature, children }) => {
  const { hasFeature, loading } = useEntitlements();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!hasFeature(feature)) {
    return <FeatureAccessDeniedPage feature={feature} />;
  }

  return children ? <>{children}</> : <Outlet />;
};
