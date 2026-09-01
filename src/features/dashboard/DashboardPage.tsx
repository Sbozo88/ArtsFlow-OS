import React from 'react';
import { useLearners } from '../../hooks/useLearners';
import { useGuardians } from '../../hooks/useGuardians';
import { useStaff } from '../../hooks/useStaff';
import { useProgrammes } from '../../hooks/useProgrammes';
import { useProgrammeGroups } from '../../hooks/useProgrammeGroups';
import { 
  Users, 
  UserSquare2, 
  Briefcase, 
  Music, 
  Activity,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { learners, loading: loadingLearners } = useLearners();
  const { guardians, loading: loadingGuardians } = useGuardians();
  const { staff, loading: loadingStaff } = useStaff();
  const { programmes, loading: loadingProgrammes } = useProgrammes();
  const { groups, loading: loadingGroups } = useProgrammeGroups();

  const loading = loadingLearners || loadingGuardians || loadingStaff || loadingProgrammes || loadingGroups;

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading Dashboard...</div>;
  }

  const musicProgrammes = programmes.filter(p => p.programmeType === 'Music');
  const danceProgrammes = programmes.filter(p => p.programmeType === 'Dance');
  
  const recentLearners = [...learners].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const recentProgrammes = [...programmes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/learners" className="btn btn-primary text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Learner
          </Link>
          <Link to="/programmes" className="btn btn-secondary text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Programme
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Active Learners" value={learners.length} icon={<Users className="w-6 h-6 text-blue-500" />} />
        <StatCard title="Guardians" value={guardians.length} icon={<UserSquare2 className="w-6 h-6 text-green-500" />} />
        <StatCard title="Staff Members" value={staff.length} icon={<Briefcase className="w-6 h-6 text-purple-500" />} />
        <StatCard title="Music Programmes" value={musicProgrammes.length} icon={<Music className="w-6 h-6 text-amber-500" />} />
        <StatCard title="Dance Programmes" value={danceProgrammes.length} icon={<Activity className="w-6 h-6 text-rose-500" />} />
        <StatCard title="Active Groups / Classes" value={groups.length} icon={<Users className="w-6 h-6 text-indigo-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-medium text-slate-800 mb-4">Recently Added Learners</h3>
          {recentLearners.length === 0 ? (
            <p className="text-slate-500 text-sm">No learners added yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentLearners.map(l => (
                <li key={l.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                  <span className="font-medium">{l.firstName} {l.lastName}</span>
                  <span className="text-slate-500">{new Date(l.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-medium text-slate-800 mb-4">Recently Created Programmes</h3>
          {recentProgrammes.length === 0 ? (
            <p className="text-slate-500 text-sm">No programmes created yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentProgrammes.map(p => (
                <li key={p.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-slate-500">{p.programmeType}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }: { title: string, value: number | string, icon: React.ReactNode }) => (
  <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 flex items-center gap-4">
    <div className="p-3 rounded-full bg-slate-50">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);
