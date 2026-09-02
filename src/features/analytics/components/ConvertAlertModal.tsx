import { useState } from 'react';
import { X, ClipboardList, Loader2 } from 'lucide-react';
import type { OperationalAlert } from '../../../types';

interface ConvertAlertModalProps {
  alert: OperationalAlert | null;
  onClose: () => void;
  onSubmit: (options: {
    assignedStaffId?: string;
    dueDate?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }) => Promise<void>;
}

export function ConvertAlertModal({ alert, onClose, onSubmit }: ConvertAlertModalProps) {
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>(
    alert?.severity === 'critical' ? 'urgent' : alert?.severity === 'urgent' ? 'high' : 'normal'
  );
  const [loading, setLoading] = useState(false);

  if (!alert) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ dueDate, priority });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Assign Follow-Up Task</h3>
              <p className="text-xs text-slate-500">Convert system alert into an actionable item</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs font-semibold text-slate-700">{alert.title}</div>
            <div className="text-xs text-slate-500 mt-0.5">{alert.description}</div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Target Due Date</label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Task Priority</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as 'low' | 'normal' | 'high' | 'urgent')}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create Follow-Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
