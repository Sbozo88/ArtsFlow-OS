import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  XCircle, 
  UserX, 
  UserCheck 
} from 'lucide-react';
import { SettingsNav } from './components/SettingsNav';
import { InviteUserModal } from './components/InviteUserModal';
import { useOrganisationUsers } from '../../hooks/useOrganisationUsers';
import { useAuth } from '../../contexts/AuthContext';
import type { AuthRole } from '../../types';

export const UsersAndRolesPage: React.FC = () => {
  const { authUser } = useAuth();
  const { 
    members, 
    invitations, 
    loading, 
    inviteUser, 
    revokeInvitation, 
    changeRole, 
    disableUser, 
    restoreUser 
  } = useOrganisationUsers();

  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const handleInviteSubmit = async (input: Parameters<typeof inviteUser>[0]) => {
    await inviteUser(input);
    setActionFeedback({ type: 'success', message: `Invitation dispatched to ${input.email}.` });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleRevoke = async (id: string, email: string) => {
    if (!window.confirm(`Revoke pending invitation for ${email}?`)) return;
    try {
      await revokeInvitation(id);
      setActionFeedback({ type: 'success', message: `Invitation for ${email} has been revoked.` });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      setActionFeedback({ type: 'error', message: (err as Error).message });
    }
  };

  const handleChangeRole = async (membershipId: string, currentRole: AuthRole, newRole: AuthRole) => {
    if (currentRole === newRole) return;
    try {
      await changeRole(membershipId, newRole);
      setActionFeedback({ type: 'success', message: 'User role updated.' });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      setActionFeedback({ type: 'error', message: (err as Error).message });
    }
  };

  const handleToggleStatus = async (membershipId: string, currentStatus: string, email: string) => {
    try {
      if (currentStatus === 'active') {
        if (!window.confirm(`Are you sure you want to disable access for ${email}?`)) return;
        await disableUser(membershipId);
        setActionFeedback({ type: 'success', message: `Access disabled for ${email}.` });
      } else {
        await restoreUser(membershipId);
        setActionFeedback({ type: 'success', message: `Access restored for ${email}.` });
      }
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      setActionFeedback({ type: 'error', message: (err as Error).message });
    }
  };

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/accept-invite?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const roleBadges: Record<AuthRole, string> = {
    organisation_admin: 'bg-rose-50 text-rose-700 border-rose-200',
    super_admin: 'bg-purple-50 text-purple-700 border-purple-200',
    programme_director: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    finance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    teacher: 'bg-blue-50 text-blue-700 border-blue-200',
    viewer: 'bg-slate-50 text-slate-700 border-slate-200',
    guardian: 'bg-amber-50 text-amber-700 border-amber-200',
    learner: 'bg-teal-50 text-teal-700 border-teal-200'
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <SettingsNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Access & Security
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">Users, Roles & Team Access</h1>
            <p className="text-sm text-slate-500">
              Manage organisation members, role permissions, invitations, and administrative control.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsInviteOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite User</span>
            </button>
          </div>
        </div>

        {actionFeedback && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 text-sm font-semibold border ${
            actionFeedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            {actionFeedback.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              activeTab === 'members'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Active Team Members ({members.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('invitations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              activeTab === 'invitations'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Invitations ({invitations.filter(i => i.invitationStatus === 'pending').length} Pending)</span>
          </button>
        </div>

        {activeTab === 'members' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Joined Date</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m) => {
                    const isSelf = m.userId === authUser?.uid;
                    const isDisabled = m.membershipStatus === 'disabled';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{m.displayName || m.email}</span>
                            {isSelf && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                You
                              </span>
                            )}
                          </div>
                          {m.displayName && <div className="text-xs text-slate-400">{m.email}</div>}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${roleBadges[m.role] || roleBadges.viewer}`}>
                              {m.role.replace('_', ' ')}
                            </span>

                            {/* Role selector dropdown */}
                            {!isSelf && (
                              <select
                                value={m.role}
                                onChange={e => handleChangeRole(m.id, m.role, e.target.value as AuthRole)}
                                className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
                              >
                                <option value="teacher">Teacher</option>
                                <option value="programme_director">Programme Director</option>
                                <option value="finance">Finance</option>
                                <option value="organisation_admin">Admin</option>
                                <option value="viewer">Viewer</option>
                              </select>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            !isDisabled
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {m.membershipStatus}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                          {m.joinedAt?.split('T')[0]}
                        </td>

                        <td className="px-6 py-4 text-right">
                          {!isSelf && (
                            <button
                              onClick={() => handleToggleStatus(m.id, m.membershipStatus, m.email)}
                              title={isDisabled ? 'Restore Access' : 'Disable Access'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isDisabled
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                            >
                              {isDisabled ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {invitations.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">No invitations found</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Click "Invite User" to send access links to staff and directors.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Invitee Email</th>
                      <th className="px-6 py-3">Assigned Role</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Invited Date</th>
                      <th className="px-6 py-3">Expires</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invitations.map((inv) => {
                      const isPending = inv.invitationStatus === 'pending';
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{inv.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${roleBadges[inv.role] || roleBadges.viewer}`}>
                              {inv.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              isPending
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : inv.invitationStatus === 'accepted'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {inv.invitationStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                            {inv.invitedAt?.split('T')[0]}
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                            {inv.expiresAt?.split('T')[0]}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isPending && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => copyInviteLink(inv.token)}
                                  title="Copy Invitation Link"
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors inline-flex items-center gap-1 text-xs"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>{copiedToken === inv.token ? 'Copied!' : 'Copy Link'}</span>
                                </button>
                                <button
                                  onClick={() => handleRevoke(inv.id, inv.email)}
                                  title="Revoke Invitation"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <InviteUserModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSubmit={handleInviteSubmit}
      />
    </div>
  );
};
