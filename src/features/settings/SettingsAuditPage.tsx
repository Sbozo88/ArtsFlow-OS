import React, { useState, useEffect } from 'react';
import { History, Shield, Clock, ChevronDown, ChevronRight, User } from 'lucide-react';
import { SettingsNav } from './components/SettingsNav';
import { auditLogRepository } from '../../repositories/auditLogRepository';
import { useAuth } from '../../contexts/AuthContext';
import type { AuditLog } from '../../types';

const SETTINGS_ACTIONS = new Set([
  'UPDATE_ORGANISATION_PROFILE',
  'UPDATE_BRANDING',
  'CREATE_CALENDAR_PERIOD',
  'UPDATE_CALENDAR_PERIOD',
  'ARCHIVE_CALENDAR_PERIOD',
  'UPDATE_PROGRAMME_SETTINGS',
  'UPDATE_ATTENDANCE_SETTINGS',
  'UPDATE_FINANCE_SETTINGS',
  'UPDATE_STAFF_SETTINGS',
  'UPDATE_COMMUNICATION_SETTINGS',
  'UPDATE_AUTOMATION_SETTINGS',
  'UPDATE_TRANSPORT_SETTINGS',
  'UPDATE_CONSENT_SETTINGS',
  'UPDATE_DOCUMENT_SETTINGS',
  'UPDATE_SYSTEM_SETTINGS',
  'INVITE_USER',
  'REVOKE_INVITATION',
  'ACCEPT_INVITATION',
  'CHANGE_USER_ROLE',
  'DISABLE_USER',
  'RESTORE_USER'
]);

export const SettingsAuditPage: React.FC = () => {
  const { organisationId } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!organisationId) return;
    auditLogRepository.getByOrganisation(organisationId).then(all => {
      const filtered = all.filter(l => SETTINGS_ACTIONS.has(l.action));
      setLogs(filtered);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load audit logs:', err);
      setLoading(false);
    });
  }, [organisationId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const formatActionName = (action: string) => {
    return action.replace(/_/g, ' ');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <SettingsNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Compliance & Governance
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">Configuration Audit History</h1>
            <p className="text-sm text-slate-500">
              Immutable chronological record of all administrative changes, policy updates, and role modifications.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Audit Events ({logs.length})
            </span>
          </div>

          {logs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">No configuration changes logged yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Any modifications made to organization profile, finance defaults, periods, or staff permissions are safely tracked here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {logs.map((log) => {
                const isExpanded = expandedId === log.id;
                return (
                  <div key={log.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    >
                      <div className="flex items-center gap-3">
                        <button className="text-slate-400 hover:text-slate-600">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 font-mono">
                              {formatActionName(log.action)}
                            </span>
                            <span className="text-xs text-slate-400">&bull;</span>
                            <span className="text-xs text-slate-500 font-semibold">{log.entityType}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                            <User className="w-3 h-3" />
                            <span>Actor: {log.actorId}</span>
                            <span>&bull;</span>
                            <Clock className="w-3 h-3" />
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Diff Inspection */}
                    {isExpanded && (
                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 overflow-x-auto">
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Previous State
                          </div>
                          <pre className="text-slate-600 whitespace-pre-wrap">
                            {log.before ? JSON.stringify(log.before, null, 2) : 'None (Created)'}
                          </pre>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 overflow-x-auto">
                          <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
                            Updated State
                          </div>
                          <pre className="text-slate-800 whitespace-pre-wrap">
                            {log.after ? JSON.stringify(log.after, null, 2) : 'None (Removed)'}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
