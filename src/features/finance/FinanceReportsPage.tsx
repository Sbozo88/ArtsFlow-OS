import React, { useState } from 'react';
import { useFinanceReports } from '../../hooks/useFinanceReports';
import { formatMoney } from '../../lib/money';
import { 
  Printer, 
  FileText, 
  CreditCard, 
  AlertCircle, 
  GraduationCap, 
  Users, 
  CalendarDays, 
  Bus, 
  Tag 
} from 'lucide-react';

type ReportTab = 
  | 'payments' 
  | 'invoices' 
  | 'outstanding' 
  | 'programmes' 
  | 'groups' 
  | 'events' 
  | 'transport' 
  | 'charge_types';

export const FinanceReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('payments');
  const { dataContext, loading } = useFinanceReports();

  if (loading || !dataContext) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-indigo-600 mb-2"></div>
        <p>Loading operational finance reports...</p>
      </div>
    );
  }

  const {
    invoices,
    payments,
    charges,
    chargeTypes,
    programmes,
    groups,
    events,
    learnerMap,
    guardianMap,
    chargeTypeMap
  } = dataContext;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Financial Reports</h1>
          <p className="text-sm text-slate-500">
            Real-time transaction reports, fee summaries, collection metrics, and departmental balances.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="btn btn-secondary text-sm flex items-center gap-1.5 shadow-xs"
        >
          <Printer className="w-4 h-4" /> Print / Export Report
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-1 bg-white p-2 rounded-xl border shadow-xs">
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'payments' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Payments
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'invoices' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" /> Invoices
        </button>
        <button
          onClick={() => setActiveTab('outstanding')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'outstanding' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertCircle className="w-4 h-4" /> Outstanding Fees
        </button>
        <button
          onClick={() => setActiveTab('programmes')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'programmes' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Programmes
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'groups' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" /> Groups
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'events' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CalendarDays className="w-4 h-4" /> Events
        </button>
        <button
          onClick={() => setActiveTab('transport')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'transport' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bus className="w-4 h-4" /> Transport
        </button>
        <button
          onClick={() => setActiveTab('charge_types')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'charge_types' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-4 h-4" /> Charge Types
        </button>
      </div>

      {/* Report Content Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
        {/* 1. Payment Report */}
        {activeTab === 'payments' && (
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800">Operational Payment Report</h3>
                <p className="text-xs text-slate-500">All recorded payments, methods, and allocation states.</p>
              </div>
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                Total: {formatMoney(payments.filter(p => p.paymentStatus !== 'reversed').reduce((sum, p) => sum + p.amount, 0))}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Payment #</th>
                    <th className="py-2.5 px-3">Learner</th>
                    <th className="py-2.5 px-3">Guardian</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Reference</th>
                    <th className="py-2.5 px-3">Received By</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {payments.map(p => {
                    const l = p.learnerId ? learnerMap.get(p.learnerId) : null;
                    const g = p.guardianId ? guardianMap.get(p.guardianId) : null;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 text-xs">
                        <td className="py-2 px-3 text-slate-600">{p.paymentDate}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{l ? `${l.firstName} ${l.lastName}` : '—'}</td>
                        <td className="py-2 px-3 text-slate-600">{g ? `${g.firstName} ${g.lastName}` : '—'}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-700">{formatMoney(p.amount, p.currency)}</td>
                        <td className="py-2 px-3 capitalize text-slate-600">{p.paymentMethod.replace('_', ' ')}</td>
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{p.reference || '—'}</td>
                        <td className="py-2 px-3 text-slate-600">{p.receivedBy}</td>
                        <td className="py-2 px-3 text-center capitalize">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.paymentStatus === 'allocated' ? 'bg-emerald-100 text-emerald-800' :
                            p.paymentStatus === 'partially_allocated' ? 'bg-blue-100 text-blue-800' :
                            p.paymentStatus === 'unallocated' ? 'bg-purple-100 text-purple-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {p.paymentStatus.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Invoice Report */}
        {activeTab === 'invoices' && (
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800">Operational Invoice Report</h3>
                <p className="text-xs text-slate-500">All issued fee invoices, settlement rates, and balances.</p>
              </div>
              <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">
                Total Invoiced: {formatMoney(invoices.filter(i => i.invoiceStatus !== 'cancelled').reduce((sum, i) => sum + i.total, 0))}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Learner</th>
                    <th className="py-2.5 px-3">Issue Date</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-right">Paid</th>
                    <th className="py-2.5 px-3 text-right">Balance Due</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoices.map(inv => {
                    const l = learnerMap.get(inv.learnerId);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 text-xs">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{l ? `${l.firstName} ${l.lastName}` : inv.learnerId}</td>
                        <td className="py-2 px-3 text-slate-600">{inv.issueDate}</td>
                        <td className="py-2 px-3 text-slate-600">{inv.dueDate}</td>
                        <td className="py-2 px-3 text-right font-medium text-slate-700">{formatMoney(inv.total, inv.currency)}</td>
                        <td className="py-2 px-3 text-right font-medium text-emerald-700">{formatMoney(inv.amountPaid, inv.currency)}</td>
                        <td className="py-2 px-3 text-right font-bold text-rose-700">{formatMoney(inv.balance, inv.currency)}</td>
                        <td className="py-2 px-3 text-center capitalize">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            inv.invoiceStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                            inv.invoiceStatus === 'overdue' ? 'bg-rose-100 text-rose-800 font-bold' :
                            inv.invoiceStatus === 'partially_paid' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {inv.invoiceStatus.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Outstanding Fees Report */}
        {activeTab === 'outstanding' && (
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800">Outstanding Fees & Debt Aging</h3>
                <p className="text-xs text-slate-500">Unpaid invoices filtered by due date and overdue status.</p>
              </div>
              <span className="text-xs font-semibold bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full">
                Total Overdue: {formatMoney(invoices.filter(i => i.invoiceStatus !== 'cancelled' && i.dueDate < today && i.balance > 0).reduce((sum, i) => sum + i.balance, 0))}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Learner</th>
                    <th className="py-2.5 px-3">Guardian</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-right">Invoice Total</th>
                    <th className="py-2.5 px-3 text-right">Amount Paid</th>
                    <th className="py-2.5 px-3 text-right">Balance Due</th>
                    <th className="py-2.5 px-3 text-center">Overdue?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoices.filter(i => i.invoiceStatus !== 'cancelled' && i.balance > 0).map(inv => {
                    const l = learnerMap.get(inv.learnerId);
                    const g = inv.guardianId ? guardianMap.get(inv.guardianId) : null;
                    const isOverdue = inv.dueDate < today;
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 text-xs">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{l ? `${l.firstName} ${l.lastName}` : inv.learnerId}</td>
                        <td className="py-2 px-3 text-slate-600">{g ? `${g.firstName} ${g.lastName}` : '—'}</td>
                        <td className="py-2 px-3 text-slate-600 font-mono">{inv.dueDate}</td>
                        <td className="py-2 px-3 text-right text-slate-700">{formatMoney(inv.total, inv.currency)}</td>
                        <td className="py-2 px-3 text-right text-emerald-700">{formatMoney(inv.amountPaid, inv.currency)}</td>
                        <td className="py-2 px-3 text-right font-extrabold text-rose-700">{formatMoney(inv.balance, inv.currency)}</td>
                        <td className="py-2 px-3 text-center">
                          {isOverdue ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              OVERDUE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                              Current
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Programme Finance */}
        {activeTab === 'programmes' && (
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Programme Financial Breakdown</h3>
              <p className="text-xs text-slate-500">Financial revenue generated per academic programme.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Programme Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-center">Charges Generated</th>
                    <th className="py-2.5 px-3 text-right">Total Charges</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {programmes.map(prog => {
                    const progCharges = charges.filter(c => c.programmeId === prog.id && c.chargeStatus !== 'cancelled');
                    const progTotal = progCharges.reduce((sum, c) => sum + c.amount, 0);
                    return (
                      <tr key={prog.id} className="hover:bg-slate-50 text-xs">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{prog.name}</td>
                        <td className="py-2.5 px-3 capitalize text-slate-600">{prog.programmeType}</td>
                        <td className="py-2.5 px-3 text-center text-slate-700 font-semibold">{progCharges.length}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-indigo-700">{formatMoney(progTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Group Finance */}
        {activeTab === 'groups' && (
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Group & Class Financial Breakdown</h3>
              <p className="text-xs text-slate-500">Charges and revenue across ensemble groups and dance classes.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Group Name</th>
                    <th className="py-2.5 px-3 text-center">Charges Linked</th>
                    <th className="py-2.5 px-3 text-right">Total Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {groups.map(grp => {
                    const grpCharges = charges.filter(c => c.groupId === grp.id && c.chargeStatus !== 'cancelled');
                    const grpTotal = grpCharges.reduce((sum, c) => sum + c.amount, 0);
                    return (
                      <tr key={grp.id} className="hover:bg-slate-50 text-xs">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{grp.name}</td>
                        <td className="py-2.5 px-3 text-center text-slate-700">{grpCharges.length}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatMoney(grpTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. Event Finance */}
        {activeTab === 'events' && (
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Event Financial Performance</h3>
              <p className="text-xs text-slate-500">Participation and registration fees generated per event.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Event</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-center">Charges</th>
                    <th className="py-2.5 px-3 text-right">Event Revenue Expected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {events.map(ev => {
                    const evCharges = charges.filter(c => c.eventId === ev.id && c.chargeStatus !== 'cancelled');
                    const evTotal = evCharges.reduce((sum, c) => sum + c.amount, 0);
                    return (
                      <tr key={ev.id} className="hover:bg-slate-50 text-xs">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{ev.name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{ev.startDate}</td>
                        <td className="py-2.5 px-3 text-center text-slate-700">{evCharges.length}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-indigo-700">{formatMoney(evTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. Transport Contributions */}
        {activeTab === 'transport' && (
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Transport Contributions Breakdown</h3>
              <p className="text-xs text-slate-500">Charges specifically categorized for passenger transport contributions.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Learner</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {charges
                    .filter(c => {
                      const ct = chargeTypeMap.get(c.chargeTypeId);
                      return ct?.category === 'transport' || c.transportPlanId;
                    })
                    .map(tc => {
                      const l = learnerMap.get(tc.learnerId);
                      return (
                        <tr key={tc.id} className="hover:bg-slate-50 text-xs">
                          <td className="py-2 px-3 text-slate-600">{tc.chargeDate}</td>
                          <td className="py-2 px-3 font-medium text-slate-900">{l ? `${l.firstName} ${l.lastName}` : tc.learnerId}</td>
                          <td className="py-2 px-3 text-slate-700">{tc.description}</td>
                          <td className="py-2 px-3 text-right font-bold text-sky-800">{formatMoney(tc.amount, tc.currency)}</td>
                          <td className="py-2 px-3 text-center capitalize">{tc.chargeStatus}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 8. Charge Type Summary */}
        {activeTab === 'charge_types' && (
          <div>
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Charge Type Summary</h3>
              <p className="text-xs text-slate-500">Summary across all configured fee categories.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Charge Type</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Default Rate</th>
                    <th className="py-2.5 px-3 text-center">Times Charged</th>
                    <th className="py-2.5 px-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {chargeTypes.map(ct => {
                    const linkedCharges = charges.filter(c => c.chargeTypeId === ct.id && c.chargeStatus !== 'cancelled');
                    const total = linkedCharges.reduce((sum, c) => sum + c.amount, 0);
                    return (
                      <tr key={ct.id} className="hover:bg-slate-50 text-xs">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{ct.name}</td>
                        <td className="py-2.5 px-3 capitalize text-slate-600">{ct.category}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">{formatMoney(ct.defaultAmount, ct.currency)}</td>
                        <td className="py-2.5 px-3 text-center text-slate-700">{linkedCharges.length}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-indigo-700">{formatMoney(total, ct.currency)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
