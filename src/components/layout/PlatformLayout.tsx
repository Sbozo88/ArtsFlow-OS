import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Activity,
  ShieldCheck,
  Settings,
  Menu,
  X,
  School,
  LogOut,
  Sparkles,
  Layers,
  CreditCard,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

export const PlatformLayout: React.FC = () => {
  const { authUser, organisationId, memberships, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/platform', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/platform/organisations', label: 'Organisations', icon: Building2 },
    { to: '/platform/feedback', label: 'Pilot Feedback', icon: MessageSquare },
    { to: '/platform/plans', label: 'Plans & Pricing', icon: Layers },
    { to: '/platform/subscriptions', label: 'Subscriptions', icon: CreditCard },
    { to: '/platform/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/platform/features', label: 'Platform Features', icon: Sparkles },
    { to: '/platform/users', label: 'Platform Users', icon: Users },
    { to: '/platform/health', label: 'System Health', icon: Activity },
    { to: '/platform/audit', label: 'Global Audit Log', icon: ShieldCheck },
    { to: '/platform/settings', label: 'Platform Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Platform Top Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-950 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/platform" className="flex items-center gap-2 font-bold text-lg text-white">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>ArtsFlow Platform</span>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            Super Admin
          </span>
        </div>

        <div className="flex items-center gap-3">
          {(organisationId || (memberships && memberships.length > 0)) && (
            <Link
              to={organisationId ? "/dashboard" : "/select-organisation"}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
              title="Open Organisation Workspace"
            >
              <School className="w-3.5 h-3.5 text-indigo-400" />
              <span>Organisation Workspace</span>
            </Link>
          )}

          <div className="text-right hidden sm:block">
            <div className="text-xs font-medium text-white">{authUser?.displayName || authUser?.email}</div>
            <div className="text-[10px] text-slate-400 font-mono">Platform Scope</div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Platform Desktop & Mobile Sidebar */}
        <aside
          className={cn(
            'fixed md:static inset-y-0 left-0 z-20 w-64 bg-slate-950 border-r border-slate-800 flex flex-col transform transition-transform duration-200 md:translate-x-0 pt-16 md:pt-0',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="p-4 flex-1 space-y-1">
            <div className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
              Platform Administration
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    )
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-800/80 text-xs text-slate-300">
            <div>ArtsFlow OS v1.1</div>
            <div className="text-[10px] text-slate-400">SaaS Super Admin Console</div>
          </div>
        </aside>

        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-10 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Platform Main Content */}
        <main className="flex-1 bg-slate-900 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
