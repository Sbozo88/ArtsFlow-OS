import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Users, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useGuardianPortal } from '../../../hooks/useGuardianPortal';
import { guardianPortalService } from '../../../services/guardianPortalService';
import type { GuardianProfileDto } from '../../../types';

export const GuardianProfilePage: React.FC = () => {
  const { authUser, organisationId } = useAuth();
  const { refresh: refreshPortalContext, context } = useGuardianPortal();

  const [profile, setProfile] = useState<GuardianProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [commPreference, setCommPreference] = useState('email');

  useEffect(() => {
    if (!authUser || !organisationId) return;
    guardianPortalService.getProfile(organisationId, authUser.uid)
      .then(p => {
        setProfile(p);
        setMobileNumber(p.mobileNumber || '');
        setAddress(p.address || '');
        setCommPreference(p.communicationPreference || 'email');
      })
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [authUser, organisationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !organisationId) return;

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await guardianPortalService.updateProfile(organisationId, authUser.uid, {
        mobileNumber,
        address,
        communicationPreference: commPreference
      });

      if (res.updatedDirectly) {
        setSuccessMsg('Your profile contact details have been successfully updated!');
      } else {
        setSuccessMsg('Your profile change request has been submitted for staff verification.');
      }

      await refreshPortalContext();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Account & Identity
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-1">Guardian Profile & Contact</h1>
        <p className="text-sm text-slate-500">
          Manage your verified contact details, notification preferences, and view linked children.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-800 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Contact Form */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <User className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Personal & Contact Information</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  disabled
                  value={profile?.firstName || ''}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  disabled
                  value={profile?.lastName || ''}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={profile?.email || ''}
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed pl-9"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Email is tied to your secure authentication login.</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile / Phone Number *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={e => setMobileNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none pl-9"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Home / Residential Address
                </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none pl-9"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Preferred Communication Channel
                </label>
                <select
                  value={commPreference}
                  onChange={e => setCommPreference(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={saving || !context?.portalSettings.allowContactUpdates}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Update Contact Info'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Linked Learners & Legal Relationship */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Users className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Linked Learners</h2>
            </div>

            <div className="space-y-3">
              {profile?.linkedLearners.map(learner => (
                <div key={learner.learnerId} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                  <div className="font-bold text-slate-900 text-sm">{learner.learnerName}</div>
                  <div className="text-slate-500 capitalize">Relationship: {learner.relationshipType}</div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {learner.financialContact && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Financial Contact
                      </span>
                    )}
                    {learner.emergencyContact && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        Emergency Contact
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-500 leading-relaxed">
              Relationship types and financial designations are verified by organisation staff. If you need to update custody or contact roles, please contact administration.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
