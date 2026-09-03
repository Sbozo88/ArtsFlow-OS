import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle2, Music, Activity } from 'lucide-react';
import { LandingNavbar } from './components/LandingNavbar';
import { LandingFooter } from './components/LandingFooter';
import { TargetAudienceSection } from './components/TargetAudienceSection';
import { CapabilitySection } from './components/CapabilitySection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { PricingSection } from './components/PricingSection';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-primary-500 selection:text-white">
      <LandingNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] overflow-hidden -z-10 pointer-events-none opacity-50">
            <div className="absolute -top-40 left-1/4 w-96 h-96 bg-primary-300/30 rounded-full blur-3xl" />
            <div className="absolute -top-20 right-1/4 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto space-y-6">
              {/* Product Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-900 text-white shadow-sm hover:bg-slate-800 transition-colors">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>ArtsFlow OS v1.1 is now live</span>
                <span className="w-1 h-1 rounded-full bg-slate-400" />
                <span className="text-slate-300">14-Day Free Trial</span>
              </div>

              {/* Authoritative Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tight text-slate-900 leading-[1.1]">
                Run your entire arts programme{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-primary-600 to-amber-500 bg-clip-text text-transparent">
                  from one place.
                </span>
              </h1>

              {/* Supporting Message */}
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
                Manage learners, teachers, attendance, music, dance, payments, performances and parents with one purpose-built arts administration platform.
              </p>

              {/* Hero CTAs */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/start-trial"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/10 hover:shadow-xl transition-all group"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#pricing"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                >
                  View Plans
                </a>
              </div>

              {/* Confidence Micro-Copy */}
              <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>14-day Professional trial</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Setup in under 5 minutes</span>
                </div>
              </div>
            </div>

            {/* Platform Mockup Showcase */}
            <div className="mt-14 max-w-5xl mx-auto">
              <div className="rounded-3xl border border-slate-200/80 bg-slate-900 p-2 sm:p-4 shadow-2xl shadow-slate-900/15">
                <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden text-white">
                  {/* Mock Window Top Bar */}
                  <div className="h-10 bg-slate-900/80 border-b border-slate-800 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      artflow-os.web.app/dashboard
                    </div>
                    <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Live Academy
                    </div>
                  </div>

                  {/* Visual Preview Grid */}
                  <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded">94.2%</span>
                      </div>
                      <div className="text-2xl font-black text-white">88 / 92 Present</div>
                      <p className="text-xs text-slate-400">Junior Brass & Beginner Strings registers confirmed today</p>
                    </div>

                    <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Music Assets</span>
                        <Music className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-2xl font-black text-white">42 Instruments</div>
                      <p className="text-xs text-slate-400">38 Allocated to learners · 4 in workshop maintenance</p>
                    </div>

                    <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Upcoming Gala</span>
                        <Activity className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="text-2xl font-black text-white">Spring Showcase</div>
                      <p className="text-xs text-slate-400">Joburg Theatre · 100% Parent digital consent verified</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Target Audience */}
        <TargetAudienceSection />

        {/* Section: Capabilities */}
        <CapabilitySection />

        {/* Section: How It Works */}
        <HowItWorksSection />

        {/* Section: Pricing */}
        <PricingSection />

        {/* Bottom Banner CTA */}
        <section className="py-20 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight">
              Ready to modernize your arts academy?
            </h2>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
              Join leading performing arts schools and academies running on ArtsFlow OS. Start your free 14-day trial in under a minute.
            </p>
            <div className="pt-2">
              <Link
                to="/start-trial"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-xl hover:shadow-2xl transition-all group"
              >
                <span>Start 14-Day Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <p className="text-xs text-slate-400">
              No credit card required · Instant access · ZAR pricing for South African schools
            </p>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};
