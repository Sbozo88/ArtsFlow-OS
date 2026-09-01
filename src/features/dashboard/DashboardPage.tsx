import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, GraduationCap, Music, UsersRound } from 'lucide-react';

interface DashboardStats {
  learners: number;
  staff: number;
  programmes: number;
  groups: number;
}

export function DashboardPage() {
  const { organizationId } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    learners: 0,
    staff: 0,
    programmes: 0,
    groups: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const createQuery = (colName: string) => query(collection(db, colName), where('organisationId', '==', organizationId));
        
        const [learnersSnap, staffSnap, progSnap, groupsSnap] = await Promise.all([
          getCountFromServer(createQuery('learners')),
          getCountFromServer(createQuery('users')),
          getCountFromServer(createQuery('programmes')),
          getCountFromServer(createQuery('groups'))
        ]);

        setStats({
          learners: learnersSnap.data().count,
          staff: staffSnap.data().count,
          programmes: progSnap.data().count,
          groups: groupsSnap.data().count
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [organizationId]);

  const statCards = [
    { name: 'Total Learners', value: stats.learners, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Active Staff', value: stats.staff, icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Programmes', value: stats.programmes, icon: Music, color: 'text-purple-600', bg: 'bg-purple-100' },
    { name: 'Groups & Classes', value: stats.groups, icon: UsersRound, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your organisation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.name}</p>
              <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
