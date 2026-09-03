import React from 'react';
import { LandingNavbar } from './components/LandingNavbar';
import { LandingFooter } from './components/LandingFooter';
import { PricingSection } from './components/PricingSection';

export const PricingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-primary-500 selection:text-white">
      <LandingNavbar />
      <main className="flex-1">
        <PricingSection isStandalonePage={true} />
      </main>
      <LandingFooter />
    </div>
  );
};
