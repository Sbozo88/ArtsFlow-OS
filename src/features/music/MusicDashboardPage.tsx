
import { useInstruments } from '../../hooks/useInstruments';
import { useInstrumentAllocations } from '../../hooks/useInstrumentAllocations';
import { useRepertoire } from '../../hooks/useRepertoire';
import { useMusicAssessments } from '../../hooks/useMusicAssessments';

export const MusicDashboardPage = () => {
  const { instruments } = useInstruments();
  const { allocations } = useInstrumentAllocations();
  const { repertoire } = useRepertoire();
  const { assessments } = useMusicAssessments();

  const totalInstruments = instruments.length;
  const activeAllocations = allocations.filter(a => a.allocationStatus === 'active').length;
  const repairNeeded = instruments.filter(i => i.instrumentStatus === 'repair').length;
  const activeRepertoire = repertoire.filter(r => r.repertoireStatus === 'rehearsing' || r.repertoireStatus === 'performance_ready').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Music Operations</h1>
        <p className="text-sm text-gray-500">Overview of instruments, repertoire, and music assessments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Instruments Allocated</h3>
          <div className="mt-2 text-3xl font-semibold text-gray-900">{activeAllocations} / {totalInstruments}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Needs Repair</h3>
          <div className={`mt-2 text-3xl font-semibold ${repairNeeded > 0 ? 'text-red-600' : 'text-gray-900'}`}>{repairNeeded}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Active Repertoire</h3>
          <div className="mt-2 text-3xl font-semibold text-gray-900">{activeRepertoire}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Assessments (30d)</h3>
          <div className="mt-2 text-3xl font-semibold text-gray-900">{assessments.length}</div>
        </div>
      </div>
      
      {/* Additional sections for quick actions, recent activity etc would go here */}
    </div>
  );
};
