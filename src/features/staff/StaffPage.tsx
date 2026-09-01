/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { User, UserRole } from '../../types';
import { staffService } from '../../services/staffService';
import { useAuth } from '../../contexts/AuthContext';

export function StaffPage() {
  const { organizationId, user } = useAuth();
  const [staffList, setStaffList] = useState<User[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Teacher');

  const loadStaff = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const data = await staffService.getStaff(organizationId);
      setStaffList(data);
    } catch (error) {
      console.error('Failed to load staff', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [organizationId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !organizationId || !user) return;

    // A real app would send an invite email via Cloud Functions that creates their Auth record.
    // Here we simulate creation of a staff profile.
    try {
      const mockNewUserId = 'user_' + Date.now().toString();
      await staffService.createUser(organizationId, mockNewUserId, {
        firstName,
        lastName,
        email,
        role,
      });
      setIsCreating(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setRole('Teacher');
      loadStaff();
    } catch (error) {
      console.error('Failed to create staff member', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading staff...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
          <p className="text-slate-500 mt-1">Manage users, teachers, and admins</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>Add Staff Member</Button>
      </div>

      {isCreating && (
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-4">Add New Staff Member</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              <Input label="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select 
                  className="w-full h-10 px-3 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                >
                  <option value="Teacher">Teacher</option>
                  <option value="Programme Director">Programme Director</option>
                  <option value="Organisation Admin">Organisation Admin</option>
                  <option value="Finance">Finance</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button type="submit">Add Staff</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {staffList.map((staffMember) => (
              <tr key={staffMember.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900">{staffMember.firstName} {staffMember.lastName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-500">{staffMember.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {staffMember.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    staffMember.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {staffMember.status}
                  </span>
                </td>
              </tr>
            ))}
            {staffList.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  No staff members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
