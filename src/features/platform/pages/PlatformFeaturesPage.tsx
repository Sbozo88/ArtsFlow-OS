import React, { useEffect, useState, useMemo } from 'react';
import {
  Layers,
  Search,
  RefreshCw,
  AlertTriangle,
  Lock,
  Edit2,
  Plus,
  CheckCircle2,
  XCircle,
  X,
  Check
} from 'lucide-react';
import { platformFeatureService } from '../../../services/platformFeatureService';
import { STANDARD_PLATFORM_FEATURES } from '../../../config/platformFeaturesRegistry';
import { useAuth } from '../../../contexts/AuthContext';
import type { PlatformFeature, FeatureStatus, FeatureCategory, FeatureType } from '../../../types';

export const PlatformFeaturesPage: React.FC = () => {
  const { authUser } = useAuth();
  const [features, setFeatures] = useState<PlatformFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Edit Modal State
  const [editingFeature, setEditingFeature] = useState<PlatformFeature | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    category: 'core' as FeatureCategory,
    featureStatus: 'active' as FeatureStatus,
    defaultEnabled: false
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    key: '',
    name: '',
    description: '',
    category: 'platform' as FeatureCategory,
    featureType: 'boolean' as FeatureType,
    featureStatus: 'active' as FeatureStatus,
    defaultEnabled: false
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const dbFeatures = await platformFeatureService.listFeatures();
      if (dbFeatures.length > 0) {
        setFeatures(dbFeatures);
      } else {
        // Render from standard registry if DB not seeded yet
        const now = new Date().toISOString();
        const registryFeatures: PlatformFeature[] = STANDARD_PLATFORM_FEATURES.map((f) => ({
          id: f.key,
          key: f.key,
          name: f.name,
          description: f.description,
          category: f.category,
          featureType: f.featureType,
          featureStatus: f.featureStatus,
          defaultEnabled: f.defaultEnabled,
          createdAt: now,
          updatedAt: now,
          createdBy: 'system',
          updatedBy: 'system',
          status: 'active'
        }));
        setFeatures(registryFeatures);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load platform features');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    platformFeatureService
      .listFeatures()
      .then((dbFeatures) => {
        if (!isMounted) return;
        if (dbFeatures.length > 0) {
          setFeatures(dbFeatures);
        } else {
          const now = new Date().toISOString();
          const registryFeatures: PlatformFeature[] = STANDARD_PLATFORM_FEATURES.map((f) => ({
            id: f.key,
            key: f.key,
            name: f.name,
            description: f.description,
            category: f.category,
            featureType: f.featureType,
            featureStatus: f.featureStatus,
            defaultEnabled: f.defaultEnabled,
            createdAt: now,
            updatedAt: now,
            createdBy: 'system',
            updatedBy: 'system',
            status: 'active'
          }));
          setFeatures(registryFeatures);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError((err as Error).message || 'Failed to load platform features');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredFeatures = useMemo(() => {
    return features.filter((f) => {
      if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && f.featureStatus !== statusFilter) return false;
      const term = search.trim().toLowerCase();
      if (!term) return true;
      return (
        f.name.toLowerCase().includes(term) ||
        f.key.toLowerCase().includes(term) ||
        f.description.toLowerCase().includes(term)
      );
    });
  }, [features, search, categoryFilter, statusFilter]);

  const handleOpenEdit = (feat: PlatformFeature) => {
    setEditingFeature(feat);
    setEditFormData({
      name: feat.name,
      description: feat.description,
      category: feat.category,
      featureStatus: feat.featureStatus,
      defaultEnabled: feat.defaultEnabled
    });
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeature) return;

    try {
      setEditSubmitting(true);
      setEditError(null);

      await platformFeatureService.updateFeature(
        authUser?.uid || 'super_admin',
        editingFeature.key,
        editFormData
      );

      setEditingFeature(null);
      await handleRefresh();
    } catch (err) {
      setEditError((err as Error).message || 'Failed to update feature');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleCreateFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.key.trim() || !createFormData.name.trim()) {
      setCreateError('Feature Key and Name are required.');
      return;
    }

    try {
      setCreateSubmitting(true);
      setCreateError(null);

      await platformFeatureService.createFeature(authUser?.uid || 'super_admin', {
        key: createFormData.key.trim().toLowerCase(),
        name: createFormData.name.trim(),
        description: createFormData.description.trim(),
        category: createFormData.category,
        featureType: createFormData.featureType,
        featureStatus: createFormData.featureStatus,
        defaultEnabled: createFormData.defaultEnabled
      });

      setIsCreateOpen(false);
      await handleRefresh();
    } catch (err) {
      setCreateError((err as Error).message || 'Failed to register feature');
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" />
            Platform Feature Registry
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global catalog of product capabilities, stable machine keys, and platform-level kill switches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            title="Refresh features"
            aria-label="Refresh features"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Feature
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-red-200 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by feature name, machine key, or description..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="core">Core</option>
            <option value="music">Music</option>
            <option value="dance">Dance</option>
            <option value="events">Events</option>
            <option value="finance">Finance</option>
            <option value="communication">Communication</option>
            <option value="documents">Documents</option>
            <option value="analytics">Analytics</option>
            <option value="automation">Automation</option>
            <option value="staff">Staff</option>
            <option value="portals">Portals</option>
            <option value="integrations">Integrations</option>
            <option value="platform">Platform</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="experimental">Experimental</option>
            <option value="deprecated">Deprecated</option>
            <option value="inactive">Inactive (Kill Switch)</option>
          </select>
        </div>
      </div>

      {/* Features Table */}
      <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/60 border-b border-slate-700/60 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Feature & Machine Key</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Platform Status</th>
                <th className="px-6 py-4">Default</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40 text-slate-300">
              {loading && features.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading platform features...
                  </td>
                </tr>
              ) : filteredFeatures.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No features match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredFeatures.map((feat) => {
                  return (
                    <tr key={feat.key} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{feat.name}</div>
                        <div className="text-xs text-indigo-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <span title="Key is immutable"><Lock className="w-3 h-3 text-slate-500 shrink-0" /></span>
                          <span>{feat.key}</span>
                        </div>
                        {feat.description && (
                          <div className="text-xs text-slate-400 mt-1 line-clamp-1">{feat.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-700 text-slate-300">
                          {feat.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-300 capitalize">{feat.featureType}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            feat.featureStatus === 'active'
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                              : feat.featureStatus === 'experimental'
                              ? 'text-purple-400 bg-purple-500/10 border-purple-500/30'
                              : feat.featureStatus === 'deprecated'
                              ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                              : 'text-red-400 bg-red-500/10 border-red-500/30'
                          }`}
                        >
                          {feat.featureStatus === 'inactive' && <XCircle className="w-3 h-3" />}
                          {feat.featureStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {feat.defaultEnabled ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(feat)}
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs transition-colors"
                          title="Edit Feature"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Feature Modal (Section 39) */}
      {editingFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-indigo-400" />
                  Edit Feature Configuration
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update display metadata, status, or kill-switch for this capability.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingFeature(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Machine Feature Key (Immutable)
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-400 text-xs font-mono">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{editingFeature.key}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value as FeatureCategory })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="core">Core</option>
                    <option value="music">Music</option>
                    <option value="dance">Dance</option>
                    <option value="events">Events</option>
                    <option value="finance">Finance</option>
                    <option value="communication">Communication</option>
                    <option value="documents">Documents</option>
                    <option value="analytics">Analytics</option>
                    <option value="automation">Automation</option>
                    <option value="staff">Staff</option>
                    <option value="portals">Portals</option>
                    <option value="integrations">Integrations</option>
                    <option value="platform">Platform</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Platform Status
                  </label>
                  <select
                    value={editFormData.featureStatus}
                    onChange={(e) => setEditFormData({ ...editFormData, featureStatus: e.target.value as FeatureStatus })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="experimental">Experimental</option>
                    <option value="deprecated">Deprecated</option>
                    <option value="inactive">Inactive (Kill Switch)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="defaultEnabled"
                  checked={editFormData.defaultEnabled}
                  onChange={(e) => setEditFormData({ ...editFormData, defaultEnabled: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="defaultEnabled" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Default Enabled for New Plans
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingFeature(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {editSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Feature Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  Register New Platform Feature
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Define a new product capability with an immutable machine key.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateFeature} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Machine Feature Key * (e.g. music.notation)
                </label>
                <input
                  type="text"
                  required
                  value={createFormData.key}
                  onChange={(e) => setCreateFormData({ ...createFormData, key: e.target.value })}
                  placeholder="module.subfeature"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Feature Name *
                </label>
                <input
                  type="text"
                  required
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  placeholder="e.g. Interactive Music Notation"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                  placeholder="Purpose and capabilities enabled by this feature"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={createFormData.category}
                    onChange={(e) => setCreateFormData({ ...createFormData, category: e.target.value as FeatureCategory })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="core">Core</option>
                    <option value="music">Music</option>
                    <option value="dance">Dance</option>
                    <option value="events">Events</option>
                    <option value="finance">Finance</option>
                    <option value="communication">Communication</option>
                    <option value="documents">Documents</option>
                    <option value="analytics">Analytics</option>
                    <option value="automation">Automation</option>
                    <option value="staff">Staff</option>
                    <option value="portals">Portals</option>
                    <option value="integrations">Integrations</option>
                    <option value="platform">Platform</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Type
                  </label>
                  <select
                    value={createFormData.featureType}
                    onChange={(e) => setCreateFormData({ ...createFormData, featureType: e.target.value as FeatureType })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="boolean">Boolean Toggle</option>
                    <option value="limit">Limit / Quota</option>
                    <option value="configuration">Configuration</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {createSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Register Feature
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
