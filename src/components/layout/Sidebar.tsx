import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  ClipboardList,
  LogOut,
  Music,
  Activity
, CalendarDays } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  {
    name: 'People',
    icon: Users,
    children: [
      { name: 'Learners', path: '/learners' },
      { name: 'Guardians', path: '/guardians' },
      { name: 'Staff', path: '/staff' },
    ]
  },
  {
    name: 'Programmes',
    icon: GraduationCap,
    children: [
      { name: 'All Programmes', path: '/programmes' },
      { name: 'Groups & Classes', path: '/groups' },
      { name: 'Enrolments', path: '/enrolments' },
    ]
  },
  {
    name: 'Teaching',
    icon: CalendarCheck,
    children: [
      { name: 'Sessions', path: '/sessions' },
      { name: 'Attendance', path: '/attendance' },
    ]
  },
  {
    name: 'Music',
    icon: Music,
    children: [
      { name: 'Overview', path: '/music' },
      { name: 'Instruments', path: '/music/instruments' },
      { name: 'Ensembles', path: '/music/ensembles' },
      { name: 'Repertoire', path: '/music/repertoire' },
      { name: 'Practice Logs', path: '/music/practice' },
      { name: 'Assessments', path: '/music/assessments' },
    ]
  },
  {
    name: 'Dance',
    icon: Activity,
    children: [
      { name: 'Overview', path: '/dance' },
      { name: 'Levels', path: '/dance/levels' },
      { name: 'Classes', path: '/dance/classes' },
      { name: 'Choreography', path: '/dance/choreography' },
      { name: 'Costumes', path: '/dance/costumes' },
      { name: 'Practice', path: '/dance/practice' },
      { name: 'Assessments', path: '/dance/assessments' },
    ]
  },
  {
    name: 'Events',
    icon: CalendarDays,
    children: [
      { name: 'Overview', path: '/events' },
      { name: 'Calendar / List', path: '/events/calendar' },
      { name: 'Participants', path: '/events/participants' },
      { name: 'Reports', path: '/events/reports' },
    ]
  },
  { name: 'Follow-Ups', path: '/follow-ups', icon: ClipboardList },
];

export function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Music className="w-6 h-6 text-indigo-400" />
          ArtsFlow OS
        </h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => (
          <div key={item.name}>
            {item.path ? (
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                    isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ) : (
              <div className="mt-4">
                <div className="flex items-center gap-3 px-3 py-2 text-slate-400 uppercase text-xs font-semibold tracking-wider">
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </div>
                <div className="ml-8 space-y-1 mt-1">
                  {item.children?.map((child) => (
                    <NavLink
                      key={child.name}
                      to={child.path}
                      className={({ isActive }) =>
                        cn(
                          'block px-3 py-2 rounded-md text-sm transition-colors',
                          isActive ? 'bg-slate-800 text-white font-medium' : 'hover:bg-slate-800 hover:text-white'
                        )
                      }
                    >
                      {child.name}
                    </NavLink>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md transition-colors text-slate-300 hover:text-white hover:bg-slate-800"
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </button>
      </div>
      <div className="p-4 border-t border-slate-800 text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} ArtsFlow OS</p>
      </div>
    </aside>
  );
}
