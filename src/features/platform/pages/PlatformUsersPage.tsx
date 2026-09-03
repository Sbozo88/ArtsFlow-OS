import React, { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  AlertTriangle,
  Building2
} from 'lucide-react';
import {
  platformUserService,
  type PlatformUserSummary
} from '../../../services/platformUserService';

export const PlatformUsersPage: React.FC = () => {
  const [users, setUsers] = useState<PlatformUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'super_admin' | 'organisation'>('all');

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await platformUserService.listPlatformUsers();
      setUsers(list);
    } catch (err) {
      setError((err as Error).message || 'Failed to load platform users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    platformUserService
      .listPlatformUsers()
      .then((list) => {
        if (isMounted) {
          setUsers(list);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError((err as Error).message || 'Failed to load platform users');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const isSuperAdmin = u.platformRole === 'super_admin' || u.legacyRole === 'super_admin';
      if (roleFilter === 'super_admin' && !isSuperAdmin) return false;
      if (roleFilter === 'organisation' && isSuperAdmin) return false;

      const term = search.trim().toLowerCase();
      if (!term) return true;

      return (
        u.email.toLowerCase().includes(term) ||
        u.uid.toLowerCase().includes(term) ||
        (u.displayName && u.displayName.toLowerCase().includes(term)) ||
        u.memberships.some((m) => m.organisationId.toLowerCase().includes(term))
      );
    });
  }, [users, search, roleFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-400" />
            Platform Users & Memberships
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global identity directory and cross-tenant organisation memberships overview.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors self-start sm:self-auto"
          title="Refresh users"
          aria-label="Refresh users"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-red-200 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter / Search */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, name, user ID, or organisation..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as 'all' | 'super_admin' | 'organisation')}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Platform Roles</option>
          <option value="super_admin">Super Admins Only</option>
          <option value="organisation">School/Customer Users Only</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Platform Role</th>
                <th className="py-3 px-4">Organisation Memberships</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                    No users match your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSuperAdmin = u.platformRole === 'super_admin' || u.legacyRole === 'super_admin';

                  return (
                    <tr key={u.uid} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{u.displayName || u.email}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{u.email}</span>
                          <span>•</span>
                          <span className="font-mono text-[10px]">{u.uid}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isSuperAdmin ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            SUPER ADMIN
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">None</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {u.memberships.length === 0 ? (
                          <span className="text-xs text-slate-400">No active memberships</span>
                        ) : (
                          <div className="space-y-1">
                            {u.memberships.map((m) => (
                              <div
                                key={m.id}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs mr-1 mb-1"
                              >
                                <Building2 className="w-3 h-3 text-slate-400" />
                                <span className="font-mono text-[11px] text-slate-300">{m.organisationId}</span>
                                <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-indigo-400 font-medium">
                                  {m.role}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            u.status === 'disabled'
                              ? 'text-rose-400 bg-rose-500/10'
                              : 'text-emerald-400 bg-emerald-500/10'
                          }`}
                        >
                          {(u.status || 'active').toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
