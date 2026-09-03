import React from 'react';
import { Link } from 'react-router-dom';
import { LandingNavbar } from '../landing/components/LandingNavbar';
import { LandingFooter } from '../landing/components/LandingFooter';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <LandingNavbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy Policy (Pending Legal Finalization)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
            Privacy Policy
          </h1>

          <p className="text-sm text-slate-500">
            Last Updated: September 2026 · Version 1.1 Draft
          </p>

          <div className="prose prose-slate max-w-none space-y-6 text-sm text-slate-700 leading-relaxed border-t border-slate-200 pt-6">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">1. Information We Collect</h2>
              <p>
                ArtsFlow OS collects basic account contact information (administrator name, work email address, and optional school phone number) necessary to create and authenticate your school workspace.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">2. School Tenant Data</h2>
              <p>
                Data entered into your academy workspace—such as learner profiles, emergency contacts, attendance records, instrument serial numbers, and tuition invoices—is processed exclusively for your organisation's administration.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">3. Multi-Tenant Security & Protection</h2>
              <p>
                All data is encrypted in transit and at rest using Google Cloud Firebase infrastructure. Strict Firestore security rules isolate every query by authenticated organisation ID to prevent cross-tenant data exposure.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">4. Third Parties & Marketing</h2>
              <p>
                We do not sell, rent, or monetize educational data or student rosters to any third parties or advertisers.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">5. Contact Our Data Officer</h2>
              <p>
                For privacy inquiries or compliance requests under the Protection of Personal Information Act (POPIA), please email <a href="mailto:support@artsflow.co.za" className="text-primary-600 font-semibold hover:underline">support@artsflow.co.za</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
};
