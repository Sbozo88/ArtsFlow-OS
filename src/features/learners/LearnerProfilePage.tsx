import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLearners } from '../../hooks/useLearners';
import { useGuardians } from '../../hooks/useGuardians';
import { useLearnerGuardians } from '../../hooks/useLearnerGuardians';
import { useLearnerEnrolments } from '../../hooks/useLearnerEnrolments';
import { useLearnerAttendance } from '../../hooks/useLearnerAttendance';
import { useProgrammes } from '../../hooks/useProgrammes';
import { useProgrammeGroups } from '../../hooks/useProgrammeGroups';
import { useSessions } from '../../hooks/useSessions';
import { useAuth } from '../../contexts/AuthContext';
import { learnerGuardianService } from '../../services/learnerGuardianService';
import { enrolmentService } from '../../services/enrolmentService';
// Enrolment types used transitively via service
import { ArrowLeft, User, Phone, Mail, MapPin, Plus, Trash2, GraduationCap, CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';

export const LearnerProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { learners, loading: loadingLearners } = useLearners();
  const { guardians, loading: loadingGuardians } = useGuardians();
  const { links, loading: loadingLinks } = useLearnerGuardians(id);
  const { enrolments, loading: loadingEnrolments } = useLearnerEnrolments(id);
  const { records: attendanceRecords, loading: loadingAttendance } = useLearnerAttendance(id);
  const { programmes } = useProgrammes();
  const { groups } = useProgrammeGroups();
  const { sessions } = useSessions();
  const { authUser, organisationId } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGuardianId, setSelectedGuardianId] = useState('');
  const [relationshipType, setRelationshipType] = useState('Mother');
  const [primaryContact, setPrimaryContact] = useState(true);
  const [emergencyContact, setEmergencyContact] = useState(true);
  const [receivesCommunication, setReceivesCommunication] = useState(true);
  const [financialContact, setFinancialContact] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Enrolment modal
  const [isEnrolModalOpen, setIsEnrolModalOpen] = useState(false);
  const [enrolProgrammeId, setEnrolProgrammeId] = useState('');
  const [enrolGroupId, setEnrolGroupId] = useState('');
  const [enrolStartDate, setEnrolStartDate] = useState(new Date().toISOString().split('T')[0]);

  const relationships = ['Mother', 'Father', 'Guardian', 'Grandparent', 'Sibling', 'Other'];

  const loading = loadingLearners || loadingGuardians || loadingLinks;
  const learner = learners.find(l => l.id === id);

  if (loading) return <div className="p-8">Loading profile...</div>;
  if (!learner) return <div className="p-8">Learner not found.</div>;

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !authUser || !id || !selectedGuardianId) return;
    
    setFormLoading(true);
    try {
      await learnerGuardianService.linkGuardian(organisationId, authUser.uid, {
        learnerId: id,
        guardianId: selectedGuardianId,
        relationshipType,
        primaryContact,
        emergencyContact,
        receivesCommunication,
        financialContact
      });
      setIsModalOpen(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      const error = err as Error;
      alert(error.message || 'Failed to link guardian');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUnlink = async (linkId: string) => {
    if (!organisationId || !authUser) return;
    if (confirm('Are you sure you want to unlink this guardian?')) {
      try {
        await learnerGuardianService.unlinkGuardian(organisationId, authUser.uid, linkId);
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert('Failed to unlink guardian');
      }
    }
  };

  const handleEnrol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !authUser || !id) return;
    setFormLoading(true);
    try {
      await enrolmentService.createEnrolment(organisationId, authUser.uid, {
        learnerId: id,
        groupId: enrolGroupId,
        startDate: enrolStartDate,
      });
      setIsEnrolModalOpen(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      const error = err as Error;
      alert(error.message || 'Failed to enrol learner');
    } finally {
      setFormLoading(false);
    }
  };

  const enrolFilteredGroups = enrolProgrammeId ? groups.filter(g => g.programmeId === enrolProgrammeId) : [];

  // Attendance stats
  const totalSessions = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(r => r.attendanceStatus === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.attendanceStatus === 'absent').length;
  const lateCount = attendanceRecords.filter(r => r.attendanceStatus === 'late').length;
  const excusedCount = attendanceRecords.filter(r => r.attendanceStatus === 'excused').length;
  const attendanceRate = totalSessions > 0 ? Math.round(((presentCount + lateCount) / totalSessions) * 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to="/learners" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Learners
      </Link>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="bg-indigo-600 px-6 py-8 sm:px-10 flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-200 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-indigo-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {learner.firstName} {learner.lastName}
            </h1>
            {learner.preferredName && (
              <p className="text-indigo-200 text-lg">"{learner.preferredName}"</p>
            )}
            <div className="mt-2 flex gap-4 text-indigo-100 text-sm">
              <span className="bg-indigo-700 px-2 py-1 rounded-full uppercase">{learner.status}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><Phone className="w-4 h-4"/> Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{learner.phone || '-'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><Mail className="w-4 h-4"/> Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{learner.email || '-'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><MapPin className="w-4 h-4"/> Address</dt>
              <dd className="mt-1 text-sm text-gray-900">{learner.address || '-'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Linked Guardians */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Linked Guardians</h3>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-secondary text-sm flex items-center gap-1">
            <Plus className="w-4 h-4"/> Link Guardian
          </button>
        </div>
        
        {links.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            No guardians linked yet.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {links.map(link => {
              const guardian = guardians.find(g => g.id === link.guardianId);
              if (!guardian) return null;
              
              return (
                <li key={link.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-indigo-600">{guardian.firstName} {guardian.lastName}</p>
                    <p className="text-xs text-gray-500">{link.relationshipType} • {guardian.mobileNumber}</p>
                    <div className="flex gap-2 mt-1">
                      {link.primaryContact && <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Primary</span>}
                      {link.emergencyContact && <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Emergency</span>}
                      {link.financialContact && <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Financial</span>}
                    </div>
                  </div>
                  <button onClick={() => handleUnlink(link.id)} className="text-gray-400 hover:text-red-600 p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Enrolments */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Enrolments</h3>
          <button onClick={() => setIsEnrolModalOpen(true)} className="btn btn-secondary text-sm flex items-center gap-1">
            <Plus className="w-4 h-4"/> Enrol
          </button>
        </div>
        {loadingEnrolments ? (
          <div className="p-4 text-slate-500 text-sm">Loading enrolments...</div>
        ) : enrolments.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No enrolments yet.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {enrolments.map(e => {
              const programme = programmes.find(p => p.id === e.programmeId);
              const group = groups.find(g => g.id === e.groupId);
              return (
                <li key={e.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{programme?.name} — {group?.name}</p>
                    <p className="text-xs text-slate-500">Since {e.startDate}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    e.enrolmentStatus === 'active' ? 'bg-green-100 text-green-700' :
                    e.enrolmentStatus === 'paused' ? 'bg-amber-100 text-amber-700' :
                    e.enrolmentStatus === 'completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>{e.enrolmentStatus}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Attendance History */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Attendance History</h3>
        </div>
        {loadingAttendance ? (
          <div className="p-4 text-slate-500 text-sm">Loading attendance...</div>
        ) : attendanceRecords.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No attendance records yet.</div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 p-4 border-b border-gray-200">
              <div className="text-center">
                <p className="text-lg font-bold text-slate-800">{totalSessions}</p>
                <p className="text-[10px] text-slate-500 uppercase">Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-700">{presentCount}</p>
                <p className="text-[10px] text-slate-500 uppercase">Present</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-red-700">{absentCount}</p>
                <p className="text-[10px] text-slate-500 uppercase">Absent</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-700">{lateCount}</p>
                <p className="text-[10px] text-slate-500 uppercase">Late</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-700">{excusedCount}</p>
                <p className="text-[10px] text-slate-500 uppercase">Excused</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-indigo-700">{attendanceRate}%</p>
                <p className="text-[10px] text-slate-500 uppercase">Rate</p>
              </div>
            </div>
            {/* Records */}
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="p-3 font-medium text-slate-600">Date</th>
                    <th className="p-3 font-medium text-slate-600">Group</th>
                    <th className="p-3 font-medium text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.sort((a, b) => {
                    const sA = sessions.find(s => s.id === a.sessionId);
                    const sB = sessions.find(s => s.id === b.sessionId);
                    return (sB?.date || '').localeCompare(sA?.date || '');
                  }).map(r => {
                    const session = sessions.find(s => s.id === r.sessionId);
                    const group = session ? groups.find(g => g.id === session.groupId) : null;
                    const statusDisplay = {
                      present: { icon: <CheckCircle2 className="w-4 h-4 text-green-600" />, cls: 'text-green-700' },
                      absent: { icon: <XCircle className="w-4 h-4 text-red-600" />, cls: 'text-red-700' },
                      late: { icon: <Clock className="w-4 h-4 text-amber-600" />, cls: 'text-amber-700' },
                      excused: { icon: <ShieldCheck className="w-4 h-4 text-blue-600" />, cls: 'text-blue-700' },
                    }[r.attendanceStatus];

                    return (
                      <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-3 text-slate-700">{session?.date || '-'}</td>
                        <td className="p-3 text-slate-600">{group?.name || '-'}</td>
                        <td className="p-3">
                          <span className={`flex items-center gap-1 ${statusDisplay?.cls}`}>
                            {statusDisplay?.icon} {r.attendanceStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Link Guardian Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Link Guardian</h2>
            <form onSubmit={handleLink} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Guardian *</label>
                <select required className="w-full border border-gray-300 rounded p-2" value={selectedGuardianId} onChange={e => setSelectedGuardianId(e.target.value)}>
                  <option value="" disabled>Select an existing guardian</option>
                  {guardians.map(g => <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>)}
                </select>
                <p className="text-xs text-slate-500 mt-1">If the guardian doesn't exist, create them in the Guardians tab first.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
                <select required className="w-full border border-gray-300 rounded p-2" value={relationshipType} onChange={e => setRelationshipType(e.target.value)}>
                  {relationships.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-200">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={primaryContact} onChange={e => setPrimaryContact(e.target.checked)} />
                  <span className="text-sm text-gray-700">Primary Contact</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={emergencyContact} onChange={e => setEmergencyContact(e.target.checked)} />
                  <span className="text-sm text-gray-700">Emergency Contact</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={receivesCommunication} onChange={e => setReceivesCommunication(e.target.checked)} />
                  <span className="text-sm text-gray-700">Receives Communication</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={financialContact} onChange={e => setFinancialContact(e.target.checked)} />
                  <span className="text-sm text-gray-700">Financial Contact</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" disabled={formLoading} className="btn btn-primary disabled:opacity-50">
                  {formLoading ? 'Linking...' : 'Link Guardian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enrol Modal */}
      {isEnrolModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Enrol in Group</h2>
            <form onSubmit={handleEnrol} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Programme *</label>
                <select required className="w-full border border-gray-300 rounded p-2" value={enrolProgrammeId} onChange={e => { setEnrolProgrammeId(e.target.value); setEnrolGroupId(''); }}>
                  <option value="" disabled>Select Programme</option>
                  {programmes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group *</label>
                <select required className="w-full border border-gray-300 rounded p-2" value={enrolGroupId} onChange={e => setEnrolGroupId(e.target.value)} disabled={!enrolProgrammeId}>
                  <option value="" disabled>{enrolProgrammeId ? 'Select Group' : 'Select programme first'}</option>
                  {enrolFilteredGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input required type="date" className="w-full border border-gray-300 rounded p-2" value={enrolStartDate} onChange={e => setEnrolStartDate(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsEnrolModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" disabled={formLoading} className="btn btn-primary disabled:opacity-50">
                  {formLoading ? 'Enrolling...' : 'Enrol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
