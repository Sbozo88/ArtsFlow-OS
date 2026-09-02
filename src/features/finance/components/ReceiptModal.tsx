import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { receiptService, ReceiptData } from '../../../services/receiptService';
import { formatMoney } from '../../../lib/money';
import { X, Printer, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  paymentId: string | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ paymentId, onClose }) => {
  const { organisationId } = useAuth();
  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organisationId || !paymentId) return;
    let mounted = true;

    receiptService.getReceiptForPayment(organisationId, paymentId).then(res => {
      if (mounted) {
        setData(res);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [organisationId, paymentId]);

  if (!paymentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">Official Payment Receipt</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1 text-sm font-medium"
              title="Print Receipt"
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

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading receipt details...</div>
        ) : !data ? (
          <div className="p-12 text-center text-rose-500">Receipt could not be generated.</div>
        ) : (
          <div className="p-8 space-y-6 text-slate-800 print:p-0">
            {/* Header / Brand */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">ArtsFlow OS</h1>
                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mt-0.5">
                  Official Financial Receipt
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-mono font-bold text-sm rounded-md">
                  {data.receiptNumber}
                </span>
                <p className="text-xs text-slate-500 mt-1">Date: {data.payment.paymentDate}</p>
              </div>
            </div>

            {/* Recipient & Payment Method Info */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Received From</p>
                <p className="font-bold text-slate-800 text-base">
                  {data.learner ? `${data.learner.firstName} ${data.learner.lastName}` : 'Direct Guardian Payment'}
                </p>
                {data.guardian && (
                  <p className="text-xs text-slate-600 mt-0.5">
                    Guardian: {data.guardian.firstName} {data.guardian.lastName} ({data.guardian.mobileNumber})
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Payment Summary</p>
                <p className="font-bold text-slate-900 text-base">
                  Amount: <span className="text-emerald-700">{formatMoney(data.payment.amount, data.payment.currency)}</span>
                </p>
                <p className="text-xs text-slate-600 mt-0.5 capitalize">
                  Method: {data.payment.paymentMethod.replace('_', ' ')}
                  {data.payment.reference && ` | Ref: ${data.payment.reference}`}
                </p>
              </div>
            </div>

            {/* Invoices Allocated */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Allocated Invoices & Accounts
              </h3>
              {data.allocations.length === 0 ? (
                <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-200">
                  This payment is currently unallocated and held as credit on the learner account.
                </p>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
                      <tr>
                        <th className="py-2 px-3">Invoice #</th>
                        <th className="py-2 px-3">Due Date</th>
                        <th className="py-2 px-3 text-right">Invoice Total</th>
                        <th className="py-2 px-3 text-right">Allocated Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {data.allocations.map(({ allocation, invoice }) => (
                        <tr key={allocation.id}>
                          <td className="py-2 px-3 font-mono font-medium text-slate-900">
                            {invoice?.invoiceNumber || allocation.invoiceId}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{invoice?.dueDate || '—'}</td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {invoice ? formatMoney(invoice.total, invoice.currency) : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-700">
                            {formatMoney(allocation.amount, data.payment.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Sign-off / Footer */}
            <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-xs text-slate-500">
              <div>
                <p>Received By: <strong className="text-slate-700">{data.payment.receivedBy}</strong></p>
                <p className="text-[10px] text-slate-400 mt-0.5">Recorded: {new Date(data.payment.createdAt).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-700">Thank you for your prompt contribution!</p>
                <p className="text-[10px] text-slate-400">ArtsFlow OS Financial Administration</p>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
