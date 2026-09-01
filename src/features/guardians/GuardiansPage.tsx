/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Guardian } from '../../types';
import { guardianService } from '../../services/guardianService';
import { useAuth } from '../../contexts/AuthContext';

export function GuardiansPage() {
  const { organizationId, user } = useAuth();
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [communicationPreference, setCommunicationPreference] = useState<'email' | 'sms' | 'whatsapp' | 'any'>('email');

  const loadGuardians = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const data = await guardianService.getGuardians(organizationId);
      setGuardians(data);
    } catch (error) {
      console.error('Failed to load guardians', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuardians();
  }, [organizationId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !mobileNumber || !organizationId || !user) return;

    try {
      await guardianService.createGuardian(organizationId, user.uid, {
        firstName,
        lastName,
        email,
        mobileNumber,
        communicationPreference,
      });
      setIsCreating(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setMobileNumber('');
      loadGuardians();
    } catch (error) {
      console.error('Failed to create guardian', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Guardians</h1>
        <Button onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'Cancel' : 'Add Guardian'}
        </Button>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">New Guardian</h2>
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
              label="Email" 
              type="email"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required
            />
            <Input 
              label="Mobile Number" 
              type="tel"
              value={mobileNumber} 
              onChange={e => setMobileNumber(e.target.value)} 
              required
            />
            
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-slate-700">Communication Preference</label>
              <select
                value={communicationPreference}
                onChange={(e) => setCommunicationPreference(e.target.value as 'email' | 'sms' | 'whatsapp' | 'any')}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="any">Any</option>
              </select>
            </div>

            <div className="pt-2">
              <Button type="submit">Save Guardian</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <Input placeholder="Search guardians..." className="max-w-sm" />
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading guardians...</div>
        ) : guardians.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No guardians found. Click "Add Guardian" to create one.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Mobile</th>
                <th className="px-6 py-3 font-medium">Pref.</th>
              </tr>
            </thead>
            <tbody>
              {guardians.map(guardian => (
                <tr key={guardian.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {guardian.firstName} {guardian.lastName}
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {guardian.email}
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {guardian.mobileNumber}
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 capitalize">
                      {guardian.communicationPreference}
                    </span>
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
