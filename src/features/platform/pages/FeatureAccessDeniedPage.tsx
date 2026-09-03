import React from 'react';
import { UpgradePrompt } from '../../../components/ui/UpgradePrompt';

interface FeatureAccessDeniedPageProps {
  feature?: string;
}

export const FeatureAccessDeniedPage: React.FC<FeatureAccessDeniedPageProps> = ({ feature }) => {
  return <UpgradePrompt feature={feature} requiredPlan="Professional" />;
};
