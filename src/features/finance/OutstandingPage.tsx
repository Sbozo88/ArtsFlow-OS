import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOutstandingBalances, OutstandingRecord } from '../../hooks/useOutstandingBalances';
import { useStaff } from '../../hooks/useStaff';
import { followUpService } from '../../services/followUpService';
import { paymentService } from '../../services/paymentService';
import { formatMoney, toCents } from '../../lib/money';
import { 
  Search, 
  AlertCircle, 
  CreditCard, 
  ClipboardList, 
  ExternalLink,
  X,
  Clock
} from 'lucide-react';

export const OutstandingPage: React.FC = () => {
  const { organisationId, user } = useAuth();
  const { outstandingRecords, loading, refresh } = useOutstandingBalances();
  const { staff } = useStaff();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Modals state
  const [followUpTarget, setFollowUpTarget] = useState<OutstandingRecord | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<OutstandingRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Follow-Up Form
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [followUpSubject, setFollowUpSubject] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpDueDate, setFollowUpDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });

  // Quick Pay Form
  const [quickPayAmount, setQuickPayAmount] = useState<number>(0);
  const [quickPayMethod, setQuickPayMethod] = useState<'cash' | 'eft' | 'card' | 'bank_deposit'>('cash');
  const [quickPayRef, setQuickPayRef] = useState('');

  const filteredRecords = outstandingRecords.filter(r => {
    if (overdueOnly && !r.isOverdue) return false;

    const learnerName = r.learner ? `${r.learner.firstName} ${r.learner.lastName}` : '';
    const guardianName = r.guardian ? `${r.guardian.firstName} ${r.guardian.lastName}` : '';
    const matchesSearch =
      learnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guardianName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const totalOutstanding = filteredRecords.reduce((sum, r) => sum + r.outstandingBalance, 0);

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !followUpTarget) return;

    setActionLoading(true);
    setActionError(null);
    try {
      await followUpService.createFollowUp(organisationId, user?.uid || 'system', {
        learnerId: followUpTarget.learnerId,
        guardianId: followUpTarget.guardianId,
        category: 'payment',
        subject: followUpSubject || `Outstanding fee reminder: ${formatMoney(followUpTarget.outstandingBalance)}`,
        description: followUpNotes || `Learner has ${followUpTarget.invoiceCount} unpaid invoices totaling ${formatMoney(followUpTarget.outstandingBalance)}.`,
        ownerId: assignedStaffId || user?.uid || staff[0]?.id || 'admin',
        dueDate: followUpDueDate,
        priority: followUpTarget.isOverdue ? 'high' : 'normal'
      });

      setFollowUpTarget(null);
      alert('Payment follow-up task assigned successfully.');
    } catch (err: unknown) {
      setActionError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !paymentTarget || quickPayAmount <= 0) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      await paymentService.recordPayment(
        organisationId,
        {
          learnerId: paymentTarget.learnerId,
          guardianId: paymentTarget.guardianId,
          amount: toCents(quickPayAmount),
          paymentDate: today,
          paymentMethod: quickPayMethod,
          reference: quickPayRef || 'Quick Pay',
          receivedBy: user?.displayName || 'Finance Officer'
        },
        user?.uid || 'system'
      );

      await refresh();
      setPaymentTarget(null);
      setQuickPayAmount(0);
      setQuickPayRef('');
    } catch (err: unknown) {
      setActionError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Outstanding Balances</h1>
          <p className="text-sm text-slate-500">
            Accounts with pending balances, aging invoices, and debt recovery workflows.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg text-right">
          <span className="text-xs font-semibold uppercase text-amber-700 block">Total Outstanding</span>
          <span className="text-xl font-black text-amber-900">{formatMoney(totalOutstanding)}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search learner or guardian name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={e => setOverdueOnly(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500"
            />
            <span className="text-rose-700">Show Overdue Accounts Only</span>
          </label>
        </div>
      </div>

      {/* Outstanding Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading outstanding balances...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No outstanding balances found! All learners have settled their accounts.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Learner</th>
                  <th className="py-3 px-4">Guardian / Contact</th>
                  <th className="py-3 px-4 text-center">Unpaid Invoices</th>
                  <th className="py-3 px-4">Oldest Due Date</th>
                  <th className="py-3 px-4 text-right">Invoiced Total</th>
                  <th className="py-3 px-4 text-right">Paid Total</th>
                  <th className="py-3 px-4 text-right">Outstanding Balance</th>
                  <th className="py-3 px-4 text-center">Aging Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map(r => (
                  <tr key={r.learnerId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <Link to={`/learners/${r.learnerId}`} className="hover:text-indigo-600 inline-flex items-center gap-1">
                        {r.learner ? `${r.learner.firstName} ${r.learner.lastName}` : r.learnerId}
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {r.guardian ? (
                        <div>
                          <p className="font-semibold text-slate-800">{r.guardian.firstName} {r.guardian.lastName}</p>
                          <p className="text-slate-500">{r.guardian.mobileNumber}</p>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-700">
                      {r.invoiceCount}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                      {r.oldestDueDate || '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {formatMoney(r.totalInvoiced)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-700">
                      {formatMoney(r.totalPaid)}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-rose-700 text-base">
                      {formatMoney(r.outstandingBalance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.isOverdue ? (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-800 flex items-center justify-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Overdue
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3" /> Current
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setPaymentTarget(r);
                          setQuickPayAmount(r.outstandingBalance / 100);
                        }}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded transition-colors inline-flex items-center gap-1"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Pay
                      </button>
                      <button
                        onClick={() => {
                          setFollowUpTarget(r);
                          setFollowUpSubject(`Fee collection reminder: ${r.learner?.firstName} ${r.learner?.lastName}`);
                        }}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded transition-colors inline-flex items-center gap-1"
                      >
                        <ClipboardList className="w-3.5 h-3.5" /> Reminder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Quick Pay */}
      {paymentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" /> Collect Payment
              </h3>
              <button onClick={() => setPaymentTarget(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickPayment} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                Learner: <strong>{paymentTarget.learner?.firstName} {paymentTarget.learner?.lastName}</strong>
                <span className="block text-rose-700 font-bold mt-0.5">
                  Total Outstanding: {formatMoney(paymentTarget.outstandingBalance)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Amount (R) *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quickPayAmount}
                  onChange={e => setQuickPayAmount(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method *</label>
                <select
                  value={quickPayMethod}
                  onChange={e => setQuickPayMethod(e.target.value as 'cash' | 'eft' | 'card' | 'bank_deposit')}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm capitalize"
                >
                  <option value="cash">Cash</option>
                  <option value="eft">EFT</option>
                  <option value="card">Card</option>
                  <option value="bank_deposit">Bank Deposit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reference</label>
                <input
                  type="text"
                  value={quickPayRef}
                  onChange={e => setQuickPayRef(e.target.value)}
                  placeholder="e.g. Receipt / Slip number"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentTarget(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || quickPayAmount <= 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Finance Follow-Up */}
      {followUpTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-indigo-600" /> Create Payment Follow-Up
              </h3>
              <button onClick={() => setFollowUpTarget(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFollowUp} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                  {actionError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Subject / Task Title *</label>
                <input
                  type="text"
                  value={followUpSubject}
                  onChange={e => setFollowUpSubject(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Assign Staff Member *</label>
                <select
                  value={assignedStaffId}
                  onChange={e => setAssignedStaffId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">-- Choose Staff Owner --</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date</label>
                <input
                  type="date"
                  value={followUpDueDate}
                  onChange={e => setFollowUpDueDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Instructions / Description</label>
                <textarea
                  value={followUpNotes}
                  onChange={e => setFollowUpNotes(e.target.value)}
                  placeholder="e.g. Call guardian regarding outstanding term fees..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFollowUpTarget(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !assignedStaffId}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'Assigning...' : 'Create Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
