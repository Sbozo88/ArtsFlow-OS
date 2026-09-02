import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Building2, 
  Calendar, 
  Layers, 
  CheckSquare, 
  CreditCard, 
  Users, 
  Clock, 
  MessageSquare, 
  Cpu, 
  Palette, 
  Sliders, 
  History,
  LayoutDashboard
} from 'lucide-react';

export const SettingsNav: React.FC = () => {
  const links = [
    { name: 'Overview', path: '/settings', icon: LayoutDashboard, end: true },
    { name: 'Organisation', path: '/settings/organisation', icon: Building2 },
    { name: 'Calendar', path: '/settings/calendar', icon: Calendar },
    { name: 'Programmes', path: '/settings/programmes', icon: Layers },
    { name: 'Attendance', path: '/settings/attendance', icon: CheckSquare },
    { name: 'Finance', path: '/settings/finance', icon: CreditCard },
    { name: 'Staff & Timesheets', path: '/settings/staff', icon: Clock },
    { name: 'Communication', path: '/settings/communication', icon: MessageSquare },
    { name: 'Automation', path: '/settings/automation', icon: Cpu },
    { name: 'Users & Roles', path: '/settings/users', icon: Users },
    { name: 'Branding', path: '/settings/branding', icon: Palette },
    { name: 'System', path: '/settings/system', icon: Sliders },
    { name: 'Audit History', path: '/settings/audit', icon: History }
  ];

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 overflow-x-auto py-2 no-scrollbar">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};
