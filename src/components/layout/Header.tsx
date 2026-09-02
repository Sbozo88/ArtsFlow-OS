import { useState, useRef, useEffect } from 'react';
import { Bell, Search, Check, ExternalLink, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';
import type { AlertSeverity } from '../../types';

export function Header() {
  const { user, authUser } = useAuth();
  const navigate = useNavigate();
  const { unreadCount, recentUnread, markAsRead, markAllAsRead } = useUnreadNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = authUser?.role 
    ? `${authUser.role.charAt(0).toUpperCase() + authUser.role.slice(1)} User`
    : user?.email?.split('@')[0] || 'Staff Member';

  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AF';

  const getSeverityIcon = (sev: AlertSeverity) => {
    switch (sev) {
      case 'critical':
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'attention':
        return <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-sky-500 shrink-0" />;
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search learners, groups, rules..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-md text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Notifications Popover */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors relative"
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[1.25rem] h-5 px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden text-slate-800 animate-in fade-in duration-150">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {recentUnread.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">
                    No unread notifications
                  </div>
                ) : (
                  recentUnread.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markAsRead(notif.id);
                        if (notif.actionUrl) {
                          setDropdownOpen(false);
                          navigate(notif.actionUrl);
                        }
                      }}
                      className="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 text-left"
                    >
                      <div className="mt-0.5">{getSeverityIcon(notif.severity)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{notif.title}</p>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{notif.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setDropdownOpen(false)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1.5"
                >
                  View all in Notifications Centre
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
          <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs">
            {initials}
          </div>
          <div className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
            {displayName}
          </div>
        </div>
      </div>
    </header>
  );
}
