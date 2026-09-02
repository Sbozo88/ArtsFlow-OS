import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInvoices } from '../../hooks/useInvoices';
import { useCharges } from '../../hooks/useCharges';
import { useLearners } from '../../hooks/useLearners';
import { invoiceService } from '../../services/invoiceService';
import { formatMoney } from '../../lib/money';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { Invoice } from '../../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  X
} from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const { organisationId, user } = useAuth();
  const location = useLocation();
  const shouldOpenCreate = new URLSearchParams(location.search).get('create') === 'true';

  const { invoices, loading, refresh } = useInvoices();
  const { charges, refresh: refreshCharges } = useCharges({ chargeStatus: 'active' });
  const { learners } = useLearners();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [showGenerateModal, setShowGenerateModal] = useState(shouldOpenCreate);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Generate Invoice Form
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [selectedChargeIds, setSelectedChargeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // default 14 days
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [autoIssue, setAutoIssue] = useState(true);

  const learnerMap = new Map(learners.map(l => [l.id, l]));

  // Charges available for the selected learner
  const learnerCharges = charges.filter(c => c.learnerId === selectedLearnerId);

  const handleToggleCharge = (id: string) => {
    if (selectedChargeIds.includes(id)) {
      setSelectedChargeIds(selectedChargeIds.filter(cId => cId !== id));
    } else {
      setSelectedChargeIds([...selectedChargeIds, id]);
    }
  };

  const handleSelectAllCharges = () => {
    if (selectedChargeIds.length === learnerCharges.length) {
      setSelectedChargeIds([]);
    } else {
      setSelectedChargeIds(learnerCharges.map(c => c.id));
    }
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !selectedLearnerId || selectedChargeIds.length === 0) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const { invoice } = await invoiceService.createInvoiceFromCharges(
        organisationId,
        {
          learnerId: selectedLearnerId,
          chargeIds: selectedChargeIds,
          dueDate,
          notes,
          autoIssue
        },
        user?.uid || 'system'
      );

      await Promise.all([refresh(), refreshCharges()]);
      setShowGenerateModal(false);
      setSelectedLearnerId('');
      setSelectedChargeIds([]);
      setNotes('');
      setSelectedInvoiceId(invoice.id);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const learner = learnerMap.get(inv.learnerId);
    const learnerName = learner ? `${learner.firstName} ${learner.lastName}` : '';
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      learnerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inv.invoiceStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Invoice['invoiceStatus']) => {
    switch (status) {
      case 'paid':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">Paid</span>;
      case 'partially_paid':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Partially Paid</span>;
      case 'overdue':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 font-bold">Overdue</span>;
      case 'issued':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">Issued</span>;
      case 'draft':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">Draft</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Invoices</h1>
          <p className="text-sm text-slate-500">
            Generate, issue, and manage official learner fee invoices and payment statuses.
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="btn btn-primary text-sm flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Generate Invoice
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice number or learner name..."
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
            <option value="all">All Invoices</option>
            <option value="draft">Draft</option>
            <option value="issued">Issued</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No invoices found. Click "Generate Invoice" to build an invoice from uninvoiced charges.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Learner</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map(inv => {
                  const learner = learnerMap.get(inv.learnerId);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {learner ? `${learner.firstName} ${learner.lastName}` : inv.learnerId}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{inv.issueDate}</td>
                      <td className="py-3 px-4 text-slate-600">{inv.dueDate}</td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        {formatMoney(inv.total, inv.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-700">
                        {formatMoney(inv.amountPaid, inv.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-700">
                        {formatMoney(inv.balance, inv.currency)}
                      </td>
                      <td className="py-3 px-4 text-center">{getStatusBadge(inv.invoiceStatus)}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedInvoiceId(inv.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Generate Invoice from Charges */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800">Generate Invoice from Charges</h3>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateInvoice} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                  {actionError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Learner *</label>
                <select
                  value={selectedLearnerId}
                  onChange={e => {
                    setSelectedLearnerId(e.target.value);
                    setSelectedChargeIds([]);
                  }}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">-- Choose Learner --</option>
                  {learners.map(l => (
                    <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>
                  ))}
                </select>
              </div>

              {selectedLearnerId && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-600">Select Charges to Include *</label>
                    {learnerCharges.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAllCharges}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        {selectedChargeIds.length === learnerCharges.length ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>

                  {learnerCharges.length === 0 ? (
                    <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded border border-slate-200">
                      No active uninvoiced charges for this learner. Create a charge first in Charges register.
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-2 bg-slate-50">
                      {learnerCharges.map(c => (
                        <label
                          key={c.id}
                          className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 hover:border-indigo-400 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedChargeIds.includes(c.id)}
                              onChange={() => handleToggleCharge(c.id)}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                              <p className="font-semibold text-slate-800">{c.description}</p>
                              <p className="text-slate-400">{c.chargeDate}</p>
                            </div>
                          </div>
                          <span className="font-bold text-slate-900">{formatMoney(c.amount, c.currency)}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Invoice Due Date *</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoIssue}
                      onChange={e => setAutoIssue(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Issue Immediately</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Invoice Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Bank payment reference instructions..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm h-16"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || selectedChargeIds.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        invoiceId={selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
        onInvoiceUpdated={() => refresh()}
      />
    </div>
  );
};
