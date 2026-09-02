import { useState } from 'react';
import { 
  Bell, 
  Check, 
  Trash2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ExternalLink,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import type { AlertSeverity, NotificationStatus, NotificationType } from '../../types';

export function NotificationsPage() {
  const navigate = useNavigate();

  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const { notifications, loading, markAsRead, markAllAsRead, dismiss } = useNotifications({
    severity: selectedSeverity !== 'all' ? (selectedSeverity as AlertSeverity) : undefined,
    status: selectedStatus !== 'all' ? (selectedStatus as NotificationStatus) : undefined,
    type: selectedType !== 'all' ? (selectedType as NotificationType) : undefined
  });

  const getSeverityBadge = (sev: AlertSeverity) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 uppercase">
            <AlertTriangle className="w-3 h-3" /> Critical
          </span>
        );
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
            <AlertTriangle className="w-3 h-3" /> Urgent
          </span>
        );
      case 'attention':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 uppercase">
            <AlertCircle className="w-3 h-3" /> Attention
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
            <Info className="w-3 h-3" /> Info
          </span>
        );
    }
  };

  const handleNavigateToSource = (actionUrl?: string, relatedEntityType?: string, relatedEntityId?: string) => {
    if (actionUrl) {
      navigate(actionUrl);
      return;
    }

    if (relatedEntityType && relatedEntityId) {
      switch (relatedEntityType) {
        case 'learner':
          navigate(`/learners/${relatedEntityId}`);
          break;
        case 'invoice':
          navigate(`/finance/invoices`);
          break;
        case 'event':
          navigate(`/events`);
          break;
        case 'followUp':
        case 'follow_up':
          navigate(`/follow-ups`);
          break;
        case 'transportPlan':
          navigate(`/transport`);
          break;
        case 'instrumentAllocation':
          navigate(`/music/instruments`);
          break;
        case 'costumeAllocation':
          navigate(`/dance/costumes`);
          break;
        default:
          navigate(`/automation/activity`);
      }
    }
  };

  const unreadCount = notifications.filter(n => n.notificationStatus === 'unread').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" />
            Notifications Centre
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Operational alerts, task assignments, and automated escalations requiring your review.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4" />
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedStatus === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedStatus('unread')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedStatus === 'unread'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setSelectedStatus('read')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedStatus === 'read'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Read
          </button>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedSeverity}
            onChange={e => setSelectedSeverity(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="urgent">Urgent</option>
            <option value="attention">Attention</option>
            <option value="info">Info</option>
          </select>

          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none"
          >
            <option value="all">All Types</option>
            <option value="attendance">Attendance</option>
            <option value="finance">Finance</option>
            <option value="consent">Consent</option>
            <option value="event">Events</option>
            <option value="transport">Transport</option>
            <option value="asset">Assets</option>
            <option value="follow_up">Follow-Ups</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-sm">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
            <p className="font-bold text-slate-700 text-base">You are all caught up!</p>
            <p className="text-xs text-slate-400 mt-1">No active notifications matching your filter criteria.</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                notif.notificationStatus === 'unread' ? 'bg-indigo-50/30' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className="mt-0.5">{getSeverityBadge(notif.severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 truncate">{notif.title}</h3>
                    {notif.notificationStatus === 'unread' && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                    <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {notif.notificationType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {(notif.actionUrl || (notif.relatedEntityType && notif.relatedEntityId)) && (
                  <button
                    onClick={() => {
                      if (notif.notificationStatus === 'unread') {
                        markAsRead(notif.id);
                      }
                      handleNavigateToSource(notif.actionUrl, notif.relatedEntityType, notif.relatedEntityId);
                    }}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    Open Record
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}

                {notif.notificationStatus === 'unread' ? (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Mark as Read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => dismiss(notif.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Dismiss Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
