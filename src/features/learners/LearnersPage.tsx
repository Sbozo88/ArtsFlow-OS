/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Learner, Group } from '../../types';
import { learnerService } from '../../services/learnerService';
import { groupService } from '../../services/groupService';
import { enrolmentService } from '../../services/enrolmentService';
import { useAuth } from '../../contexts/AuthContext';

export function LearnersPage() {
  const { organizationId, user } = useAuth();
  const [learners, setLearners] = useState<Learner[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [enrollingLearner, setEnrollingLearner] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(true);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [school, setSchool] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [learnersData, groupsData] = await Promise.all([
        learnerService.getLearners(organizationId!),
        groupService.getGroups(organizationId!)
      ]);
      setLearners(learnersData);
      setGroups(groupsData);
    } catch (error) {
      console.error('Failed to load learners data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      loadData();
    }
  }, [organizationId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !organizationId || !user) return;

    try {
      await learnerService.createLearner(organizationId, user.uid, {
        firstName,
        lastName,
        dob,
        school,
      });
      setIsCreating(false);
      setFirstName('');
      setLastName('');
      setDob('');
      setSchool('');
      loadData();
    } catch (error) {
      console.error('Failed to create learner', error);
    }
  };

  const handleEnrol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollingLearner || !selectedGroup || !organizationId || !user) return;

    try {
      const group = groups.find(g => g.id === selectedGroup);
      if (!group) return;

      await enrolmentService.enrolLearner(
        organizationId,
        user.uid,
        enrollingLearner,
        selectedGroup,
        group.programmeId
      );
      setEnrollingLearner(null);
      setSelectedGroup('');
      alert('Enrolment successful!');
    } catch (error: unknown) {
      console.error('Failed to enrol learner', error);
      alert((error as Error).message || 'Failed to enrol learner');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Learners</h1>
        <Button onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'Cancel' : 'Add Learner'}
        </Button>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">New Learner</h2>
          <form onSubmit={handleCreate} className="space-y-4 max-w-md">
            <Input 
              label="First Name" 
              value={firstName} 
              onChange={e => setFirstName(e.target.value)} 
              required 
            />
            <Input 
              label="Last Name" 
              value={lastName} 
              onChange={e => setLastName(e.target.value)} 
              required 
            />
            <Input 
              label="Date of Birth" 
              type="date" 
              value={dob} 
              onChange={e => setDob(e.target.value)} 
            />
            <Input 
              label="School" 
              value={school} 
              onChange={e => setSchool(e.target.value)} 
            />
            <div className="pt-2">
              <Button type="submit">Save Learner</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <Input placeholder="Search learners..." className="max-w-sm" />
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading learners...</div>
        ) : learners.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No learners found. Click "Add Learner" to create one.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Date of Birth</th>
                <th className="px-6 py-3 font-medium">School</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {learners.map(learner => (
                <tr key={learner.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/learners/${learner.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                      {learner.firstName} {learner.lastName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {learner.dob || '-'}
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {learner.school || '-'}
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 mr-2">
                      Active
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setEnrollingLearner(enrollingLearner === learner.id ? null : learner.id)}
                    >
                      Enrol
                    </Button>
                    
                    {enrollingLearner === learner.id && (
                      <div className="mt-2 p-3 bg-slate-100 rounded-md">
                        <form onSubmit={handleEnrol} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="text-xs font-medium text-slate-700 block mb-1">Select Group</label>
                            <select
                              value={selectedGroup}
                              onChange={e => setSelectedGroup(e.target.value)}
                              className="w-full h-8 text-sm rounded border-slate-300 px-2 bg-white"
                              required
                            >
                              <option value="">Choose...</option>
                              {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                              ))}
                            </select>
                          </div>
                          <Button type="submit" size="sm">Save</Button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
