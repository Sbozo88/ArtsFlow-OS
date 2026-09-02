import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCharges } from '../../hooks/useCharges';
import { useChargeTypes } from '../../hooks/useChargeTypes';
import { useLearners } from '../../hooks/useLearners';
import { useProgrammeGroups } from '../../hooks/useProgrammeGroups';
import { useEnrolments } from '../../hooks/useEnrolments';
import { chargeService } from '../../services/chargeService';
import { formatMoney, toCents, toMajor } from '../../lib/money';
import { Charge, ChargeStatus } from '../../types';
import { 
  Plus, 
  Filter, 
  Search, 
  Tag, 
  X, 
  Layers
} from 'lucide-react';

export const ChargesPage: React.FC = () => {
  const { organisationId, user } = useAuth();
  const { charges, loading, refresh } = useCharges();
  const { chargeTypes } = useChargeTypes();
  const { learners } = useLearners();
  const { groups } = useProgrammeGroups();
  const { enrolments } = useEnrolments();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modals state
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showWaiveModal, setShowWaiveModal] = useState<Charge | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Single Charge Form State
  const [singleLearnerId, setSingleLearnerId] = useState('');
  const [singleChargeTypeId, setSingleChargeTypeId] = useState('');
  const [singleDescription, setSingleDescription] = useState('');
  const [singleQuantity, setSingleQuantity] = useState(1);
  const [singleUnitAmount, setSingleUnitAmount] = useState<number>(0);
  const [singleDueDate, setSingleDueDate] = useState('');
  const [singleProgrammeId, setSingleProgrammeId] = useState('');
  const [singleEventId, setSingleEventId] = useState('');

  // Bulk Charge Form State
  const [bulkGroupId, setBulkGroupId] = useState('');
  const [bulkChargeTypeId, setBulkChargeTypeId] = useState('');
  const [bulkDescription, setBulkDescription] = useState('');
  const [bulkUnitAmount, setBulkUnitAmount] = useState<number>(0);
  const [bulkDueDate, setBulkDueDate] = useState('');

  // Waive Form State
  const [waiveAmount, setWaiveAmount] = useState<number>(0);
  const [waiveReason, setWaiveReason] = useState('');
  const [waiveApprover, setWaiveApprover] = useState('');

  const learnerMap = new Map(learners.map(l => [l.id, l]));
  const chargeTypeMap = new Map(chargeTypes.map(ct => [ct.id, ct]));

  // Handle Single Charge Type Selection auto-fill
  const handleSelectChargeType = (ctId: string) => {
    setSingleChargeTypeId(ctId);
    const ct = chargeTypeMap.get(ctId);
    if (ct) {
      if (!singleDescription) setSingleDescription(ct.name);
      if (ct.defaultAmount) setSingleUnitAmount(toMajor(ct.defaultAmount));
    }
  };

  const handleCreateSingleCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !singleLearnerId || !singleChargeTypeId) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      await chargeService.createCharge(
        organisationId,
        {
          learnerId: singleLearnerId,
          chargeTypeId: singleChargeTypeId,
          description: singleDescription || 'Programme charge',
          quantity: singleQuantity,
          unitAmount: toCents(singleUnitAmount),
          chargeDate: today,
          dueDate: singleDueDate || undefined,
          programmeId: singleProgrammeId || undefined,
          eventId: singleEventId || undefined
        },
        user?.uid || 'system'
      );

      await refresh();
      setShowSingleModal(false);
      resetSingleForm();
    } catch (err: unknown) {
      setActionError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const resetSingleForm = () => {
    setSingleLearnerId('');
    setSingleChargeTypeId('');
    setSingleDescription('');
    setSingleQuantity(1);
    setSingleUnitAmount(0);
    setSingleDueDate('');
    setSingleProgrammeId('');
    setSingleEventId('');
    setActionError(null);
  };

  // Bulk target learners calculation
  let targetLearnerIds: string[] = [];
  if (bulkGroupId) {
    targetLearnerIds = enrolments
      .filter(e => e.groupId === bulkGroupId && e.enrolmentStatus === 'active')
      .map(e => e.learnerId);
  }

  const handleCreateBulkCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !bulkChargeTypeId || targetLearnerIds.length === 0) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await chargeService.createBulkCharges(
        organisationId,
        {
          learnerIds: targetLearnerIds,
          chargeTypeId: bulkChargeTypeId,
          description: bulkDescription || 'Bulk programme charge',
          quantity: 1,
          unitAmount: toCents(bulkUnitAmount),
          chargeDate: today,
          dueDate: bulkDueDate || undefined,
          groupId: bulkGroupId || undefined
        },
        user?.uid || 'system'
      );

      await refresh();
      alert(`Bulk charges created: ${result.created.length} created, ${result.skipped} skipped (duplicates).`);
      setShowBulkModal(false);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWaiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !showWaiveModal) return;

    setActionLoading(true);
    setActionError(null);
    try {
      await chargeService.waiveCharge(
        organisationId,
        showWaiveModal.id,
        toCents(waiveAmount),
        waiveReason,
        waiveApprover,
        user?.uid || 'system'
      );

      await refresh();
      setShowWaiveModal(null);
      setWaiveAmount(0);
      setWaiveReason('');
      setWaiveApprover('');
    } catch (err: unknown) {
      setActionError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter charges
  const filteredCharges = charges.filter(c => {
    const learner = learnerMap.get(c.learnerId);
    const learnerName = learner ? `${learner.firstName} ${learner.lastName}` : '';
    const matchesSearch =
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      learnerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.chargeStatus === statusFilter;
    const matchesType = typeFilter === 'all' || c.chargeTypeId === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: ChargeStatus) => {
    switch (status) {
      case 'invoiced':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Invoiced</span>;
      case 'active':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">Active (Uninvoiced)</span>;
      case 'partially_waived':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">Partially Waived</span>;
      case 'waived':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200 text-slate-700 line-through">Waived</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-800">Cancelled</span>;
      case 'draft':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">Draft</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Charges Register</h1>
          <p className="text-sm text-slate-500">
            Create individual or bulk tuition, event, and transport charges before invoicing.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="btn btn-secondary text-sm flex items-center gap-1.5 shadow-xs"
          >
            <Layers className="w-4 h-4" /> Bulk Charge Group
          </button>
          <button
            onClick={() => setShowSingleModal(true)}
            className="btn btn-primary text-sm flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" /> New Single Charge
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by description or learner name..."
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
            <option value="active">Active (Uninvoiced)</option>
            <option value="invoiced">Invoiced</option>
            <option value="waived">Waived</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
          >
            <option value="all">All Charge Types</option>
            {chargeTypes.map(ct => (
              <option key={ct.id} value={ct.id}>{ct.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Charges Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading charges...</div>
        ) : filteredCharges.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No charges found matching the criteria. Click "New Single Charge" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Learner</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Charge Type</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCharges.map(charge => {
                  const learner = learnerMap.get(charge.learnerId);
                  const chargeType = chargeTypeMap.get(charge.chargeTypeId);

                  return (
                    <tr key={charge.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-600">{charge.chargeDate}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {learner ? `${learner.firstName} ${learner.lastName}` : charge.learnerId}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{charge.description}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {chargeType?.name || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">{charge.quantity}</td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {formatMoney(charge.unitAmount, charge.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatMoney(charge.amount, charge.currency)}
                        {charge.waivedAmount ? (
                          <span className="block text-[11px] text-blue-600 font-normal">
                            Waived: -{formatMoney(charge.waivedAmount, charge.currency)}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 px-4 text-center">{getStatusBadge(charge.chargeStatus)}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {charge.chargeStatus === 'active' && (
                          <button
                            onClick={() => {
                              setShowWaiveModal(charge);
                              setWaiveAmount(toMajor(charge.amount));
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Waive
                          </button>
                        )}
                        {charge.chargeStatus === 'active' && (
                          <button
                            onClick={async () => {
                              if (confirm('Are you sure you want to cancel this charge?')) {
                                await chargeService.cancelCharge(organisationId!, charge.id, 'User cancelled', user?.uid || 'system');
                                refresh();
                              }
                            }}
                            className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                          >
                            Cancel
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

      {/* Modal: Single Charge */}
      {showSingleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800">Add Individual Charge</h3>
              <button onClick={() => setShowSingleModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSingleCharge} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                  {actionError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Learner *</label>
                <select
                  value={singleLearnerId}
                  onChange={e => setSingleLearnerId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">-- Choose Learner --</option>
                  {learners.map(l => (
                    <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Charge Type *</label>
                <select
                  value={singleChargeTypeId}
                  onChange={e => handleSelectChargeType(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">-- Choose Charge Type --</option>
                  {chargeTypes.map(ct => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name} {ct.defaultAmount ? `(${formatMoney(ct.defaultAmount)})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description *</label>
                <input
                  type="text"
                  value={singleDescription}
                  onChange={e => setSingleDescription(e.target.value)}
                  required
                  placeholder="e.g. Monthly Tuition Fee - March"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={singleQuantity}
                    onChange={e => setSingleQuantity(parseInt(e.target.value) || 1)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Unit Price (R) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={singleUnitAmount}
                    onChange={e => setSingleUnitAmount(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium">Calculated Charge Amount:</span>
                <span className="font-bold text-slate-900 text-base">
                  {formatMoney(toCents(singleQuantity * singleUnitAmount))}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Due Date (Optional)</label>
                <input
                  type="date"
                  value={singleDueDate}
                  onChange={e => setSingleDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSingleModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Create Charge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Charge */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800">Bulk Charge Group / Event</h3>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBulkCharge} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                  {actionError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Group *</label>
                <select
                  value={bulkGroupId}
                  onChange={e => setBulkGroupId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">-- Choose Programme Group --</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Active learners enrolled: <strong>{targetLearnerIds.length}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Charge Type *</label>
                <select
                  value={bulkChargeTypeId}
                  onChange={e => {
                    setBulkChargeTypeId(e.target.value);
                    const ct = chargeTypeMap.get(e.target.value);
                    if (ct) {
                      if (!bulkDescription) setBulkDescription(ct.name);
                      if (ct.defaultAmount) setBulkUnitAmount(toMajor(ct.defaultAmount));
                    }
                  }}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">-- Choose Charge Type --</option>
                  {chargeTypes.map(ct => (
                    <option key={ct.id} value={ct.id}>{ct.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description *</label>
                <input
                  type="text"
                  value={bulkDescription}
                  onChange={e => setBulkDescription(e.target.value)}
                  required
                  placeholder="e.g. Term 1 Registration & Music Book"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Amount Per Learner (R) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bulkUnitAmount}
                    onChange={e => setBulkUnitAmount(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={bulkDueDate}
                    onChange={e => setBulkDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-900 flex justify-between">
                <span>Expected Total Inflow:</span>
                <strong>{formatMoney(toCents(targetLearnerIds.length * bulkUnitAmount))}</strong>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || targetLearnerIds.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'Creating Charges...' : `Apply Charges to ${targetLearnerIds.length} Learners`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Waive Charge */}
      {showWaiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800">Waive Fee Charge</h3>
              <button onClick={() => setShowWaiveModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWaiveSubmit} className="p-6 space-y-4">
              <div className="text-sm text-slate-600">
                Charge: <strong>{showWaiveModal.description}</strong> ({formatMoney(showWaiveModal.amount)})
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Amount to Waive (R) *</label>
                <input
                  type="number"
                  min="0.01"
                  max={toMajor(showWaiveModal.amount)}
                  step="0.01"
                  value={waiveAmount}
                  onChange={e => setWaiveAmount(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reason for Waiver *</label>
                <textarea
                  value={waiveReason}
                  onChange={e => setWaiveReason(e.target.value)}
                  required
                  placeholder="e.g. Bursary granted, financial hardship approved by board..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm h-20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Authorised Approver *</label>
                <input
                  type="text"
                  value={waiveApprover}
                  onChange={e => setWaiveApprover(e.target.value)}
                  required
                  placeholder="e.g. Programme Director Jane Doe"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWaiveModal(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !waiveReason.trim() || !waiveApprover.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Confirm Waiver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
