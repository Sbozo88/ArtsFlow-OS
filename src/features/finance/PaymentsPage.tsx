import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePayments } from '../../hooks/usePayments';
import { useInvoices } from '../../hooks/useInvoices';
import { useLearners } from '../../hooks/useLearners';
import { paymentService } from '../../services/paymentService';
import { paymentAllocationService } from '../../services/paymentAllocationService';
import { formatMoney, toCents, toMajor } from '../../lib/money';
import { ReceiptModal } from './components/ReceiptModal';
import { Payment, PaymentMethod, PaymentStatus } from '../../types';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  Receipt, 
  RotateCcw, 
  X,
  Layers
} from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const { organisationId, user } = useAuth();
  const location = useLocation();
  const shouldOpenRecord = new URLSearchParams(location.search).get('record') === 'true';

  const { payments, loading, refresh } = usePayments();
  const { invoices, refresh: refreshInvoices } = useInvoices();
  const { learners } = useLearners();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Modals state
  const [showRecordModal, setShowRecordModal] = useState(shouldOpenRecord);
  const [showAllocateModal, setShowAllocateModal] = useState<Payment | null>(null);
  const [showReverseModal, setShowReverseModal] = useState<Payment | null>(null);
  const [selectedReceiptPaymentId, setSelectedReceiptPaymentId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Record Payment Form
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('eft');
  const [reference, setReference] = useState('');
  const [receivedBy, setReceivedBy] = useState(user?.displayName || 'Finance Office');
  const [notes, setNotes] = useState('');
  const [invoiceAllocations, setInvoiceAllocations] = useState<Record<string, number>>({});

  // Allocate Modal Form
  const [allocTargetInvoiceId, setAllocTargetInvoiceId] = useState('');
  const [allocAmount, setAllocAmount] = useState<number>(0);

  // Reverse Modal Form
  const [reverseReason, setReverseReason] = useState('');

  const learnerMap = new Map(learners.map(l => [l.id, l]));

  // Open invoices for selected learner
  const openInvoicesForLearner = invoices.filter(
    inv => inv.learnerId === selectedLearnerId && inv.invoiceStatus !== 'cancelled' && inv.balance > 0
  );

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || amount <= 0) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const amountCents = toCents(amount);

      // Build allocations array
      const allocations = Object.entries(invoiceAllocations)
        .filter(([, allocVal]) => allocVal > 0)
        .map(([invoiceId, allocVal]) => ({
          invoiceId,
          amount: toCents(allocVal)
        }));

      const createdPayment = await paymentService.recordPayment(
        organisationId,
        {
          learnerId: selectedLearnerId || undefined,
          paymentDate,
          amount: amountCents,
          paymentMethod,
          reference,
          receivedBy,
          notes,
          allocations: allocations.length > 0 ? allocations : undefined
        },
        user?.uid || 'system'
      );

      await Promise.all([refresh(), refreshInvoices()]);
      setShowRecordModal(false);
      resetRecordForm();
      setSelectedReceiptPaymentId(createdPayment.id);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const resetRecordForm = () => {
    setSelectedLearnerId('');
    setAmount(0);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('eft');
    setReference('');
    setNotes('');
    setInvoiceAllocations({});
    setActionError(null);
  };

  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !showAllocateModal || !allocTargetInvoiceId || allocAmount <= 0) return;

    setActionLoading(true);
    setActionError(null);
    try {
      await paymentAllocationService.allocatePayment(
        organisationId,
        showAllocateModal.id,
        allocTargetInvoiceId,
        toCents(allocAmount),
        user?.uid || 'system'
      );

      await Promise.all([refresh(), refreshInvoices()]);
      setShowAllocateModal(null);
      setAllocTargetInvoiceId('');
      setAllocAmount(0);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReverseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !showReverseModal || !reverseReason.trim()) return;

    setActionLoading(true);
    setActionError(null);
    try {
      await paymentService.reversePayment(
        organisationId,
        showReverseModal.id,
        reverseReason,
        user?.uid || 'system'
      );

      await Promise.all([refresh(), refreshInvoices()]);
      setShowReverseModal(null);
      setReverseReason('');
    } catch (err: unknown) {
      setActionError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    const learner = p.learnerId ? learnerMap.get(p.learnerId) : null;
    const learnerName = learner ? `${learner.firstName} ${learner.lastName}` : '';
    const ref = p.reference || '';
    const matchesSearch =
      p.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      learnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.paymentStatus === statusFilter;
    const matchesMethod = methodFilter === 'all' || p.paymentMethod === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'allocated':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">Allocated</span>;
      case 'partially_allocated':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Partially Allocated</span>;
      case 'unallocated':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 font-bold">Unallocated</span>;
      case 'reversed':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 line-through">Reversed</span>;
      case 'recorded':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">Recorded</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payments & Receipts</h1>
          <p className="text-sm text-slate-500">
            Record cash, EFT, and card collections, allocate against invoices, and issue receipts.
          </p>
        </div>
        <button
          onClick={() => setShowRecordModal(true)}
          className="btn btn-primary text-sm flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Record New Payment
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by payment number, learner, or reference..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="allocated">Allocated</option>
            <option value="partially_allocated">Partially Allocated</option>
            <option value="unallocated">Unallocated</option>
            <option value="reversed">Reversed</option>
          </select>

          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="eft">EFT</option>
            <option value="bank_deposit">Bank Deposit</option>
            <option value="card">Card</option>
            <option value="mobile_payment">Mobile Payment</option>
          </select>
        </div>
      </div>

      {/* Payments List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading payments...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No payments found. Click "Record New Payment" to enter a transaction.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Payment #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Learner / Payer</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Allocated</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map(p => {
                  const learner = p.learnerId ? learnerMap.get(p.learnerId) : null;
                  const unallocated = (p.amount || 0) - (p.allocatedAmount || 0);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                      <td className="py-3 px-4 text-slate-600">{p.paymentDate}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {learner ? `${learner.firstName} ${learner.lastName}` : 'Direct Deposit'}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold capitalize text-slate-600">
                        {p.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">{p.reference || '—'}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {formatMoney(p.amount, p.currency)}
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-slate-600">
                        {formatMoney(p.allocatedAmount || 0, p.currency)}
                      </td>
                      <td className="py-3 px-4 text-center">{getStatusBadge(p.paymentStatus)}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedReceiptPaymentId(p.id)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                        >
                          <Receipt className="w-3.5 h-3.5" /> Receipt
                        </button>

                        {p.paymentStatus !== 'reversed' && unallocated > 0 && (
                          <button
                            onClick={() => {
                              setShowAllocateModal(p);
                              setAllocAmount(toMajor(unallocated));
                            }}
                            className="text-xs text-purple-600 hover:text-purple-800 font-medium inline-flex items-center gap-1"
                          >
                            <Layers className="w-3.5 h-3.5" /> Allocate
                          </button>
                        )}

                        {p.paymentStatus !== 'reversed' && (
                          <button
                            onClick={() => setShowReverseModal(p)}
                            className="text-xs text-rose-600 hover:text-rose-800 font-medium inline-flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Reverse
                          </button>
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

      {/* Modal: Record Payment */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" /> Record New Payment
              </h3>
              <button onClick={() => setShowRecordModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 overflow-y-auto flex-1">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                  {actionError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Learner (Optional for Direct Deposits)</label>
                <select
                  value={selectedLearnerId}
                  onChange={e => {
                    setSelectedLearnerId(e.target.value);
                    setInvoiceAllocations({});
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">-- Direct Payer / Unassigned Learner --</option>
                  {learners.map(l => (
                    <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Amount (R) *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm capitalize"
                  >
                    <option value="eft">EFT / Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="bank_deposit">Bank Deposit</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="mobile_payment">Mobile Payment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Reference / Slip #</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    placeholder="e.g. MOKOENA-FEE"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Received By Staff Member *</label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={e => setReceivedBy(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              {/* Instant Invoice Allocation Section */}
              {selectedLearnerId && openInvoicesForLearner.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Allocate to Outstanding Invoices (Optional)
                  </h4>
                  <div className="space-y-2 max-h-36 overflow-y-auto bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {openInvoicesForLearner.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200 text-xs">
                        <div>
                          <p className="font-mono font-bold text-slate-800">{inv.invoiceNumber}</p>
                          <p className="text-rose-600 font-medium">Due: {inv.dueDate} | Balance: {formatMoney(inv.balance)}</p>
                        </div>
                        <div className="w-28">
                          <input
                            type="number"
                            min="0"
                            max={toMajor(inv.balance)}
                            step="0.01"
                            placeholder="Alloc (R)"
                            value={invoiceAllocations[inv.id] || ''}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setInvoiceAllocations({ ...invoiceAllocations, [inv.id]: val });
                            }}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-right font-medium"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || amount <= 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'Recording...' : 'Record Payment & Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Allocate Payment */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800">Allocate Payment to Invoice</h3>
              <button onClick={() => setShowAllocateModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAllocateSubmit} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                  {actionError}
                </div>
              )}

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 text-xs text-purple-900">
                Payment: <strong>{showAllocateModal.paymentNumber}</strong>
                <span className="block mt-0.5">
                  Remaining unallocated balance: <strong>{formatMoney((showAllocateModal.amount || 0) - (showAllocateModal.allocatedAmount || 0))}</strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Target Invoice *</label>
                <select
                  value={allocTargetInvoiceId}
                  onChange={e => {
                    setAllocTargetInvoiceId(e.target.value);
                    const selectedInv = invoices.find(i => i.id === e.target.value);
                    if (selectedInv) {
                      const unalloc = (showAllocateModal.amount || 0) - (showAllocateModal.allocatedAmount || 0);
                      const maxPossible = Math.min(toMajor(selectedInv.balance), toMajor(unalloc));
                      setAllocAmount(maxPossible);
                    }
                  }}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">-- Choose Outstanding Invoice --</option>
                  {invoices
                    .filter(i => i.invoiceStatus !== 'cancelled' && i.balance > 0)
                    .map(inv => {
                      const l = learnerMap.get(inv.learnerId);
                      return (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoiceNumber} - {l ? `${l.firstName} ${l.lastName}` : inv.learnerId} (Balance: {formatMoney(inv.balance)})
                        </option>
                      );
                    })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Amount to Allocate (R) *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={allocAmount}
                  onChange={e => setAllocAmount(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !allocTargetInvoiceId || allocAmount <= 0}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'Allocating...' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reverse Payment */}
      {showReverseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-rose-800 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4" /> Reverse Payment
              </h3>
              <button onClick={() => setShowReverseModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReverseSubmit} className="p-6 space-y-4">
              <div className="text-xs text-slate-600">
                Payment: <strong>{showReverseModal.paymentNumber}</strong> ({formatMoney(showReverseModal.amount)})
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                Reversing this payment will automatically rollback all allocations made from this payment and recalculate the affected invoice balances back to outstanding.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reason for Reversal *</label>
                <textarea
                  value={reverseReason}
                  onChange={e => setReverseReason(e.target.value)}
                  required
                  placeholder="e.g. Bounced cheque, bank chargeback, accidental duplicate entry..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReverseModal(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !reverseReason.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'Reversing...' : 'Confirm Reversal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        paymentId={selectedReceiptPaymentId}
        onClose={() => setSelectedReceiptPaymentId(null)}
      />
    </div>
  );
};
