import React from 'react';
import { School, Music, Activity, Users, HeartHandshake, Clock } from 'lucide-react';

const AUDIENCES = [
  {
    title: 'Schools & Colleges',
    description: 'Comprehensive curriculum tracking, term timetables, attendance registers, and house ensembles.',
    icon: School,
    color: 'from-blue-500 to-indigo-600',
    tag: 'Academic Arts'
  },
  {
    title: 'Music Academies',
    description: 'Instrument inventory, student loan allocations, repertoire difficulty grading, and lesson review scoring.',
    icon: Music,
    color: 'from-amber-500 to-orange-600',
    tag: 'Instruments & Voice'
  },
  {
    title: 'Dance Studios',
    description: 'Choreography archives, rehearsal tracking, syllabus levels, costume fittings, and performance readiness.',
    icon: Activity,
    color: 'from-pink-500 to-rose-600',
    tag: 'Ballet, Contemporary, Tap'
  },
  {
    title: 'Community Arts Projects',
    description: 'Grant management, bursary tracking, youth enrolments, community showcases, and transport coordination.',
    icon: Users,
    color: 'from-emerald-500 to-teal-600',
    tag: 'Community Ensembles'
  },
  {
    title: 'Arts NGOs & Foundations',
    description: 'Donor reporting, transparent attendance metrics, impact indicators, and multi-hub oversight.',
    icon: HeartHandshake,
    color: 'from-purple-500 to-violet-600',
    tag: 'Non-Profit & Social Impact'
  },
  {
    title: 'After-School Programmes',
    description: 'Flexible drop-in rosters, parent pickup security, mobile attendance, and automated absence notifications.',
    icon: Clock,
    color: 'from-sky-500 to-cyan-600',
    tag: 'Extracurricular Arts'
  }
];

export const TargetAudienceSection: React.FC = () => {
  return (
    <section className="py-20 bg-slate-50/70 border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            Tailored For Performing Arts
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
            Built specifically for arts educators
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Unlike generic school databases or generic studio booking software, ArtsFlow OS is engineered around instruments, rehearsals, repertoire, stages, and student creative growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {AUDIENCES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-all group hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-5">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shadow-md`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
                    {item.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
