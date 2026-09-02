import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  CheckSquare, 
  Calendar, 
  FileCheck2, 
  Bus, 
  CreditCard, 
  FolderLock, 
  MessageSquare, 
  User, 
  LogOut, 
  Menu, 
  X,
  Building2
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useGuardianPortal } from '../../../hooks/useGuardianPortal';
import { useOrganisationSettings } from '../../../hooks/useOrganisationSettings';
import { LearnerSwitcher } from './LearnerSwitcher';

export const GuardianPortalLayout: React.FC = () => {
  const { context } = useGuardianPortal();
  const { logout } = useAuth();
  const { settings } = useOrganisationSettings();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const orgName = settings?.branding?.organisationDisplayName || settings?.profile?.name || 'ArtsFlow Portal';
  const logoUrl = settings?.branding?.logoUrl;
  const primaryColor = settings?.branding?.primaryBrandColour || '#4f46e5';

  const portalSettings = context?.portalSettings;

  const handleLogout = async () => {
    await logout();
    navigate('/portal/login');
  };

  const navItems = [
    { to: '/portal', label: 'Home', icon: Home, end: true },
    { to: '/portal/learners', label: 'My Learners', icon: Users },
    ...(portalSettings?.showAttendance ? [{ to: '/portal/attendance', label: 'Attendance', icon: CheckSquare }] : []),
    ...(portalSettings?.showEvents ? [{ to: '/portal/events', label: 'Events', icon: Calendar }] : []),
    { to: '/portal/consent', label: 'Consent', icon: FileCheck2 },
    ...(portalSettings?.showTransport ? [{ to: '/portal/transport', label: 'Transport', icon: Bus }] : []),
    ...(portalSettings?.showFinance ? [{ to: '/portal/finance', label: 'Finance', icon: CreditCard }] : []),
    ...(portalSettings?.showDocuments ? [{ to: '/portal/documents', label: 'Documents', icon: FolderLock }] : []),
    { to: '/portal/messages', label: 'Messages', icon: MessageSquare },
    { to: '/portal/profile', label: 'Profile', icon: User }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-0">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <NavLink to="/portal" className="flex items-center gap-2.5">
                {logoUrl ? (
                  <img src={logoUrl} alt={orgName} className="h-9 w-auto max-w-[140px] object-contain" />
                ) : (
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>
                )}
                <div className="hidden sm:block">
                  <div className="text-sm font-black text-slate-900 leading-tight truncate max-w-[200px]">
                    {orgName}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    Guardian Portal
                  </div>
                </div>
              </NavLink>
            </div>

            {/* Middle: Learner Switcher */}
            <div className="flex items-center gap-2">
              <LearnerSwitcher />
            </div>

            {/* Right: Desktop Profile + Mobile Hamburger */}
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-3 pl-2 border-l border-slate-200">
                <NavLink
                  to="/portal/profile"
                  className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-indigo-600 p-1.5 rounded-lg transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="hidden lg:inline">{context?.guardian.firstName}</span>
                </NavLink>

                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(prev => !prev)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Secondary Horizontal Navigation */}
        <nav className="hidden md:block bg-slate-50/70 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/80'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer Navigation (When Hamburger Clicked) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl p-6 flex flex-col justify-between z-50">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="text-sm font-black text-slate-900">{orgName}</div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-3 border-b border-slate-100">
                <div className="text-xs text-slate-400 font-medium">Signed in as</div>
                <div className="text-sm font-bold text-slate-800 truncate">
                  {context?.guardian.firstName} {context?.guardian.lastName}
                </div>
                <div className="text-[11px] text-slate-500 truncate">{context?.guardian.email}</div>
              </div>

              <div className="space-y-1 mt-4">
                {navItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Mobile Sticky Bottom Navigation Bar (Phone-First UX) */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30 md:hidden py-1.5 px-3">
        <div className="flex items-center justify-around">
          <NavLink
            to="/portal"
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-colors ${
                isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/portal/learners"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-colors ${
                isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            <Users className="w-5 h-5" />
            <span>Learners</span>
          </NavLink>

          <NavLink
            to="/portal/consent"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-colors ${
                isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            <FileCheck2 className="w-5 h-5" />
            <span>Consent</span>
          </NavLink>

          {portalSettings?.showEvents && (
            <NavLink
              to="/portal/events"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              <Calendar className="w-5 h-5" />
              <span>Events</span>
            </NavLink>
          )}

          {portalSettings?.showFinance && (
            <NavLink
              to="/portal/finance"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              <CreditCard className="w-5 h-5" />
              <span>Finance</span>
            </NavLink>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-900"
          >
            <Menu className="w-5 h-5" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
