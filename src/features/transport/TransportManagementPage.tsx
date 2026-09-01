import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTransportVehicles } from '../../hooks/useTransportVehicles';
import { useTransportProviders } from '../../hooks/useTransportProviders';
import { transportVehicleService } from '../../services/transportVehicleService';
import { transportProviderService } from '../../services/transportProviderService';
import { VehicleType, VehicleStatus, TransportVehicle, TransportProvider } from '../../types';
import { 
  Bus, 
  Building2, 
  Plus, 
  Phone, 
  Mail, 
  Trash2, 
  Edit3
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const TransportManagementPage: React.FC = () => {
  const { organisationId, user } = useAuth();
  const { vehicles, loading: vehiclesLoading, refresh: refreshVehicles } = useTransportVehicles();
  const { providers, loading: providersLoading, refresh: refreshProviders } = useTransportProviders();

  const [activeTab, setActiveTab] = useState<'vehicles' | 'providers'>('vehicles');

  // Vehicle Modal State
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<TransportVehicle | null>(null);
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('bus');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [capacity, setCapacity] = useState<number>(35);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [vehicleStatus, setVehicleStatus] = useState<VehicleStatus>('available');

  // Provider Modal State
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<TransportProvider | null>(null);
  const [providerName, setProviderName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  const providerMap = new Map(providers.map(p => [p.id, p]));

  // Open Vehicle Modal
  const handleOpenVehicleModal = (v?: TransportVehicle) => {
    if (v) {
      setEditingVehicle(v);
      setVehicleName(v.vehicleName);
      setVehicleType(v.vehicleType);
      setRegistrationNumber(v.registrationNumber || '');
      setCapacity(v.capacity);
      setDriverName(v.driverName || '');
      setDriverPhone(v.driverPhone || '');
      setSelectedProviderId(v.providerId || '');
      setVehicleStatus(v.vehicleStatus);
    } else {
      setEditingVehicle(null);
      setVehicleName('');
      setVehicleType('bus');
      setRegistrationNumber('');
      setCapacity(35);
      setDriverName('');
      setDriverPhone('');
      setSelectedProviderId('');
      setVehicleStatus('available');
    }
    setShowVehicleModal(true);
  };

  // Open Provider Modal
  const handleOpenProviderModal = (p?: TransportProvider) => {
    if (p) {
      setEditingProvider(p);
      setProviderName(p.name);
      setContactPerson(p.contactPerson || '');
      setPhone(p.phone || '');
      setEmail(p.email || '');
      setAddress(p.address || '');
      setNotes(p.notes || '');
    } else {
      setEditingProvider(null);
      setProviderName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNotes('');
    }
    setShowProviderModal(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !user || !vehicleName || capacity <= 0) return;

    setActionLoading(true);
    try {
      if (editingVehicle) {
        await transportVehicleService.updateVehicle(organisationId, editingVehicle.id, {
          vehicleName,
          vehicleType,
          registrationNumber: registrationNumber || undefined,
          capacity: Number(capacity),
          driverName: driverName || undefined,
          driverPhone: driverPhone || undefined,
          providerId: selectedProviderId || undefined,
          vehicleStatus
        }, user.uid);
      } else {
        await transportVehicleService.createVehicle(organisationId, {
          vehicleName,
          vehicleType,
          registrationNumber: registrationNumber || undefined,
          capacity: Number(capacity),
          driverName: driverName || undefined,
          driverPhone: driverPhone || undefined,
          providerId: selectedProviderId || undefined,
          vehicleStatus
        }, user.uid);
      }

      refreshVehicles();
      setShowVehicleModal(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error saving vehicle');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !user || !providerName) return;

    setActionLoading(true);
    try {
      if (editingProvider) {
        await transportProviderService.updateProvider(organisationId, editingProvider.id, {
          name: providerName,
          contactPerson: contactPerson || undefined,
          phone: phone || undefined,
          email: email || undefined,
          address: address || undefined,
          notes: notes || undefined
        }, user.uid);
      } else {
        await transportProviderService.createProvider(organisationId, {
          name: providerName,
          contactPerson: contactPerson || undefined,
          phone: phone || undefined,
          email: email || undefined,
          address: address || undefined,
          notes: notes || undefined,
          providerStatus: 'active'
        }, user.uid);
      }

      refreshProviders();
      setShowProviderModal(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error saving provider');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!organisationId || !user) return;
    if (!confirm('Are you sure you want to remove this vehicle?')) return;
    try {
      await transportVehicleService.deleteVehicle(organisationId, id, user.uid);
      refreshVehicles();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting vehicle');
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!organisationId || !user) return;
    if (!confirm('Are you sure you want to remove this transport provider?')) return;
    try {
      await transportProviderService.deleteProvider(organisationId, id, user.uid);
      refreshProviders();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting provider');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Bus className="w-7 h-7 text-indigo-600" /> Transport Fleet & Providers
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage transport vehicles, capacity specifications, contracted bus companies, and travel operators.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/transport/reports"
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md shadow-sm transition"
          >
            Transport Reports
          </Link>
          <button
            onClick={() => (activeTab === 'vehicles' ? handleOpenVehicleModal() : handleOpenProviderModal())}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> {activeTab === 'vehicles' ? 'Add Vehicle' : 'Add Provider'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`py-3 px-1 border-b-2 font-semibold flex items-center gap-2 ${
              activeTab === 'vehicles'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Bus className="w-4 h-4" /> Vehicles Fleet ({vehicles.length})
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`py-3 px-1 border-b-2 font-semibold flex items-center gap-2 ${
              activeTab === 'providers'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" /> Transport Providers ({providers.length})
          </button>
        </nav>
      </div>

      {/* Tab: Vehicles */}
      {activeTab === 'vehicles' && (
        <div>
          {vehiclesLoading ? (
            <div className="p-8 text-center text-slate-400">Loading vehicles...</div>
          ) : vehicles.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
              <Bus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No Vehicles Registered</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Add buses, minibuses, or school vans with seat capacities to plan event transport.
              </p>
              <button
                onClick={() => handleOpenVehicleModal()}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-sm"
              >
                Add First Vehicle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {vehicles.map(v => {
                const prov = v.providerId ? providerMap.get(v.providerId) : null;
                return (
                  <div key={v.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                          {v.vehicleType.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {v.vehicleStatus}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-2">{v.vehicleName}</h3>
                      {v.registrationNumber && (
                        <p className="text-xs font-mono text-slate-500">Reg: {v.registrationNumber}</p>
                      )}

                      <div className="mt-3 bg-slate-50 p-3 rounded-lg space-y-1 text-xs text-slate-600">
                        <p className="flex justify-between">
                          <span>Seating Capacity:</span>
                          <strong className="text-slate-900 text-sm font-bold">{v.capacity} seats</strong>
                        </p>
                        {prov && (
                          <p className="flex justify-between">
                            <span>Provider:</span>
                            <span className="font-medium text-slate-800">{prov.name}</span>
                          </p>
                        )}
                        {v.driverName && (
                          <p className="flex justify-between">
                            <span>Driver:</span>
                            <span className="font-medium text-slate-800">
                              {v.driverName} {v.driverPhone ? `(${v.driverPhone})` : ''}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenVehicleModal(v)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-50"
                        title="Edit Vehicle"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(v.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-50"
                        title="Delete Vehicle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Providers */}
      {activeTab === 'providers' && (
        <div>
          {providersLoading ? (
            <div className="p-8 text-center text-slate-400">Loading providers...</div>
          ) : providers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No Transport Providers Added</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Maintain directory contacts for external bus hire companies and logistics partners.
              </p>
              <button
                onClick={() => handleOpenProviderModal()}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-sm"
              >
                Add First Provider
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {providers.map(p => (
                <div key={p.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                    {p.contactPerson && (
                      <p className="text-xs text-slate-600 font-medium">Contact: {p.contactPerson}</p>
                    )}

                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                      {p.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.phone}</span>
                        </p>
                      )}
                      {p.email && (
                        <p className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.email}</span>
                        </p>
                      )}
                      {p.address && (
                        <p className="text-[11px] text-slate-500">{p.address}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenProviderModal(p)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-50"
                      title="Edit Provider"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProvider(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-50"
                      title="Delete Provider"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Vehicle */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">
              {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
            </h3>

            <form onSubmit={handleSaveVehicle} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Vehicle Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scania Luxury Coach 1"
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Vehicle Type *</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                    className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  >
                    <option value="bus">Bus</option>
                    <option value="minibus">Minibus</option>
                    <option value="taxi">Taxi</option>
                    <option value="school_vehicle">School Vehicle</option>
                    <option value="private_vehicle">Private Vehicle</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Seat Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Reg Number</label>
                  <input
                    type="text"
                    placeholder="e.g. CA 123-456"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={vehicleStatus}
                    onChange={(e) => setVehicleStatus(e.target.value as VehicleStatus)}
                    className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  >
                    <option value="available">Available</option>
                    <option value="booked">Booked</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Transport Provider (Optional)</label>
                <select
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                  className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                >
                  <option value="">-- In-house / None --</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Driver Name</label>
                  <input
                    type="text"
                    placeholder="Driver's name"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Driver Phone</label>
                  <input
                    type="text"
                    placeholder="Driver contact"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded"
                >
                  {actionLoading ? 'Saving...' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Provider */}
      {showProviderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {editingProvider ? 'Edit Transport Provider' : 'Add Transport Provider'}
            </h3>

            <form onSubmit={handleSaveProvider} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Provider Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. City Coaches Logistics"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Sipho Ndlovu"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="011 555 1234"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="info@citycoaches.co.za"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Physical Address</label>
                <input
                  type="text"
                  placeholder="Depot address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Operating notes, contractual agreements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowProviderModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded"
                >
                  {actionLoading ? 'Saving...' : 'Save Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
