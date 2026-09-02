import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFinanceDashboard, FinancePeriod } from '../../hooks/useFinanceDashboard';
import { useOutstandingBalances } from '../../hooks/useOutstandingBalances';
import { formatMoney } from '../../lib/money';
import { ReceiptModal } from './components/ReceiptModal';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertCircle, 
  Clock, 
  CreditCard, 
  FileText, 
  Plus, 
  Users, 
  Calendar,
  Eye,
  Receipt
} from 'lucide-react';

export const FinanceOverviewPage: React.FC = () => {
  const [period, setPeriod] = useState<FinancePeriod>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const {
    metrics,
    recentPayments,
    overdueInvoices,
    loading,
    refresh
  } = useFinanceDashboard(period, customStart, customEnd);

  const { outstandingRecords } = useOutstandingBalances();

  // Modals
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  if (loading && !metrics) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-indigo-600 mb-2"></div>
        <p>Loading finance overview...</p>
      </div>
    );
  }

  const topDebtors = outstandingRecords.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Finance & Payments</h1>
          <p className="text-sm text-slate-500">
            Real-time financial transactions, invoices, allocations, and revenue tracking.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/finance/payments?record=true"
            className="btn btn-primary text-sm flex items-center gap-1.5 shadow-xs"
          >
            <CreditCard className="w-4 h-4" /> Record Payment
          </Link>
          <Link
            to="/finance/invoices?create=true"
            className="btn btn-secondary text-sm flex items-center gap-1.5 shadow-xs"
          >
            <FileText className="w-4 h-4" /> Create Invoice
          </Link>
          <Link
            to="/finance/charges"
            className="btn btn-outline text-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Charge
          </Link>
        </div>
      </div>

      {/* Date Period Filter Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-700">Accounting Period:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['this_month', 'last_month', 'this_term', 'this_year', 'custom'] as FinancePeriod[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                period === p
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p === 'this_month' && 'This Month'}
              {p === 'last_month' && 'Last Month'}
              {p === 'this_term' && 'This Term'}
              {p === 'this_year' && 'This Year'}
              {p === 'custom' && 'Custom Range'}
            </button>
          ))}
          {period === 'custom' && (
            <div className="flex items-center gap-1.5 ml-2">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="px-2 py-1 border border-slate-300 rounded text-xs"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="px-2 py-1 border border-slate-300 rounded text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Invoiced</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {formatMoney(metrics?.totalInvoiced)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{metrics?.invoiceCount || 0} invoices in period</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Received</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-700">
            {formatMoney(metrics?.totalReceived)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{metrics?.paymentCount || 0} recorded payments</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Outstanding</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-700">
            {formatMoney(metrics?.outstandingBalance)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Pending payments</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-700">
            {formatMoney(metrics?.overdueBalance)}
          </div>
          <p className="text-[11px] text-rose-500 font-medium mt-1">Past due date</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">This Month</span>
            <DollarSign className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            {formatMoney(metrics?.paymentsThisMonth)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Cashflow this month</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Unallocated</span>
            <ArrowUpRight className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-purple-700">
            {formatMoney(metrics?.unallocatedPayments)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Credit balance held</p>
        </div>
      </div>

      {/* Warning banner if unallocated credits exist */}
      {metrics && metrics.unallocatedPayments > 0 && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between text-sm text-purple-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-600 shrink-0" />
            <span>
              There are <strong>{formatMoney(metrics.unallocatedPayments)}</strong> in unallocated payments waiting to be matched against learner invoices.
            </span>
          </div>
          <Link
            to="/finance/payments?status=unallocated"
            className="text-xs font-bold text-purple-700 hover:text-purple-900 underline"
          >
            Allocate Now &rarr;
          </Link>
        </div>
      )}

      {/* Two-Column Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Payments */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" /> Recent Payments
            </h3>
            <Link to="/finance/payments" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              View All &rarr;
            </Link>
          </div>
          {recentPayments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No recent payments recorded.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentPayments.map(p => (
                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{p.paymentNumber}</span>
                      <span className="text-xs text-slate-400">• {p.paymentDate}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 capitalize">
                      Method: {p.paymentMethod.replace('_', ' ')}
                      {p.reference && ` | ${p.reference}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-bold text-emerald-700 block">{formatMoney(p.amount, p.currency)}</span>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        {p.paymentStatus.replace('_', ' ')}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedPaymentId(p.id)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                      title="View Receipt"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Overdue & Recent Invoices */}
        <div className="space-y-6">
          {/* Overdue Invoices Alert Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-rose-50/50 flex items-center justify-between">
              <h3 className="font-bold text-rose-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" /> Overdue Invoices
              </h3>
              <Link to="/finance/invoices?status=overdue" className="text-xs font-semibold text-rose-700 hover:text-rose-900">
                View All &rarr;
              </Link>
            </div>
            {overdueInvoices.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">No overdue invoices. Great job!</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {overdueInvoices.map(inv => (
                  <div key={inv.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-900">{inv.invoiceNumber}</span>
                      <p className="text-xs text-rose-600 font-semibold mt-0.5">Due: {inv.dueDate}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-bold text-rose-700 block">{formatMoney(inv.balance, inv.currency)}</span>
                        <span className="text-[10px] text-slate-400">of {formatMoney(inv.total, inv.currency)}</span>
                      </div>
                      <button
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                        title="View Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Outstanding Accounts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" /> Largest Outstanding Balances
              </h3>
              <Link to="/finance/outstanding" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                Outstanding Register &rarr;
              </Link>
            </div>
            {topDebtors.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">All learner balances are settled!</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {topDebtors.map(debtor => (
                  <div key={debtor.learnerId} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-semibold text-sm text-slate-800">
                        {debtor.learner ? `${debtor.learner.firstName} ${debtor.learner.lastName}` : debtor.learnerId}
                      </p>
                      <p className="text-xs text-slate-500">
                        {debtor.guardian ? `Guardian: ${debtor.guardian.firstName} ${debtor.guardian.lastName}` : 'No guardian recorded'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-700 block">
                        {formatMoney(debtor.outstandingBalance)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {debtor.invoiceCount} unpaid invoice{debtor.invoiceCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Modals */}
      <ReceiptModal
        paymentId={selectedPaymentId}
        onClose={() => setSelectedPaymentId(null)}
      />

      <InvoiceDetailModal
        invoiceId={selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
        onInvoiceUpdated={() => refresh()}
      />
    </div>
  );
};
