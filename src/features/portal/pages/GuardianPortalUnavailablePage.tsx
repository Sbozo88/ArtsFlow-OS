import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const GuardianPortalUnavailablePage: React.FC = () => (
  <main className="min-h-screen bg-slate-50 grid place-items-center px-4">
    <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
        <ShieldAlert className="h-9 w-9" />
      </div>
      <h1 className="mt-6 text-2xl font-black text-slate-900">Guardian Portal Unavailable</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Guardian self-service is temporarily disabled while relationship-scoped data access and
        invitation acceptance complete production security validation.
      </p>
      <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs font-semibold text-slate-600">
        Please contact your arts organisation directly for learner records, consent, transport,
        invoices, or account assistance.
      </p>
    </section>
  </main>
);
