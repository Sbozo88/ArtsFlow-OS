import React from 'react';
import { useEntitlements } from '../../contexts/EntitlementContext';

interface FeatureGateProps {
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Declarative component that conditionally renders its children if the active organisation
 * has an active entitlement for the specified featureKey.
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({ feature, fallback = null, children }) => {
  const { hasFeature, loading } = useEntitlements();

  if (loading) return null;
  if (!hasFeature(feature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
