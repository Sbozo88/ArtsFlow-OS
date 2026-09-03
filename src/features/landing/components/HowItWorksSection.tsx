import React from 'react';
import { UserPlus, Sparkles, Users, Play, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const STEPS = [
  {
    step: '01',
    title: 'Start your 14-day trial',
    description: 'Instant self-service signup with zero payment card required. Get immediate access to all ArtsFlow Professional features.',
    icon: UserPlus,
    badge: '30 seconds'
  },
  {
    step: '02',
    title: 'Set up your organisation',
    description: 'Quick guided wizard configures your academy details, terms, currencies (ZAR), and arts disciplines (Music, Dance, or Both).',
    icon: Sparkles,
    badge: 'Step-by-step'
  },
  {
    step: '03',
    title: 'Add staff and learners',
    description: 'Invite teachers with dedicated role permissions. Register learners individually or import entire rosters via standard CSV spreadsheet.',
    icon: Users,
    badge: 'Flexible'
  },
  {
    step: '04',
    title: 'Run your arts programme',
    description: 'Take mobile attendance, loan instruments, archive choreography, send notices, and invoice term fees from one unified command center.',
    icon: Play,
    badge: 'Ready to go'
  }
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-24 bg-slate-50 border-t border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            Frictionless Onboarding
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
            Up and running in minutes, not months
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            No lengthy enterprise sales calls or complex technical setups. Start your trial today, invite your team, and take your first attendance tomorrow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm relative flex flex-col justify-between group hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl font-black text-slate-300 group-hover:text-primary-500 transition-colors">
                      {item.step}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-5 shadow-sm group-hover:bg-primary-600 transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2.5">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {idx < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA Bar */}
        <div className="mt-16 text-center">
          <Link
            to="/start-trial"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg transition-all group"
          >
            <span>Start Your 14-Day Free Trial</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="mt-3 text-xs text-slate-500">
            No credit card required · Instant automated setup · Full Professional features
          </p>
        </div>
      </div>
    </section>
  );
};
