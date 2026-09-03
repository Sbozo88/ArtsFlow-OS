import React, { useEffect, useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { platformAuditService } from '../../../services/platformAuditService';
import type { AuditLog } from '../../../types';

export const PlatformAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await platformAuditService.listPlatformAudit({ limit: 150 });
      setLogs(list);
    } catch (err) {
      setError((err as Error).message || 'Failed to load platform audit trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    platformAuditService
      .listPlatformAudit({ limit: 150 })
      .then((list) => {
        if (isMounted) {
          setLogs(list);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError((err as Error).message || 'Failed to load platform audit trail');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      const term = search.trim().toLowerCase();
      if (!term) return true;

      return (
        log.action.toLowerCase().includes(term) ||
        log.actorId.toLowerCase().includes(term) ||
        log.entityId.toLowerCase().includes(term) ||
        (log.organisationId && log.organisationId.toLowerCase().includes(term))
      );
    });
  }, [logs, search, actionFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            Platform Audit Trail
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable log of all Super Admin platform actions, tenant lifecycle mutations, and security events.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors self-start sm:self-auto"
          title="Refresh audit logs"
          aria-label="Refresh audit logs"
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
            placeholder="Search by action, actor, tenant ID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Actions</option>
          <option value="PLATFORM_CREATE_ORGANISATION">Create Organisation</option>
          <option value="PLATFORM_ACTIVATE_TENANT">Activate Tenant</option>
          <option value="PLATFORM_RESTRICT_TENANT">Restrict Tenant</option>
          <option value="PLATFORM_SUSPEND_TENANT">Suspend Tenant</option>
          <option value="PLATFORM_RESTORE_TENANT">Restore Tenant</option>
          <option value="PLATFORM_CANCEL_TENANT">Cancel Tenant</option>
          <option value="PLATFORM_ARCHIVE_TENANT">Archive Tenant</option>
        </select>
      </div>

      {/* Audit Table */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Tenant / Target</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Details / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                    No platform audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const afterData = (log.after || {}) as Record<string, unknown>;
                  const reason = log.reason || (afterData.reason as string);

                  return (
                    <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs font-mono text-slate-300">
                        {log.organisationId || log.entityId}
                      </td>

                      <td className="py-3 px-4 text-xs font-mono text-slate-400">
                        {log.actorId}
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-300">
                        {reason ? (
                          <span className="text-amber-300 italic">{reason}</span>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">
                            {log.before && log.after ? `${JSON.stringify(log.before)} → ${JSON.stringify(log.after)}` : 'System state mutation'}
                          </span>
                        )}
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
