import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChargeTypes } from '../../hooks/useChargeTypes';
import { chargeTypeService } from '../../services/chargeTypeService';
import { formatMoney, toCents, toMajor } from '../../lib/money';
import { ChargeType, ChargeTypeCategory } from '../../types';
import { Plus, Edit2, Archive, X } from 'lucide-react';

const CATEGORIES: ChargeTypeCategory[] = [
  'programme',
  'tuition',
  'registration',
  'event',
  'transport',
  'instrument',
  'costume',
  'workshop',
  'competition',
  'camp',
  'other'
];

export const ChargeTypesPage: React.FC = () => {
  const { organisationId, user } = useAuth();
  const { chargeTypes, loading, refresh } = useChargeTypes();

  const [showModal, setShowModal] = useState(false);
  const [editingChargeType, setEditingChargeType] = useState<ChargeType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ChargeTypeCategory>('tuition');
  const [defaultAmount, setDefaultAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('ZAR');

  const openCreateModal = () => {
    setEditingChargeType(null);
    setName('');
    setCategory('tuition');
    setDefaultAmount(0);
    setDescription('');
    setCurrency('ZAR');
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (ct: ChargeType) => {
    setEditingChargeType(ct);
    setName(ct.name);
    setCategory(ct.category);
    setDefaultAmount(toMajor(ct.defaultAmount || 0));
    setDescription(ct.description || '');
    setCurrency(ct.currency || 'ZAR');
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !name.trim()) return;

    setActionLoading(true);
    setError(null);
    try {
      const amountCents = defaultAmount > 0 ? toCents(defaultAmount) : undefined;

      if (editingChargeType) {
        await chargeTypeService.updateChargeType(
          organisationId,
          editingChargeType.id,
          {
            name: name.trim(),
            category,
            defaultAmount: amountCents,
            description: description.trim() || undefined,
            currency
          },
          user?.uid || 'system'
        );
      } else {
        await chargeTypeService.createChargeType(
          organisationId,
          {
            name: name.trim(),
            category,
            defaultAmount: amountCents,
            description: description.trim() || undefined,
            currency,
            chargeTypeStatus: 'active'
          },
          user?.uid || 'system'
        );
      }

      await refresh();
      setShowModal(false);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!organisationId) return;
    if (!confirm('Are you sure you want to archive this charge type?')) return;

    try {
      await chargeTypeService.archiveChargeType(organisationId, id, user?.uid || 'system');
      await refresh();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Charge Types</h1>
          <p className="text-sm text-slate-500">
            Define fee items, standardized rates, and categories for your organization.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn btn-primary text-sm flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" /> New Charge Type
        </button>
      </div>

      {/* Charge Types Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading charge types...</div>
      ) : chargeTypes.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400">
          No charge types defined yet. Click "New Charge Type" to create tuition, registration, or transport categories.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chargeTypes.map(ct => (
            <div
              key={ct.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    {ct.category}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    ct.chargeTypeStatus === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {ct.chargeTypeStatus}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900">{ct.name}</h3>
                {ct.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ct.description}</p>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Standard Rate:</span>
                  <span className="text-lg font-extrabold text-slate-800">
                    {ct.defaultAmount ? formatMoney(ct.defaultAmount, ct.currency) : 'Variable'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  onClick={() => openEditModal(ct)}
                  className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded font-medium flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                {ct.chargeTypeStatus !== 'archived' && (
                  <button
                    onClick={() => handleArchive(ct.id)}
                    className="px-2.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded font-medium flex items-center gap-1"
                  >
                    <Archive className="w-3.5 h-3.5" /> Archive
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create/Edit Charge Type */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800">
                {editingChargeType ? 'Edit Charge Type' : 'Create New Charge Type'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Charge Type Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="e.g. Annual Tuition Fee"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ChargeTypeCategory)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm capitalize"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Default Amount (R)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={defaultAmount}
                    onChange={e => setDefaultAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Currency</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={e => setCurrency(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Additional context or notes..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm h-16"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !name.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : editingChargeType ? 'Save Changes' : 'Create Charge Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
