import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  ClipboardList,
  LogOut,
  Music,
  Activity,
  CalendarDays,
  FileCheck,
  Bus,
  Wallet,
  MessageSquare,
  FileText,
  BarChart3,
  Zap,
  Briefcase,
  Settings as SettingsIcon,
  ChevronDown,
  ChevronLeft,
  X,
  Building2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlements } from '../../contexts/EntitlementContext';
import { usePermissions } from '../../hooks/usePermission';
import type { Permission } from '../../types';

// ── Navigation Data ──────────────────────────────────────────────────────────

interface NavChild {
  name: string;
  path: string;
  featureKey?: string;
}

interface NavGroup {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  featureKey?: string;
  permission?: Permission;
  children?: NavChild[];
}

const navItems: NavGroup[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  {
    name: 'People',
    icon: Users,
    children: [
      { name: 'Learners', path: '/learners' },
      { name: 'Guardians', path: '/guardians' },
      { name: 'Staff', path: '/staff' },
    ],
  },
  {
    name: 'Programmes',
    icon: GraduationCap,
    children: [
      { name: 'All Programmes', path: '/programmes' },
      { name: 'Groups & Classes', path: '/groups' },
      { name: 'Enrolments', path: '/enrolments' },
    ],
  },
  {
    name: 'Teaching',
    icon: CalendarCheck,
    children: [
      { name: 'Sessions', path: '/sessions' },
      { name: 'Attendance', path: '/attendance' },
    ],
  },
  {
    name: 'Music',
    icon: Music,
    featureKey: 'music.core',
    children: [
      { name: 'Overview', path: '/music' },
      { name: 'Instruments', path: '/music/instruments' },
      { name: 'Ensembles', path: '/music/ensembles' },
      { name: 'Repertoire', path: '/music/repertoire' },
      { name: 'Practice Logs', path: '/music/practice' },
      { name: 'Assessments', path: '/music/assessments' },
    ],
  },
  {
    name: 'Dance',
    icon: Activity,
    featureKey: 'dance.core',
    children: [
      { name: 'Overview', path: '/dance' },
      { name: 'Levels', path: '/dance/levels' },
      { name: 'Classes', path: '/dance/classes' },
      { name: 'Choreography', path: '/dance/choreography' },
      { name: 'Costumes', path: '/dance/costumes' },
      { name: 'Practice', path: '/dance/practice' },
      { name: 'Assessments', path: '/dance/assessments' },
    ],
  },
  {
    name: 'Events',
    icon: CalendarDays,
    featureKey: 'events.core',
    children: [
      { name: 'Overview', path: '/events' },
      { name: 'Calendar / List', path: '/events/calendar' },
      { name: 'Participants', path: '/events/participants' },
      { name: 'Reports', path: '/events/reports' },
    ],
  },
  {
    name: 'Consent',
    icon: FileCheck,
    featureKey: 'events.consent',
    children: [
      { name: 'Requests & Status', path: '/consent' },
      { name: 'Consent Templates', path: '/consent/templates' },
    ],
  },
  {
    name: 'Transport',
    icon: Bus,
    featureKey: 'events.transport',
    children: [
      { name: 'Fleet & Providers', path: '/transport' },
      { name: 'Transport Reports', path: '/transport/reports' },
    ],
  },
  {
    name: 'Finance',
    icon: Wallet,
    featureKey: 'finance.core',
    permission: 'finance.read',
    children: [
      { name: 'Overview', path: '/finance' },
      { name: 'Invoices', path: '/finance/invoices' },
      { name: 'Payments & Receipts', path: '/finance/payments' },
      { name: 'Charges', path: '/finance/charges' },
      { name: 'Outstanding Balances', path: '/finance/outstanding' },
      { name: 'Financial Reports', path: '/finance/reports' },
      { name: 'Charge Types', path: '/finance/charge-types' },
    ],
  },
  {
    name: 'Communication',
    icon: MessageSquare,
    featureKey: 'communication.core',
    children: [
      { name: 'Overview', path: '/communication' },
      { name: 'Compose Message', path: '/communication/compose' },
      { name: 'History & Logs', path: '/communication/history' },
      { name: 'Templates', path: '/communication/templates' },
    ],
  },
  {
    name: 'Documents',
    icon: FileText,
    featureKey: 'documents.core',
    children: [
      { name: 'Files Repository', path: '/documents' },
      { name: 'Generate Forms', path: '/documents/generated' },
      { name: 'Doc Templates', path: '/documents/templates' },
    ],
  },
  { name: 'Follow-Ups', path: '/follow-ups', icon: ClipboardList },
  {
    name: 'Analytics',
    icon: BarChart3,
    featureKey: 'analytics.core',
    children: [
      { name: 'Overview', path: '/analytics' },
      { name: 'Learners', path: '/analytics/learners' },
      { name: 'Programmes', path: '/analytics/programmes' },
      { name: 'Attendance', path: '/analytics/attendance' },
      { name: 'Events', path: '/analytics/events' },
      { name: 'Finance', path: '/analytics/finance' },
      { name: 'Reports', path: '/analytics/reports' },
    ],
  },
  {
    name: 'Automation',
    icon: Zap,
    featureKey: 'automation.core',
    children: [
      { name: 'Overview', path: '/automation' },
      { name: 'Rules', path: '/automation/rules' },
      { name: 'Activity', path: '/automation/activity' },
      { name: 'Notifications', path: '/notifications' },
    ],
  },
  {
    name: 'Staff Operations',
    icon: Briefcase,
    featureKey: 'staff_operations.core',
    children: [
      { name: 'Overview', path: '/staff-operations' },
      { name: 'Assignments', path: '/staff-operations/assignments' },
      { name: 'Work Records', path: '/staff-operations/work-records' },
      { name: 'Timesheets', path: '/staff-operations/timesheets' },
      { name: 'Verification', path: '/staff-operations/verification' },
      { name: 'Availability', path: '/staff-operations/availability' },
      { name: 'Workload', path: '/staff-operations/workload' },
      { name: 'Reports', path: '/staff-operations/reports' },
    ],
  },
  {
    name: 'Settings',
    icon: SettingsIcon,
    permission: 'settings.read',
    children: [
      { name: 'Overview', path: '/settings' },
      { name: 'Organisation Profile', path: '/settings/organisation' },
      { name: 'Operational Calendar', path: '/settings/calendar' },
      { name: 'Programmes & Classes', path: '/settings/programmes' },
      { name: 'Attendance Rules', path: '/settings/attendance' },
      { name: 'Finance & Invoicing', path: '/settings/finance' },
      { name: 'Portal Settings', path: '/settings/portal' },
      { name: 'Staff & Timesheets', path: '/settings/staff' },
      { name: 'Communication', path: '/settings/communication' },
      { name: 'Automation Defaults', path: '/settings/automation' },
      { name: 'Users & Roles', path: '/settings/users' },
      { name: 'Branding & Assets', path: '/settings/branding' },
      { name: 'System Preferences', path: '/settings/system' },
      { name: 'Audit History', path: '/settings/audit' },
    ],
  },
];

// ── Sidebar Component ────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const { logout } = useAuth();
  const location = useLocation();

  // Track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const { hasFeature } = useEntitlements();
  const { can } = usePermissions();
  const visibleNavItems = navItems.filter((item) =>
    (!item.featureKey || hasFeature(item.featureKey)) && (!item.permission || can(item.permission))
  );

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
            <Music className="w-4.5 h-4.5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-white truncate">ArtsFlow OS</span>
          )}
        </div>
        {/* Collapse button (desktop) */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
        {/* Close button (mobile) */}
        <button
          type="button"
          onClick={onMobileClose}
          className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto no-scrollbar">
        {visibleNavItems.map((item) => (
          <NavItem
            key={item.name}
            item={item}
            collapsed={collapsed}
            expanded={
              expandedGroups.has(item.name) ||
              Boolean(item.children?.some(
                (child) => location.pathname === child.path || location.pathname.startsWith(child.path + '/')
              ))
            }
            onToggle={() => toggleGroup(item.name)}
            onNavigate={onMobileClose}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <NavLink
          to="/account/organisations"
          onClick={onMobileClose}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors text-slate-400 hover:text-white hover:bg-slate-800',
            collapsed && 'justify-center'
          )}
        >
          <Building2 className="w-4 h-4 shrink-0" />
          {!collapsed && <span>My Organisations</span>}
        </NavLink>
        <button
          onClick={() => logout()}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors text-slate-400 hover:text-white hover:bg-slate-800',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen bg-slate-900 text-slate-300 flex flex-col transition-all duration-200',
          // Desktop
          'hidden lg:flex',
          collapsed ? 'w-[68px]' : 'w-64',
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-72 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

// ── NavItem ──────────────────────────────────────────────────────────────────

interface NavItemProps {
  item: NavGroup;
  collapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}

function NavItem({ item, collapsed, expanded, onToggle, onNavigate }: NavItemProps) {
  const location = useLocation();
  const Icon = item.icon;

  // Direct link (no children)
  if (item.path !== undefined) {
    return (
      <NavLink
        to={item.path}
        end={item.path === '/'}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            isActive
              ? 'bg-indigo-600 text-white font-medium'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white',
            collapsed && 'justify-center px-2'
          )
        }
      >
        <Icon className="w-[18px] h-[18px] shrink-0" />
        {!collapsed && <span className="truncate">{item.name}</span>}
      </NavLink>
    );
  }

  // Group with children
  const isGroupActive = item.children?.some(
    (child) => location.pathname === child.path || location.pathname.startsWith(child.path + '/')
  );

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors',
          isGroupActive
            ? 'text-white font-medium'
            : 'text-slate-400 hover:text-white hover:bg-slate-800',
          collapsed && 'justify-center px-2'
        )}
        aria-expanded={expanded}
      >
        <Icon className="w-[18px] h-[18px] shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">{item.name}</span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 shrink-0 transition-transform text-slate-500',
                expanded && 'rotate-180'
              )}
            />
          </>
        )}
      </button>

      {!collapsed && expanded && item.children && (
        <div className="ml-[30px] mt-0.5 space-y-0.5 border-l border-slate-800 pl-3">
          {item.children.map((child) => (
            <NavLink
              key={child.path}
              to={child.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'block px-3 py-1.5 rounded-lg text-[13px] transition-colors',
                  isActive
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                )
              }
            >
              {child.name}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
