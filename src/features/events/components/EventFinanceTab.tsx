import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useCharges } from '../../../hooks/useCharges';
import { useChargeTypes } from '../../../hooks/useChargeTypes';
import { useEventParticipants } from '../../../hooks/useEventParticipants';
import { useLearners } from '../../../hooks/useLearners';
import { chargeService } from '../../../services/chargeService';
import { formatMoney, toCents, toMajor } from '../../../lib/money';
import { X, Layers } from 'lucide-react';

interface EventFinanceTabProps {
  eventId: string;
}

export const EventFinanceTab: React.FC<EventFinanceTabProps> = ({ eventId }) => {
  const { organisationId, user } = useAuth();
  const { charges, loading, refresh } = useCharges({ eventId });
  const { chargeTypes } = useChargeTypes();
  const { participants } = useEventParticipants(eventId);
  const { learners } = useLearners();

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedChargeTypeId, setSelectedChargeTypeId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const learnerMap = new Map(learners.map(l => [l.id, l]));
  const chargeTypeMap = new Map(chargeTypes.map(ct => [ct.id, ct]));

  // Confirmed / active participants
  const confirmedParticipants = participants.filter(p => p.participationStatus === 'confirmed' || p.participationStatus === 'attended');
  const targetLearnerIds = confirmedParticipants.map(p => p.learnerId);

  const totalEventCharges = charges.filter(c => c.chargeStatus !== 'cancelled').reduce((sum, c) => sum + c.amount, 0);

  const handleCreateBulkCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !selectedChargeTypeId || targetLearnerIds.length === 0) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await chargeService.createBulkCharges(
        organisationId,
        {
          learnerIds: targetLearnerIds,
          chargeTypeId: selectedChargeTypeId,
          description: description || 'Event Participation Fee',
          quantity: 1,
          unitAmount: toCents(amount),
          chargeDate: today,
          dueDate: dueDate || undefined,
          eventId
        },
        user?.uid || 'system'
      );

      await refresh();
      alert(`Charges generated: ${res.created.length} created, ${res.skipped} skipped.`);
      setShowBulkModal(false);
      setDescription('');
      setAmount(0);
    } catch (err: unknown) {
      setActionError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & KPI Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Event Financials</h3>
          <p className="text-xs text-slate-500">
            Participation fees, charges, and payment tracking for this event.
          </p>
        </div>
        <button
          onClick={() => setShowBulkModal(true)}
          className="btn btn-primary text-sm flex items-center gap-1.5 shadow-xs"
        >
          <Layers className="w-4 h-4" /> Charge All Confirmed Participants
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase">Confirmed Participants</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{confirmedParticipants.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Eligible for participation charge</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Event Charges</span>
          <p className="text-2xl font-black text-indigo-700 mt-1">{formatMoney(totalEventCharges)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{charges.length} line items generated</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase">Invoiced Status</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {charges.filter(c => c.chargeStatus === 'invoiced').length} / {charges.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Linked to official invoices</p>
        </div>
      </div>

      {/* Charges Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-100 font-semibold text-xs text-slate-700 uppercase">
          Event Charges List
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading event charges...</div>
        ) : charges.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No event charges have been created yet. Click "Charge All Confirmed Participants" to generate fees.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Learner</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Charge Type</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {charges.map(c => {
                  const learner = learnerMap.get(c.learnerId);
                  const ct = chargeTypeMap.get(c.chargeTypeId);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-600">{c.chargeDate}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {learner ? `${learner.firstName} ${learner.lastName}` : c.learnerId}
                      </td>
                      <td className="py-2 px-3 text-slate-700">{c.description}</td>
                      <td className="py-2 px-3 text-slate-500">{ct?.name || 'Event Fee'}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {formatMoney(c.amount, c.currency)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          c.chargeStatus === 'invoiced' ? 'bg-blue-100 text-blue-800' :
                          c.chargeStatus === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {c.chargeStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Bulk Participant Charge */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800">Charge All Confirmed Participants</h3>
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

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-900">
                Total eligible participants: <strong>{targetLearnerIds.length}</strong>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Charge Type *</label>
                <select
                  value={selectedChargeTypeId}
                  onChange={e => {
                    setSelectedChargeTypeId(e.target.value);
                    const ct = chargeTypeMap.get(e.target.value);
                    if (ct) {
                      if (!description) setDescription(ct.name);
                      if (ct.defaultAmount) setAmount(toMajor(ct.defaultAmount));
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
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  placeholder="e.g. Festival Registration & Entry Fee"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Amount Per Person (R) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
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
                  {actionLoading ? 'Creating...' : `Apply Charges (${targetLearnerIds.length})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
