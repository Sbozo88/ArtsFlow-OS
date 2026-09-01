/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { learnerService } from '../../services/learnerService';
import { guardianService } from '../../services/guardianService';
import { learnerGuardianService } from '../../services/learnerGuardianService';
import type { Learner, Guardian, LearnerGuardian } from '../../types';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, UserPlus } from 'lucide-react';

export function LearnerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { organizationId, user } = useAuth();
  
  const [learner, setLearner] = useState<Learner | null>(null);
  const [allGuardians, setAllGuardians] = useState<Guardian[]>([]);
  const [linkedGuardians, setLinkedGuardians] = useState<{link: LearnerGuardian, guardian: Guardian}[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isLinking, setIsLinking] = useState(false);
  const [selectedGuardianId, setSelectedGuardianId] = useState('');
  const [relationshipType, setRelationshipType] = useState('Parent');

  const loadData = async () => {
    if (!organizationId || !id) return;
    setLoading(true);
    try {
      const [learnerData, guardiansData, linksData] = await Promise.all([
        learnerService.getLearner(id),
        guardianService.getGuardians(organizationId),
        learnerGuardianService.getGuardiansForLearner(organizationId, id)
      ]);
      
      setLearner(learnerData);
      setAllGuardians(guardiansData);
      
      // Resolve linked guardians
      const resolvedLinks = linksData.map((link: LearnerGuardian) => {
        const guardian = guardiansData.find((g: Guardian) => g.id === link.guardianId);
        return guardian ? { link, guardian } : null;
      }).filter(Boolean) as {link: LearnerGuardian, guardian: Guardian}[];
      
      setLinkedGuardians(resolvedLinks);
    } catch (error) {
      console.error("Failed to load learner profile", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organizationId, id]);

  const handleLinkGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !user || !id || !selectedGuardianId) return;

    try {
      await learnerGuardianService.linkGuardian(organizationId, user.uid, {
        learnerId: id,
        guardianId: selectedGuardianId,
        relationshipType,
        isPrimaryContact: linkedGuardians.length === 0, // make primary if first
        isEmergencyContact: true,
        receivesCommunication: true,
        isFinancialContact: false
      });
      setIsLinking(false);
      setSelectedGuardianId('');
      loadData();
    } catch (error) {
      console.error("Failed to link guardian", error);
    }
  };

  if (loading) return <div className="p-8">Loading profile...</div>;
  if (!learner) return <div className="p-8">Learner not found.</div>;

  const availableGuardiansToLink = allGuardians.filter(
    ag => !linkedGuardians.some(lg => lg.guardian.id === ag.id)
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link to="/learners" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Learners
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">{learner.firstName} {learner.lastName}</h1>
          <p className="text-slate-500 mt-1">Learner Profile</p>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="block text-slate-500 mb-1">Date of Birth</span>
            <span className="font-medium text-slate-900">{learner.dob || 'Not provided'}</span>
          </div>
          <div>
            <span className="block text-slate-500 mb-1">School</span>
            <span className="font-medium text-slate-900">{learner.school || 'Not provided'}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-900">Linked Guardians</h2>
        <Button onClick={() => setIsLinking(true)} variant="outline" className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Link Guardian
        </Button>
      </div>

      {isLinking && (
        <div className="mb-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Select an existing Guardian to link</h3>
          <form onSubmit={handleLinkGuardian} className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Guardian</label>
              <select 
                className="w-full h-10 px-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedGuardianId}
                onChange={e => setSelectedGuardianId(e.target.value)}
                required
              >
                <option value="">Select Guardian...</option>
                {availableGuardiansToLink.map(g => (
                  <option key={g.id} value={g.id}>{g.firstName} {g.lastName} ({g.email})</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
              <select 
                className="w-full h-10 px-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={relationshipType}
                onChange={e => setRelationshipType(e.target.value)}
              >
                <option value="Parent">Parent</option>
                <option value="Mother">Mother</option>
                <option value="Father">Father</option>
                <option value="Grandparent">Grandparent</option>
                <option value="Legal Guardian">Legal Guardian</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsLinking(false)}>Cancel</Button>
              <Button type="submit">Link</Button>
            </div>
          </form>
          {availableGuardiansToLink.length === 0 && (
            <p className="text-sm text-amber-600 mt-2">All available guardians are already linked, or no guardians exist yet.</p>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Guardian</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Relationship</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {linkedGuardians.map(({link, guardian}) => (
              <tr key={link.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900">{guardian.firstName} {guardian.lastName}</div>
                  {link.isPrimaryContact && (
                    <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Primary Contact
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-500">{link.relationshipType}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-500">{guardian.email}</div>
                  <div className="text-sm text-slate-500">{guardian.mobileNumber}</div>
                </td>
              </tr>
            ))}
            {linkedGuardians.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                  No guardians linked yet. Create a guardian first, then link them here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
