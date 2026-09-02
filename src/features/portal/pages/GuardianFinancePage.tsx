import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, FileText, CheckCircle2, ChevronRight, AlertCircle, Building2 } from 'lucide-react';
import { useGuardianPortal } from '../../../hooks/useGuardianPortal';
import { useGuardianFinance } from '../../../hooks/useGuardianFinance';

export const GuardianFinancePage: React.FC = () => {
  const { selectedLearner, selectedLearnerId } = useGuardianPortal();
  const { finance, loading, error } = useGuardianFinance(selectedLearnerId);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !finance) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800">
          <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
          <p className="text-sm font-semibold">{error || 'Financial records unavailable or restricted.'}</p>
        </div>
      </div>
    );
  }

  const { totalInvoicedCents, totalPaidCents, outstandingBalanceCents, invoices, recentPayments, paymentInstructions } = finance;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Accounts & Invoices
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-1">
          Billing & Payments — {selectedLearner?.preferredName || selectedLearner?.firstName || 'Learner'}
        </h1>
        <p className="text-sm text-slate-500">
          Review official invoices, fee breakdowns, payment receipts, and organisation banking details.
        </p>
      </div>

      {/* Balance Summary Hero */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">Current Balance Due</span>
          <div className="text-4xl sm:text-5xl font-black mt-1">
            R{(outstandingBalanceCents / 100).toFixed(2)}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-300">
            <span>Total Invoiced: R{(totalInvoicedCents / 100).toFixed(2)}</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">Total Paid: R{(totalPaidCents / 100).toFixed(2)}</span>
          </div>
        </div>

        {paymentInstructions?.referenceFormat && (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10 text-xs space-y-1">
            <div className="text-indigo-300 font-bold uppercase tracking-wider text-[10px]">Payment Reference</div>
            <div className="font-mono text-sm font-bold">{paymentInstructions.referenceFormat}</div>
            <div className="text-slate-300 text-[11px]">Use when making EFT payments</div>
          </div>
        )}
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <CreditCard className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Invoices</h2>
        </div>

        {invoices.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No invoices issued yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {invoices.map(inv => (
              <div key={inv.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">{inv.invoiceNumber}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      inv.invoiceStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : inv.invoiceStatus === 'overdue'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inv.invoiceStatus}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Issued: {inv.issueDate} • Due: {inv.dueDate}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">
                      R{(inv.totalCents / 100).toFixed(2)}
                    </div>
                    {inv.balanceCents > 0 ? (
                      <div className="text-xs text-rose-600 font-bold">
                        Bal: R{(inv.balanceCents / 100).toFixed(2)}
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1 justify-end">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Paid</span>
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/portal/finance/invoices/${inv.id}`}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    title="View and Print Invoice"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payments and Receipts History */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">Payment Receipts</h2>
        </div>

        {recentPayments.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No payments recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentPayments.map(p => (
              <div key={p.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="font-mono text-indigo-600">{p.receiptNumber}</span>
                    <span className="text-slate-400 font-normal">•</span>
                    <span className="uppercase text-slate-600">{p.paymentMethod}</span>
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    Paid on {p.paymentDate} {p.reference ? `• Ref: ${p.reference}` : ''}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className="font-bold text-slate-900 text-sm">
                    R{(p.amountCents / 100).toFixed(2)}
                  </span>
                  <Link
                    to={`/portal/finance/receipts/${p.id}`}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-xs font-bold transition-colors"
                  >
                    View Receipt
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Guidelines / Bank Card */}
      <div className="bg-slate-100/80 rounded-3xl p-6 border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
          <Building2 className="w-4 h-4 text-slate-700" />
          <span>Organisation Payment Instructions</span>
        </div>
        <p className="leading-relaxed">
          Please make electronic funds transfers (EFT) using your learner reference number above so payments can be allocated promptly. Cash and card payments may also be arranged at the organisation administration office during rehearsal hours.
        </p>
      </div>
    </div>
  );
};
