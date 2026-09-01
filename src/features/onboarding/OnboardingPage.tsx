import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { organisationService } from '../../services/organisationService';
import { staffService } from '../../services/staffService';
import { Building2 } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { user, refreshAuth } = useAuth();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('School Arts Programme');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orgTypes = [
    'School Arts Programme',
    'Community Arts Project',
    'Music School',
    'Dance School',
    'Arts Organisation',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      const orgId = `org_${Date.now()}`;
      
      // 1. Create Organisation
      await organisationService.createOrganisation(orgId, user.uid, {
        name: orgName,
        organisationType: orgType
      });

      // 2. Create Staff Profile
      await staffService.createStaff(orgId, user.uid, {
        firstName: user.displayName?.split(' ')[0] || 'Admin',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || 'User',
        email: user.email || '',
        role: 'Administrator'
      });

      // 3. Create Auth User Profile
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        organisationId: orgId,
        role: 'organisation_admin'
      });

      // 4. Refresh Auth Context
      await refreshAuth();
      navigate('/');
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
          <Building2 className="h-6 w-6 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your Organisation
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome to ArtsFlow OS! Let's get your organisation set up.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="orgName" className="block text-sm font-medium text-gray-700">
                Organisation Name
              </label>
              <div className="mt-1">
                <input
                  id="orgName"
                  name="orgName"
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="orgType" className="block text-sm font-medium text-gray-700">
                Organisation Type
              </label>
              <div className="mt-1">
                <select
                  id="orgType"
                  name="orgType"
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  {orgTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Setting up...' : 'Create Organisation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
