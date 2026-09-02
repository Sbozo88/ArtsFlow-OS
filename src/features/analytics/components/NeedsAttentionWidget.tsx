import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  ArrowUpRight, 
  Check, 
  X, 
  ClipboardList, 
  RefreshCw 
} from 'lucide-react';
import { ConvertAlertModal } from './ConvertAlertModal';
import type { OperationalAlert } from '../../../types';

interface NeedsAttentionWidgetProps {
  alerts: OperationalAlert[];
  loading?: boolean;
  onScan?: () => void;
  onAcknowledge: (alertId: string) => Promise<void>;
  onDismiss: (alertId: string) => Promise<void>;
  onCreateFollowUp: (alertId: string, options: { dueDate?: string; priority?: 'low' | 'normal' | 'high' | 'urgent' }) => Promise<void>;
}

export function NeedsAttentionWidget({
  alerts,
  loading,
  onScan,
  onAcknowledge,
  onDismiss,
  onCreateFollowUp
}: NeedsAttentionWidgetProps) {
  const [selectedAlert, setSelectedAlert] = useState<OperationalAlert | null>(null);

  const getSeverityBadge = (severity: OperationalAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3" /> Critical
          </span>
        );
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
            <AlertTriangle className="w-3 h-3" /> Urgent
          </span>
        );
      case 'attention':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" /> Attention
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
            <Info className="w-3 h-3" /> Info
          </span>
        );
    }
  };

  const getEntityLink = (alert: OperationalAlert) => {
    if (!alert.relatedEntityType || !alert.relatedEntityId) return null;
    switch (alert.relatedEntityType) {
      case 'learner':
        return `/learners/${alert.relatedEntityId}`;
      case 'event':
        return `/events/${alert.relatedEntityId}`;
      case 'group':
        return `/groups/${alert.relatedEntityId}`;
      case 'finance':
        return `/finance/outstanding`;
      case 'communication':
        return `/communication/history`;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Needs Attention</h3>
            <p className="text-xs text-slate-500">
              {alerts.length === 0 ? 'All operational metrics within thresholds' : `${alerts.length} operational issues require management action`}
            </p>
          </div>
        </div>

        {onScan && (
          <button
            type="button"
            onClick={onScan}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-600 font-medium px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Scan Operations</span>
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-sm font-medium text-slate-800">Operational Integrity Intact</div>
          <div className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No consecutive absences, overdue finance, transport capacity breaches, or missing consents detected today.
          </div>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {alerts.map(alert => {
            const link = getEntityLink(alert);

            return (
              <div key={alert.id} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(alert.severity)}
                    <span className="text-xs font-semibold text-slate-800">{alert.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{alert.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>Detected: {new Date(alert.detectedAt).toLocaleDateString()}</span>
                    {alert.alertStatus === 'acknowledged' && (
                      <span className="text-indigo-600 font-medium">Acknowledged</span>
                    )}
                    {link && (
                      <Link to={link} className="inline-flex items-center gap-0.5 text-indigo-600 hover:underline">
                        <span>Open record</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedAlert(alert)}
                    title="Create Follow-Up"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Follow-Up</span>
                  </button>

                  {alert.alertStatus === 'active' && (
                    <button
                      type="button"
                      onClick={() => onAcknowledge(alert.id)}
                      title="Acknowledge"
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDismiss(alert.id)}
                    title="Dismiss alert"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedAlert && (
        <ConvertAlertModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onSubmit={async opts => {
            await onCreateFollowUp(selectedAlert.id, opts);
          }}
        />
      )}
    </div>
  );
}
