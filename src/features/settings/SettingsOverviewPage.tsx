import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Building2, 
  Calendar, 
  Layers, 
  Users, 
  CreditCard, 
  CheckSquare, 
  MessageSquare, 
  Cpu, 
  Palette, 
  Sparkles
} from 'lucide-react';
import { SettingsNav } from './components/SettingsNav';
import { useOrganisationSettings } from '../../hooks/useOrganisationSettings';
import { useCalendarPeriods } from '../../hooks/useCalendarPeriods';
import { useOrganisationUsers } from '../../hooks/useOrganisationUsers';
import { useProgrammes } from '../../hooks/useProgrammes';
import { useAuth } from '../../contexts/AuthContext';
import { automationRuleRepository } from '../../repositories/automationRuleRepository';

interface SetupItem {
  id: string;
  title: string;
  description: string;
  status: 'complete' | 'needs_attention' | 'optional';
  statusText: string;
  link: string;
  icon: React.ElementType;
}

export const SettingsOverviewPage: React.FC = () => {
  const { organisationId } = useAuth();
  const { settings, loading: settingsLoading } = useOrganisationSettings();
  const { periods, loading: periodsLoading } = useCalendarPeriods();
  const { members, loading: usersLoading } = useOrganisationUsers();
  const { programmes, loading: programmesLoading } = useProgrammes();
  const [activeRulesCount, setActiveRulesCount] = useState<number>(0);

  useEffect(() => {
    if (!organisationId) return;
    automationRuleRepository.getByOrganisation(organisationId).then(rules => {
      setActiveRulesCount(rules.filter(r => r.ruleStatus === 'active').length);
    }).catch(() => {});
  }, [organisationId]);

  const loading = settingsLoading || periodsLoading || usersLoading || programmesLoading;

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Derive Setup Checklist Dynamically
  const checklist: SetupItem[] = [
    {
      id: 'profile',
      title: 'Organisation Profile',
      description: 'Legal identity, registration details, timezone, and location',
      status: settings.profile.name && settings.profile.timezone ? 'complete' : 'needs_attention',
      statusText: settings.profile.name ? 'Profile Configured' : 'Needs Basic Info',
      link: '/settings/organisation',
      icon: Building2
    },
    {
      id: 'calendar',
      title: 'Operational Calendar',
      description: 'Academic terms, semesters, quarters, or cycle dates',
      status: periods.length > 0 ? 'complete' : 'needs_attention',
      statusText: periods.length > 0 ? `${periods.length} Periods Defined` : 'No Periods Created',
      link: '/settings/calendar',
      icon: Calendar
    },
    {
      id: 'programmes',
      title: 'Programmes & Capacity Defaults',
      description: 'Allowed disciplines, default duration, and capacity limit',
      status: (programmes.length > 0 || settings.programmes.allowedProgrammeTypes.length > 0) ? 'complete' : 'needs_attention',
      statusText: `${settings.programmes.allowedProgrammeTypes.length} Types Allowed`,
      link: '/settings/programmes',
      icon: Layers
    },
    {
      id: 'users',
      title: 'Team & Role Assignments',
      description: 'Staff members, directors, finance officers, and role access',
      status: members.length > 0 ? 'complete' : 'needs_attention',
      statusText: `${members.length} Active Members`,
      link: '/settings/users',
      icon: Users
    },
    {
      id: 'finance',
      title: 'Finance & Invoicing Defaults',
      description: 'Currency, invoice numbering sequence, payment terms, and tax rules',
      status: settings.finance.invoicePrefix && settings.finance.defaultCurrency ? 'complete' : 'needs_attention',
      statusText: `${settings.finance.defaultCurrency} • Prefix ${settings.finance.invoicePrefix}`,
      link: '/settings/finance',
      icon: CreditCard
    },
    {
      id: 'attendance',
      title: 'Attendance Policies & Alerts',
      description: 'Low attendance threshold, consecutive absence trigger, and formulas',
      status: settings.attendance.lowAttendanceThresholdPercent > 0 ? 'complete' : 'needs_attention',
      statusText: `${settings.attendance.lowAttendanceThresholdPercent}% Threshold`,
      link: '/settings/attendance',
      icon: CheckSquare
    },
    {
      id: 'communication',
      title: 'Communication Channels',
      description: 'Guardian & staff contact channels, reply emails, and signatures',
      status: 'optional',
      statusText: `${settings.communication.defaultGuardianChannel.toUpperCase()} Default`,
      link: '/settings/communication',
      icon: MessageSquare
    },
    {
      id: 'automation',
      title: 'Workflow Automation Defaults',
      description: 'Recommended rules, cooldown windows, and dry-run safety modes',
      status: activeRulesCount > 0 ? 'complete' : 'optional',
      statusText: activeRulesCount > 0 ? `${activeRulesCount} Rules Active` : 'Recommended Rules Available',
      link: '/settings/automation',
      icon: Cpu
    },
    {
      id: 'branding',
      title: 'Branding & Asset Customisation',
      description: 'Organisation display name, logos, and document headers',
      status: settings.branding.organisationDisplayName ? 'complete' : 'optional',
      statusText: settings.branding.logoUrl ? 'Logo Uploaded' : 'Theme Configured',
      link: '/settings/branding',
      icon: Palette
    }
  ];

  const completedCount = checklist.filter(i => i.status === 'complete').length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50">
      <SettingsNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                Administration Workspace
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {settings.profile.timezone}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">Organisation Settings & Readiness</h1>
            <p className="text-sm text-slate-500">
              Manage operational configuration, policies, calendar periods, and access roles across ArtsFlow OS.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/settings/organisation"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>

        {/* Readiness Checklist Banner */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Organisation Readiness Checklist</h2>
                  <p className="text-xs text-indigo-200">
                    Configuration automatically evaluated from actual organisation settings and operational records.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black">{progressPercent}%</span>
                <div className="text-xs text-indigo-200 font-medium">{completedCount} of {checklist.length} configured</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
              <div
                className="bg-indigo-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Checklist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {checklist.map((item) => {
            const Icon = item.icon;
            const isComplete = item.status === 'complete';
            const isAttention = item.status === 'needs_attention';

            return (
              <Link
                key={item.id}
                to={item.link}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 bg-slate-50 group-hover:bg-indigo-50 text-slate-700 group-hover:text-indigo-600 rounded-xl transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      {isComplete && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Complete
                        </span>
                      )}
                      {isAttention && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Needs Setup
                        </span>
                      )}
                      {!isComplete && !isAttention && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Optional
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-600 font-semibold">{item.statusText}</span>
                  <span className="text-indigo-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Configure <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
