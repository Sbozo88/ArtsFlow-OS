import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, Shield } from 'lucide-react';
import type { AuthRole } from '../../../types';
import type { InviteUserInput } from '../../../services/userInvitationService';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: InviteUserInput) => Promise<void>;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AuthRole>('teacher');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const roleDescriptions: Record<AuthRole, { title: string; desc: string }> = {
    organisation_admin: {
      title: 'Organisation Admin',
      desc: 'Full administrative access across all operational modules, settings, users, and finances.'
    },
    programme_director: {
      title: 'Programme Director',
      desc: 'Oversees programmes, groups, learners, events, and verifies staff timesheets.'
    },
    teacher: {
      title: 'Teacher',
      desc: 'Records attendance, views assigned groups, submits timesheets, and logs repertoire/choreography.'
    },
    finance: {
      title: 'Finance Manager',
      desc: 'Creates invoices, records payments, processes adjustments, and exports financial reports.'
    },
    viewer: {
      title: 'Viewer (Read-Only)',
      desc: 'Read-only visibility into learners, groups, sessions, and operational reports.'
    },
    super_admin: {
      title: 'Super Admin',
      desc: 'Complete root access across the multi-tenant system.'
    },
    guardian: {
      title: 'Guardian (External Portal)',
      desc: 'Self-service family access for linked learners only. Managed directly via the Guardians section.'
    },
    learner: {
      title: 'Learner (External Portal)',
      desc: 'Student self-service access for timetables, practice, and repertoire. Managed directly via the Learners section.'
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        email: email.toLowerCase().trim(),
        role
      });
      onClose();
    } catch (err) {
      const e = err as Error;
      setError(e.message || 'Failed to dispatch invitation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Invite Team Member</h2>
              <p className="text-xs text-slate-500">Send an invitation to join your organisation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. colleague@organisation.org"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Assign Role *
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as AuthRole)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="teacher">Teacher</option>
              <option value="programme_director">Programme Director</option>
              <option value="finance">Finance</option>
              <option value="organisation_admin">Organisation Admin</option>
              <option value="viewer">Viewer (Read-Only)</option>
            </select>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
            <Shield className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-900">{roleDescriptions[role]?.title}</div>
              <div className="text-xs text-slate-600 mt-0.5">{roleDescriptions[role]?.desc}</div>
            </div>
          </div>

          <div className="text-xs text-slate-500 bg-amber-50/70 border border-amber-200/60 p-3 rounded-lg">
            Invitations expire automatically after 7 days. The invitee can use their existing account or create a new password-protected profile upon accepting.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending Invitation...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
