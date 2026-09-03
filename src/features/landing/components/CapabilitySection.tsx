import React from 'react';
import {
  GraduationCap,
  CalendarCheck,
  Music,
  Activity,
  CalendarDays,
  Wallet,
  MessageSquare,
  Users,
  Zap,
  Check
} from 'lucide-react';

interface Capability {
  title: string;
  category: string;
  description: string;
  highlights: string[];
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const CAPABILITIES: Capability[] = [
  {
    title: 'Learners & Guardians',
    category: 'Core Administration',
    description: 'Centralized student records, guardian emergency contacts, medical notices, and multi-sibling household management.',
    highlights: ['Student profiles & photos', 'Guardian contact preferences', 'Bulk CSV import', 'Active learner roster'],
    icon: GraduationCap,
    accentColor: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  {
    title: 'Attendance & Teaching',
    category: 'Daily Operations',
    description: 'Lightning-fast attendance registers for rehearsals, classes, and masterclasses with absence pattern detection.',
    highlights: ['One-click status registers', 'Absentee trend alerts', 'Teacher notes & logs', 'Mobile-friendly in studio'],
    icon: CalendarCheck,
    accentColor: 'text-emerald-600 bg-emerald-50 border-emerald-200'
  },
  {
    title: 'Music Operations',
    category: 'Specialist Music Module',
    description: 'Complete instrument asset inventory, student loan allocations, sheet music repertoire, and structured performance rubrics.',
    highlights: ['Instrument asset tracking', 'Learner loan history', 'Graded repertoire library', 'Lesson assessment criteria'],
    icon: Music,
    accentColor: 'text-amber-600 bg-amber-50 border-amber-200'
  },
  {
    title: 'Dance Operations',
    category: 'Specialist Dance Module',
    description: 'Choreography archives with video references, curriculum syllabus levels, costume fittings, and technical assessments.',
    highlights: ['Choreography library', 'Syllabus levels & progress', 'Costume asset allocation', 'Rhythm & technique rubrics'],
    icon: Activity,
    accentColor: 'text-rose-600 bg-rose-50 border-rose-200'
  },
  {
    title: 'Events & Performances',
    category: 'Showcases & Concerts',
    description: 'Coordinate galas, eisteddfods, and recitals with group casting, digital guardian consent sign-offs, and bus transport manifests.',
    highlights: ['Event schedule & stages', 'Digital parent consent', 'Transport bus route planning', 'Performer readiness tracking'],
    icon: CalendarDays,
    accentColor: 'text-purple-600 bg-purple-50 border-purple-200'
  },
  {
    title: 'Tuition & Finance',
    category: 'Bursary & Billing',
    description: 'Automate term tuition charges, instrument hire fees, invoice PDF generation, EFT payment allocations, and outstanding balances.',
    highlights: ['Automated recurring charges', 'Invoice generation (ZAR)', 'EFT payment allocation', 'Real-time debtor balances'],
    icon: Wallet,
    accentColor: 'text-teal-600 bg-teal-50 border-teal-200'
  },
  {
    title: 'Communications',
    category: 'Engagement & Broadcasts',
    description: 'Keep families informed with broadcast announcements, rehearsals logistics notices, and direct WhatsApp links.',
    highlights: ['Term broadcast templates', 'Recipient dispatch logs', 'WhatsApp click-to-chat', 'Document attachment sharing'],
    icon: MessageSquare,
    accentColor: 'text-sky-600 bg-sky-50 border-sky-200'
  },
  {
    title: 'Parent & Guardian Portal',
    category: 'External Access',
    description: 'Self-service portal for parents to view student timetables, past attendance registers, outstanding invoices, and sign digital consent.',
    highlights: ['Dedicated family dashboard', 'Digital consent signing', 'Invoice & receipt download', 'Schedule & session view'],
    icon: Users,
    accentColor: 'text-indigo-600 bg-indigo-50 border-indigo-200'
  },
  {
    title: 'Reporting & Automation',
    category: 'Intelligence & Workflows',
    description: 'Automated background rules for unexcused absences, term report exports, and staff instructional timesheet tracking.',
    highlights: ['Absence auto-alerts', 'Overdue invoice reminders', 'Staff teaching timesheets', 'Audit trail compliance'],
    icon: Zap,
    accentColor: 'text-violet-600 bg-violet-50 border-violet-200'
  }
];

export const CapabilitySection: React.FC = () => {
  return (
    <section id="capabilities" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200/60">
            Real Features, Real Workflows
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
            Every department connected in one workspace
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Eliminate messy spreadsheets, lost instrument forms, and chaotic WhatsApp groups. ArtsFlow OS gives directors, teachers, bursars, and parents a single source of truth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className="rounded-2xl p-7 border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl border ${cap.accentColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {cap.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {cap.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {cap.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <ul className="space-y-2">
                    {cap.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
