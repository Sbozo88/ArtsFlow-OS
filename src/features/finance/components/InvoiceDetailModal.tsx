import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { invoiceService } from '../../../services/invoiceService';
import { paymentAllocationService } from '../../../services/paymentAllocationService';
import { learnerRepository } from '../../../repositories/learnerRepository';
import { guardianRepository } from '../../../repositories/guardianRepository';
import { formatMoney } from '../../../lib/money';
import { Invoice, InvoiceLineItem, PaymentAllocation, Learner, Guardian } from '../../../types';
import { X, Printer, Send, AlertTriangle, FileText, Ban } from 'lucide-react';

interface InvoiceDetailModalProps {
  invoiceId: string | null;
  onClose: () => void;
  onInvoiceUpdated?: () => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoiceId,
  onClose,
  onInvoiceUpdated
}) => {
  const { organisationId, user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [allocations, setAllocations] = useState<PaymentAllocation[]>([]);
  const [learner, setLearner] = useState<Learner | null>(null);
  const [guardian, setGuardian] = useState<Guardian | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const reloadData = async () => {
    if (!organisationId || !invoiceId) return;
    try {
      const inv = await invoiceService.getInvoiceById(organisationId, invoiceId);
      if (!inv) return;
      setInvoice(inv);

      const [items, allocs, l, g] = await Promise.all([
        invoiceService.getInvoiceLineItems(organisationId, invoiceId),
        paymentAllocationService.getAllocations(organisationId, { invoiceId }),
        learnerRepository.getById(organisationId, inv.learnerId),
        inv.guardianId ? guardianRepository.getById(organisationId, inv.guardianId) : Promise.resolve(null)
      ]);

      setLineItems(items);
      setAllocations(allocs);
      setLearner(l);
      setGuardian(g);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (!organisationId || !invoiceId) {
      setTimeout(() => { if (mounted) setLoading(false); }, 0);
      return;
    }

    const fetchDetails = async () => {
      try {
        const inv = await invoiceService.getInvoiceById(organisationId, invoiceId);
        if (!inv || !mounted) return;
        setInvoice(inv);

        const [items, allocs, l, g] = await Promise.all([
          invoiceService.getInvoiceLineItems(organisationId, invoiceId),
          paymentAllocationService.getAllocations(organisationId, { invoiceId }),
          learnerRepository.getById(organisationId, inv.learnerId),
          inv.guardianId ? guardianRepository.getById(organisationId, inv.guardianId) : Promise.resolve(null)
        ]);

        if (mounted) {
          setLineItems(items);
          setAllocations(allocs);
          setLearner(l);
          setGuardian(g);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDetails();
    return () => { mounted = false; };
  }, [organisationId, invoiceId]);

  if (!invoiceId) return null;

  const handleIssue = async () => {
    if (!organisationId || !invoice) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await invoiceService.issueInvoice(organisationId, invoice.id, user?.uid || 'system');
      await reloadData();
      onInvoiceUpdated?.();
    } catch (err: unknown) {
      setActionError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!organisationId || !invoice || !cancelReason.trim()) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await invoiceService.cancelInvoice(organisationId, invoice.id, cancelReason, user?.uid || 'system');
      await reloadData();
      setShowCancelPrompt(false);
      onInvoiceUpdated?.();
    } catch (err: unknown) {
      setActionError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: Invoice['invoiceStatus']) => {
    switch (status) {
      case 'paid':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 uppercase">Paid</span>;
      case 'partially_paid':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 uppercase">Partial</span>;
      case 'overdue':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 uppercase">Overdue</span>;
      case 'issued':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 uppercase">Issued</span>;
      case 'draft':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 uppercase">Draft</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 uppercase">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Invoice Details</h2>
            {invoice && getStatusBadge(invoice.invoiceStatus)}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1 text-sm font-medium"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-8 overflow-y-auto space-y-6 flex-1 text-slate-800 print:p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading invoice details...</div>
          ) : !invoice ? (
            <div className="p-12 text-center text-rose-500">Invoice not found.</div>
          ) : (
            <>
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Header Details */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">ArtsFlow OS</h1>
                  <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mt-0.5">
                    Official Fee Invoice
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xl font-bold text-slate-900 block">
                    {invoice.invoiceNumber}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">Issue Date: {invoice.issueDate}</p>
                  <p className="text-xs font-semibold text-rose-600">Due Date: {invoice.dueDate}</p>
                </div>
              </div>

              {/* Billed to */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Learner / Account</p>
                  <p className="font-bold text-slate-900 text-base">
                    {learner ? `${learner.firstName} ${learner.lastName}` : invoice.learnerId}
                  </p>
                  {learner?.school && <p className="text-xs text-slate-500">{learner.school}</p>}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Responsible Guardian</p>
                  <p className="font-bold text-slate-900 text-base">
                    {guardian ? `${guardian.firstName} ${guardian.lastName}` : 'Direct Account'}
                  </p>
                  {guardian?.mobileNumber && (
                    <p className="text-xs text-slate-600 mt-0.5">Contact: {guardian.mobileNumber}</p>
                  )}
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Line Items</h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {lineItems.map(item => (
                        <tr key={item.id}>
                          <td className="py-2.5 px-3 font-medium text-slate-800">{item.description}</td>
                          <td className="py-2.5 px-3 text-center text-slate-600">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-slate-600">
                            {formatMoney(item.unitAmount, invoice.currency)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                            {formatMoney(item.lineTotal, invoice.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm border-t border-slate-200 pt-3">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatMoney(invoice.subtotal, invoice.currency)}</span>
                  </div>
                  {invoice.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discounts:</span>
                      <span>- {formatMoney(invoice.discountTotal, invoice.currency)}</span>
                    </div>
                  )}
                  {invoice.waiverTotal > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>Waivers:</span>
                      <span>- {formatMoney(invoice.waiverTotal, invoice.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
                    <span>Total Amount:</span>
                    <span>{formatMoney(invoice.total, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Amount Paid:</span>
                    <span>{formatMoney(invoice.amountPaid, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-rose-700 border-t border-slate-200 pt-1">
                    <span>Balance Due:</span>
                    <span>{formatMoney(invoice.balance, invoice.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Allocations */}
              {allocations.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Payment Allocations History
                  </h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
                        <tr>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Payment ID</th>
                          <th className="py-2 px-3 text-right">Amount Applied</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {allocations.map(a => (
                          <tr key={a.id}>
                            <td className="py-2 px-3 text-slate-600">{a.allocationDate.split('T')[0]}</td>
                            <td className="py-2 px-3 font-mono text-xs text-slate-800">{a.paymentId}</td>
                            <td className="py-2 px-3 text-right font-semibold text-emerald-700">
                              {formatMoney(a.amount, invoice.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes */}
              {invoice.notes && (
                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-200">
                  <p className="font-semibold text-slate-700">Notes:</p>
                  <p className="mt-0.5">{invoice.notes}</p>
                </div>
              )}

              {/* Cancel Prompt */}
              {showCancelPrompt && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3 animate-in fade-in">
                  <h4 className="text-sm font-bold text-red-800 flex items-center gap-1.5">
                    <Ban className="w-4 h-4" /> Confirm Invoice Cancellation
                  </h4>
                  <p className="text-xs text-red-700">
                    This will permanently cancel this invoice and reset linked charges back to active uninvoiced status.
                  </p>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    placeholder="Reason for cancellation (required)..."
                    className="w-full px-3 py-2 border border-red-300 rounded text-sm bg-white"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowCancelPrompt(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={!cancelReason.trim() || actionLoading}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold disabled:opacity-50"
                    >
                      {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Actions Footer */}
        {invoice && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <div>
              {invoice.invoiceStatus === 'draft' && !showCancelPrompt && (
                <button
                  onClick={() => setShowCancelPrompt(true)}
                  className="text-xs text-red-600 hover:text-red-800 font-semibold"
                >
                  Cancel Invoice
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                Close
              </button>
              {invoice.invoiceStatus === 'draft' && (
                <button
                  onClick={handleIssue}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Send className="w-4 h-4" /> {actionLoading ? 'Issuing...' : 'Issue Invoice'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
