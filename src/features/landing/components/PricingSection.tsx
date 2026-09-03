import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export const PricingSection: React.FC<{ isStandalonePage?: boolean }> = ({ isStandalonePage = false }) => {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');

  return (
    <section id="pricing" className={`py-24 ${isStandalonePage ? 'bg-white' : 'bg-white border-t border-slate-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            Simple, Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
            Predictable pricing that scales with your academy
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            All plans begin with a <strong>14-day free Professional trial</strong> with zero credit card required. After your trial, select the plan that matches your programme's scale.
          </p>

          {/* Billing Interval Toggle */}
          <div className="pt-6 flex items-center justify-center">
            <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setBillingInterval('monthly')}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  billingInterval === 'monthly'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly billing
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval('annual')}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  billingInterval === 'annual'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Annual billing</span>
                <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Save 2 months
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <div className="rounded-3xl p-8 sm:p-10 border border-slate-200 bg-white shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">ArtsFlow Starter</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    For growing music studios, dance schools, and local projects.
                  </p>
                </div>
              </div>

              <div className="my-8 pb-8 border-b border-slate-100">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold text-slate-900 tracking-tight">
                    {billingInterval === 'monthly' ? 'R499' : 'R4,990'}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">
                    {billingInterval === 'monthly' ? '/ month' : '/ year (save R998)'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Prices in ZAR · Billed {billingInterval === 'monthly' ? 'monthly' : 'annually'} · Cancel anytime
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Included in Starter:
                </h4>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Up to 100 active learners</strong></span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Up to 10 staff user seats</strong></span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Music Programme (Instruments & Repertoire)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Dance Programme (Levels & Choreography)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Attendance registers & absence tracking</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Parent & Guardian self-service portal</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Core Tuition invoicing & EFT balance ledger</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Core Administration & group scheduling</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-10">
              <Link
                to="/start-trial?plan=starter"
                className="w-full py-3.5 px-6 rounded-xl font-bold text-center block text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
              >
                Start Free Trial
              </Link>
              <p className="text-center text-xs text-slate-400 mt-2.5">
                Full 14 days of Professional features included during trial
              </p>
            </div>
          </div>

          {/* Professional Plan */}
          <div className="rounded-3xl p-8 sm:p-10 border-2 border-indigo-600 bg-gradient-to-b from-indigo-50/40 via-white to-white shadow-xl relative flex flex-col justify-between">
            {/* Most Popular Badge */}
            <div className="absolute -top-4 right-8 bg-gradient-to-r from-indigo-600 to-primary-600 text-white text-xs font-extrabold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-md flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Most Popular</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">ArtsFlow Professional</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    For multi-discipline academies, large departments, and production schools.
                  </p>
                </div>
              </div>

              <div className="my-8 pb-8 border-b border-indigo-100">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold text-slate-900 tracking-tight">
                    {billingInterval === 'monthly' ? 'R999' : 'R9,990'}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">
                    {billingInterval === 'monthly' ? '/ month' : '/ year (save R1,998)'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Prices in ZAR · Billed {billingInterval === 'monthly' ? 'monthly' : 'annually'} · Cancel anytime
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Everything in Starter, plus:
                </h4>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-center gap-3 font-semibold text-slate-900">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Up to 500 active learners (5x capacity)</span>
                  </li>
                  <li className="flex items-center gap-3 font-semibold text-slate-900">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Up to 50 staff user seats</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Events & Performance Management</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Digital Parent Consent Sign-Offs & Medicals</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Coordinated Bus & Transport Manifests</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Advanced Tuition Finance & Ledger Statements</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Staff Operations & Teaching Timesheets</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Workflow Automation Rules & Notifications</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Advanced Academy Analytics & Reports</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-10">
              <Link
                to="/start-trial?plan=professional"
                className="w-full py-3.5 px-6 rounded-xl font-bold text-center block text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Start Professional Trial</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mt-2.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>14-day free trial · No payment card required</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
