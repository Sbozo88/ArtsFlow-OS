import React from 'react';
import { Link } from 'react-router-dom';
import { LandingNavbar } from '../landing/components/LandingNavbar';
import { LandingFooter } from '../landing/components/LandingFooter';
import { Shield, ArrowLeft } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <LandingNavbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Shield className="w-3.5 h-3.5" />
            <span>Platform Policy (Pending Legal Finalization)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
            Terms of Service
          </h1>

          <p className="text-sm text-slate-500">
            Last Updated: September 2026 · Version 1.1 Draft
          </p>

          <div className="prose prose-slate max-w-none space-y-6 text-sm text-slate-700 leading-relaxed border-t border-slate-200 pt-6">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
              <p>
                By registering for an ArtsFlow OS account, accessing the platform, or starting a 14-day free trial, you agree to comply with and be bound by these Terms of Service. These terms govern the relationship between your organisation and ArtsFlow OS.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">2. Free Trial & Subscriptions</h2>
              <p>
                All new self-service accounts are entitled to a 14-day Professional evaluation trial with zero payment card required at registration. Following the trial period, access continues under either the Starter or Professional commercial tier via supported invoicing or payment methods.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">3. Educational Data & Privacy</h2>
              <p>
                ArtsFlow OS serves as a data processor for school organisations. Participating academies retain complete ownership of their student registers, attendance records, guardian details, and financial ledgers. We implement tenant-isolated database security rules ensuring cross-tenant isolation.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">4. Permitted Use & Security</h2>
              <p>
                Users agree not to attempt unauthorized escalation of account roles, bypass usage limits, or access other school tenants. Administrators are responsible for maintaining the confidentiality of their credentials and invitations.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">5. Contact Information</h2>
              <p>
                For questions regarding these draft Terms of Service, please contact <a href="mailto:support@artsflow.co.za" className="text-primary-600 font-semibold hover:underline">support@artsflow.co.za</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
};
