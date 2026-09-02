import React, { useState, useEffect, useCallback } from 'react';
import { useGuardians } from '../../hooks/useGuardians';
import { useAuth } from '../../contexts/AuthContext';
import { guardianService } from '../../services/guardianService';
import { guardianInvitationService } from '../../services/guardianInvitationService';
import { guardianPortalAccessRepository } from '../../repositories/guardianPortalAccessRepository';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Shield, 
  Mail, 
  Copy, 
  Check, 
  X, 
  Lock, 
  RotateCcw, 
  Ban 
} from 'lucide-react';
import type { GuardianPortalAccessStatus } from '../../types';

interface GuardianPortalMap {
  [guardianId: string]: {
    status: GuardianPortalAccessStatus | 'none';
    invitedAt?: string;
    acceptedAt?: string;
  };
}

export const GuardiansPage: React.FC = () => {
  const { guardians, loading, error } = useGuardians();
  const { authUser, organisationId } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Portal Access Map
  const [portalMap, setPortalMap] = useState<GuardianPortalMap>({});
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedGuardianForInvite, setSelectedGuardianForInvite] = useState<{ id: string; name: string; email: string } | null>(null);
  const [invitationLink, setInvitationLink] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [portalRefreshKey, setPortalRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const loadStatuses = async () => {
      try {
        const allAccess = await guardianPortalAccessRepository.getByOrganisation(organisationId);
        const map: GuardianPortalMap = {};
        for (const a of allAccess) {
          map[a.guardianId] = {
            status: a.accessStatus,
            invitedAt: a.invitedAt,
            acceptedAt: a.acceptedAt
          };
        }
        if (mounted) setPortalMap(map);
      } catch {
        // ignore
      }
    };

    loadStatuses();
    return () => { mounted = false; };
  }, [organisationId, portalRefreshKey]);

  const fetchPortalStatuses = useCallback(async () => {
    setPortalRefreshKey(k => k + 1);
  }, []);

  const filteredGuardians = guardians.filter(g => 
    g.status === statusFilter &&
    (g.firstName.toLowerCase().includes(search.toLowerCase()) || 
     g.lastName.toLowerCase().includes(search.toLowerCase()) ||
     (g.email && g.email.toLowerCase().includes(search.toLowerCase())))
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !authUser) return;
    setFormLoading(true);
    try {
      await guardianService.createGuardian(organisationId, authUser.uid, {
        firstName,
        lastName,
        mobileNumber,
        email
      });
      setIsModalOpen(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to create guardian');
    } finally {
      setFormLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!organisationId || !authUser) return;
    if (confirm('Are you sure you want to archive this guardian?')) {
      try {
        await guardianService.archiveGuardian(organisationId, authUser.uid, id);
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert('Failed to archive guardian');
      }
    }
  };

  const handleInviteToPortal = async (guardianId: string, name: string, guardianEmail: string) => {
    if (!organisationId || !authUser) return;
    if (!guardianEmail) {
      alert('Guardian must have an email address recorded to receive a portal invitation.');
      return;
    }

    setInviteLoading(true);
    setSelectedGuardianForInvite({ id: guardianId, name, email: guardianEmail });
    setInviteModalOpen(true);
    setCopied(false);

    try {
      const res = await guardianInvitationService.inviteGuardian(organisationId, guardianId, authUser.uid);
      setInvitationLink(res.invitationLink);
      await fetchPortalStatuses();
    } catch (err) {
      alert((err as Error).message);
      setInviteModalOpen(false);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevokePortal = async (guardianId: string) => {
    if (!organisationId || !authUser) return;
    if (!confirm('Are you sure you want to revoke portal access for this guardian? They will immediately be locked out.')) return;

    try {
      await guardianInvitationService.revokePortalAccess(organisationId, guardianId, authUser.uid, 'Revoked by staff');
      await fetchPortalStatuses();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleDisablePortal = async (guardianId: string) => {
    if (!organisationId || !authUser) return;
    try {
      await guardianInvitationService.disablePortalAccess(organisationId, guardianId, authUser.uid);
      await fetchPortalStatuses();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleRestorePortal = async (guardianId: string) => {
    if (!organisationId || !authUser) return;
    try {
      await guardianInvitationService.restorePortalAccess(organisationId, guardianId, authUser.uid);
      await fetchPortalStatuses();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invitationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) return <div className="p-8">Loading guardians...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Guardians</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage parents, family contacts, and secure Portal access.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Guardian
        </button>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search guardians by name or email..." 
            className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-md text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select 
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-slate-300 rounded-md px-4 py-2 text-sm"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {filteredGuardians.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200 text-slate-500">
          No guardians found.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold text-slate-600">Name</th>
                <th className="p-4 font-semibold text-slate-600">Contact Details</th>
                <th className="p-4 font-semibold text-slate-600">Record Status</th>
                <th className="p-4 font-semibold text-slate-600">Portal Access</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGuardians.map(g => {
                const portal = portalMap[g.id]?.status || 'none';
                return (
                  <tr key={g.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">
                      {g.firstName} {g.lastName}
                    </td>
                    <td className="p-4 text-slate-600">
                      <div>{g.mobileNumber}</div>
                      <div className="text-slate-400">{g.email || 'No email recorded'}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[11px] font-medium capitalize">
                        {g.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          portal === 'active'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : portal === 'invited'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : portal === 'disabled'
                            ? 'bg-slate-100 text-slate-600'
                            : portal === 'revoked'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-50 text-slate-400 border border-slate-200'
                        }`}>
                          {portal === 'none' ? 'Not Invited' : portal}
                        </span>

                        {portal === 'none' && g.email && (
                          <button
                            type="button"
                            onClick={() => handleInviteToPortal(g.id, `${g.firstName} ${g.lastName}`, g.email || '')}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[10px] transition-colors"
                          >
                            Invite
                          </button>
                        )}
                        {portal === 'invited' && g.email && (
                          <button
                            type="button"
                            onClick={() => handleInviteToPortal(g.id, `${g.firstName} ${g.lastName}`, g.email || '')}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-bold text-[10px] transition-colors"
                          >
                            Re-invite
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        {portal === 'active' && (
                          <button
                            type="button"
                            title="Disable Portal Access"
                            onClick={() => handleDisablePortal(g.id)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 rounded"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {portal === 'disabled' && (
                          <button
                            type="button"
                            title="Restore Portal Access"
                            onClick={() => handleRestorePortal(g.id)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 rounded"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(portal === 'active' || portal === 'invited' || portal === 'disabled') && (
                          <button
                            type="button"
                            title="Revoke Portal Access"
                            onClick={() => handleRevokePortal(g.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button className="text-slate-400 hover:text-indigo-600 p-1.5"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleArchive(g.id)} className="text-slate-400 hover:text-red-600 p-1.5"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Guardian Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add Guardian</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">First Name *</label>
                <input required type="text" className="w-full border border-gray-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Last Name *</label>
                <input required type="text" className="w-full border border-gray-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Mobile Number *</label>
                <input required type="tel" className="w-full border border-gray-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email</label>
                <input type="email" className="w-full border border-gray-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50">
                  {formLoading ? 'Saving...' : 'Save Guardian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite to Portal Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Guardian Portal Invitation</h3>
                  <p className="text-xs text-slate-500">For {selectedGuardianForInvite?.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteLoading ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Generating secure invitation token...
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Invitation generated for <strong>{selectedGuardianForInvite?.email}</strong>. Valid for 7 days.</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Secure Single-Use Activation Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={invitationLink}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700 select-all"
                    />
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                        copied ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Share this link with the guardian via email, SMS, or WhatsApp. When they click the link, they will verify their identity and set up portal sign-in.
                </p>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
