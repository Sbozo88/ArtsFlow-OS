import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useEventTransportPlans } from '../../../hooks/useEventTransportPlans';
import { useTransportPassengers } from '../../../hooks/useTransportPassengers';
import { useTransportVehicles } from '../../../hooks/useTransportVehicles';
import { useEventParticipants } from '../../../hooks/useEventParticipants';
import { useLearners } from '../../../hooks/useLearners';
import { useStaff } from '../../../hooks/useStaff';
import { useConsentSubmissions } from '../../../hooks/useConsentSubmissions';
import { eventTransportPlanService } from '../../../services/eventTransportPlanService';
import { transportPassengerService } from '../../../services/transportPassengerService';
import type { TransportPassenger } from '../../../types';
import { 
  Bus, 
  Plus, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Printer, 
  UserCheck, 
  UserX, 
  Trash2, 
  Navigation 
} from 'lucide-react';

interface EventTransportTabProps {
  eventId: string;
}

export const EventTransportTab: React.FC<EventTransportTabProps> = ({ eventId }) => {
  const { organisationId, user } = useAuth();
  const { plans, refresh: refreshPlans } = useEventTransportPlans(eventId);
  const { vehicles } = useTransportVehicles();
  const { participants } = useEventParticipants(eventId);
  const { learners } = useLearners();
  const { staff } = useStaff();
  const { submissions } = useConsentSubmissions(eventId);

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const activePlanId = selectedPlanId || (plans.length > 0 ? plans[0].id : null);
  const activePlan = plans.find(p => p.id === activePlanId) || null;

  const { passengers, refresh: refreshPassengers } = useTransportPassengers(activePlanId || undefined);

  // Modals state
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [showAssignPassengerModal, setShowAssignPassengerModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // New plan form state
  const [planName, setPlanName] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [customCapacity, setCustomCapacity] = useState(50);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');

  // Assign passenger state
  const [assignType, setAssignType] = useState<'learner' | 'staff'>('learner');
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [allowConsentOverride, setAllowConsentOverride] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const learnerMap = new Map(learners.map(l => [l.id, l]));
  const staffMap = new Map(staff.map(s => [s.id, s]));
  const vehicleMap = new Map(vehicles.map(v => [v.id, v]));

  // Capacity calculations
  const totalPassengers = passengers.length;
  const capacity = activePlan?.vehicleCapacity || 0;
  const remainingSeats = capacity - totalPassengers;
  const isOverCapacity = totalPassengers > capacity;

  // Boarding & Return counts
  const boardedCount = passengers.filter(p => p.boardingStatus === 'boarded').length;
  const absentCount = passengers.filter(p => p.boardingStatus === 'absent').length;
  const returnedCount = passengers.filter(p => p.returnStatus === 'returned').length;

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !user || !planName || !pickupLocation || !destination || !departureDate || !departureTime) {
      alert('Please complete all required fields.');
      return;
    }

    setActionLoading(true);
    try {
      const selectedVehicle = selectedVehicleId ? vehicleMap.get(selectedVehicleId) : null;
      const effectiveCapacity = selectedVehicle ? selectedVehicle.capacity : Number(customCapacity);

      const newPlan = await eventTransportPlanService.createTransportPlan(organisationId, {
        eventId,
        planName,
        pickupLocation,
        destination,
        departureDate,
        departureTime,
        returnDate: returnDate || undefined,
        returnTime: returnTime || undefined,
        meetingTime: meetingTime || undefined,
        vehicleId: selectedVehicleId || undefined,
        providerId: selectedProviderId || (selectedVehicle?.providerId || undefined),
        vehicleCapacity: effectiveCapacity,
        driverName: driverName || selectedVehicle?.driverName,
        driverPhone: driverPhone || selectedVehicle?.driverPhone,
        transportStatus: 'planned'
      }, user.uid);

      refreshPlans();
      setSelectedPlanId(newPlan.id);
      setShowCreatePlanModal(false);
      // Reset form
      setPlanName('');
      setPickupLocation('');
      setDestination('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error creating plan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignPassenger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !user || !activePlanId) return;
    setAssignError(null);

    try {
      if (assignType === 'learner') {
        if (!selectedLearnerId) {
          setAssignError('Please select a learner.');
          return;
        }

        await transportPassengerService.addPassenger(
          organisationId,
          {
            eventTransportPlanId: activePlanId,
            eventId,
            passengerType: 'learner',
            learnerId: selectedLearnerId,
            boardingStatus: 'planned',
            returnStatus: 'pending',
            seatNumber: seatNumber || undefined
          },
          user.uid,
          allowConsentOverride
        );
      } else {
        if (!selectedStaffId) {
          setAssignError('Please select a staff member.');
          return;
        }

        await transportPassengerService.addPassenger(
          organisationId,
          {
            eventTransportPlanId: activePlanId,
            eventId,
            passengerType: 'staff',
            staffId: selectedStaffId,
            boardingStatus: 'planned',
            returnStatus: 'pending',
            seatNumber: seatNumber || undefined
          },
          user.uid
        );
      }

      refreshPassengers();
      setShowAssignPassengerModal(false);
      setSelectedLearnerId('');
      setSelectedStaffId('');
      setSeatNumber('');
      setAllowConsentOverride(false);
    } catch (err: unknown) {
      setAssignError(err instanceof Error ? err.message : 'Failed to assign passenger');
    }
  };

  const handleRemovePassenger = async (passengerId: string) => {
    if (!organisationId || !user) return;
    if (!confirm('Remove this passenger from the transport manifest?')) return;
    try {
      await transportPassengerService.removePassenger(organisationId, passengerId, user.uid);
      refreshPassengers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error removing passenger');
    }
  };

  const handleMarkBoarded = async (p: TransportPassenger) => {
    if (!organisationId || !user) return;
    try {
      await transportPassengerService.markBoarded(organisationId, p.id, user.uid);
      refreshPassengers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleMarkAbsent = async (p: TransportPassenger) => {
    if (!organisationId || !user) return;
    const reason = prompt('Reason for absence (optional):') || undefined;
    try {
      await transportPassengerService.markAbsent(organisationId, p.id, user.uid, reason);
      refreshPassengers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleMarkReturned = async (p: TransportPassenger) => {
    if (!organisationId || !user) return;
    try {
      await transportPassengerService.markReturned(organisationId, p.id, user.uid);
      refreshPassengers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleConfirmDeparture = async () => {
    if (!organisationId || !user || !activePlan) return;
    if (!confirm('Confirm departure for this transport plan?')) return;
    try {
      await eventTransportPlanService.confirmDeparture(organisationId, activePlan.id, user.uid);
      refreshPlans();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleConfirmReturn = async () => {
    if (!organisationId || !user || !activePlan) return;
    if (!confirm('Confirm return and complete transport for this plan?')) return;
    try {
      await eventTransportPlanService.confirmReturn(organisationId, activePlan.id, user.uid);
      refreshPlans();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  // Check consent status helper
  const getConsentBadge = (learnerId?: string) => {
    if (!learnerId) return null;
    const sub = submissions.find(
      s => s.learnerId === learnerId && s.submissionStatus !== 'superseded'
    );
    if (sub?.participationApproved && sub?.transportApproved) {
      return <span className="text-emerald-600 font-semibold text-xs">Consent Approved ✓</span>;
    }
    if (sub && !sub.transportApproved) {
      return <span className="text-rose-600 font-semibold text-xs">Transport Declined ✗</span>;
    }
    return <span className="text-amber-600 font-semibold text-xs">Missing Consent !</span>;
  };

  return (
    <div className="space-y-6">
      {/* Plans Navigation & Creation */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Bus className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-semibold text-slate-800">Transport Plans</h3>
          {plans.length > 0 && (
            <select
              value={activePlanId || ''}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="text-sm font-medium border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              {plans.map(p => (
                <option key={p.id} value={p.id}>
                  {p.planName} ({p.transportStatus})
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={() => setShowCreatePlanModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Create Transport Plan
        </button>
      </div>

      {activePlan ? (
        <>
          {/* Plan Details & Capacity Banner */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{activePlan.planName}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Route: <span className="font-semibold text-slate-700">{activePlan.pickupLocation}</span> ➔{' '}
                  <span className="font-semibold text-slate-700">{activePlan.destination}</span>
                </p>
                <p className="text-xs text-slate-500">
                  Departure: {new Date(activePlan.departureDate).toLocaleDateString()} at {activePlan.departureTime}
                  {activePlan.returnDate && ` • Return: ${new Date(activePlan.returnDate).toLocaleDateString()} at ${activePlan.returnTime || ''}`}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  activePlan.transportStatus === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                  activePlan.transportStatus === 'departed' ? 'bg-blue-100 text-blue-800' :
                  activePlan.transportStatus === 'confirmed' ? 'bg-indigo-100 text-indigo-800' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {activePlan.transportStatus}
                </span>

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 px-3 py-1 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded text-xs font-medium"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Manifest
                </button>
              </div>
            </div>

            {/* Capacity Counter */}
            <div className={`p-4 rounded-lg border ${
              isOverCapacity 
                ? 'bg-rose-50 border-rose-300 text-rose-800' 
                : remainingSeats <= 5 
                ? 'bg-amber-50 border-amber-300 text-amber-900' 
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {isOverCapacity && <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />}
                    <h4 className="text-sm font-bold">
                      {isOverCapacity ? 'OVER CAPACITY!' : 'Vehicle Capacity & Seating'}
                    </h4>
                  </div>
                  <p className="text-xs">
                    Passengers Assigned: <span className="font-semibold">{totalPassengers}</span> (Learners: {passengers.filter(p => p.passengerType === 'learner').length}, Staff: {passengers.filter(p => p.passengerType === 'staff').length})
                    {' '}• Vehicle Capacity: <span className="font-semibold">{capacity}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase font-semibold text-slate-500 block">Remaining Seats</span>
                  <span className={`text-2xl font-extrabold ${isOverCapacity ? 'text-rose-600' : 'text-slate-900'}`}>
                    {remainingSeats}
                  </span>
                </div>
              </div>
            </div>

            {/* Operational Action Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAssignPassengerModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-sm transition"
                >
                  <Users className="w-4 h-4" /> Assign Passenger
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {activePlan.transportStatus !== 'departed' && activePlan.transportStatus !== 'completed' && (
                  <button
                    onClick={handleConfirmDeparture}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Confirm Departure
                  </button>
                )}

                {activePlan.transportStatus === 'departed' && (
                  <button
                    onClick={handleConfirmReturn}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Return
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Departure & Return Counts Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
              <span className="text-xs text-slate-500 uppercase font-semibold">Total Assigned</span>
              <p className="text-xl font-bold text-slate-800 mt-1">{totalPassengers}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center">
              <span className="text-xs text-emerald-700 uppercase font-semibold">Boarded (Departure)</span>
              <p className="text-xl font-bold text-emerald-800 mt-1">{boardedCount}</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-center">
              <span className="text-xs text-rose-700 uppercase font-semibold">Absent</span>
              <p className="text-xl font-bold text-rose-800 mt-1">{absentCount}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">
              <span className="text-xs text-blue-700 uppercase font-semibold">Returned</span>
              <p className="text-xl font-bold text-blue-800 mt-1">{returnedCount}</p>
            </div>
          </div>

          {/* Passenger Manifest Table (Print-Friendly) */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden printable-manifest">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" /> Passenger Manifest ({passengers.length})
              </h3>
              <p className="text-xs text-slate-500">
                Driver: {activePlan.driverName || 'N/A'} • {activePlan.driverPhone || 'No contact'}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold">
                  <tr>
                    <th className="py-3 px-4 text-left">Passenger</th>
                    <th className="py-3 px-4 text-left">Type</th>
                    <th className="py-3 px-4 text-left">Consent Status</th>
                    <th className="py-3 px-4 text-center">Seat</th>
                    <th className="py-3 px-4 text-center">Departure Boarding</th>
                    <th className="py-3 px-4 text-center">Return Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {passengers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                        No passengers have been assigned to this transport plan yet.
                      </td>
                    </tr>
                  ) : (
                    passengers.map(p => {
                      const learner = p.learnerId ? learnerMap.get(p.learnerId) : null;
                      const staffMember = p.staffId ? staffMap.get(p.staffId) : null;
                      const name = learner 
                        ? `${learner.firstName} ${learner.lastName}` 
                        : staffMember 
                        ? `${staffMember.firstName} ${staffMember.lastName} (Staff)`
                        : 'Unknown';

                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {name}
                          </td>
                          <td className="py-3 px-4 text-xs capitalize text-slate-600">
                            {p.passengerType}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {p.passengerType === 'learner' ? getConsentBadge(p.learnerId) : <span className="text-slate-400">N/A</span>}
                          </td>
                          <td className="py-3 px-4 text-center text-xs font-mono">
                            {p.seatNumber || '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              p.boardingStatus === 'boarded' ? 'bg-emerald-100 text-emerald-800' :
                              p.boardingStatus === 'absent' ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {p.boardingStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              p.returnStatus === 'returned' ? 'bg-emerald-100 text-emerald-800' :
                              p.returnStatus === 'boarded' ? 'bg-blue-100 text-blue-800' :
                              p.returnStatus === 'not_returning' ? 'bg-slate-200 text-slate-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {p.returnStatus || 'pending'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5">
                            {/* Departure boarding quick actions */}
                            <button
                              onClick={() => handleMarkBoarded(p)}
                              title="Mark Boarded"
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMarkAbsent(p)}
                              title="Mark Absent"
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                            {/* Return boarding quick action */}
                            <button
                              onClick={() => handleMarkReturned(p)}
                              title="Mark Returned"
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemovePassenger(p.id)}
                              title="Remove from Manifest"
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
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
        </>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <Bus className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-base font-semibold text-slate-700">No Transport Plans Configured</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Organise travel for learners and staff attending this event by creating your first transport plan.
          </p>
          <button
            onClick={() => setShowCreatePlanModal(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Create Transport Plan
          </button>
        </div>
      )}

      {/* Modal: Create Transport Plan */}
      {showCreatePlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">New Event Transport Plan</h3>
            <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Choir Main Bus 1"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Select Vehicle (Optional)</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => {
                    setSelectedVehicleId(e.target.value);
                    const v = vehicleMap.get(e.target.value);
                    if (v) {
                      setCustomCapacity(v.capacity);
                      if (v.providerId) setSelectedProviderId(v.providerId);
                      if (v.driverName) setDriverName(v.driverName);
                      if (v.driverPhone) setDriverPhone(v.driverPhone);
                    }
                  }}
                  className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                >
                  <option value="">-- Manual / Other Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleName} ({v.capacity} seats • {v.vehicleType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Pickup Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="School Main Gate"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Destination *</label>
                  <input
                    type="text"
                    required
                    placeholder="Concert Hall"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Departure Date *</label>
                  <input
                    type="date"
                    required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Departure Time *</label>
                  <input
                    type="time"
                    required
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Return Date</label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Return Time</label>
                  <input
                    type="time"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Seat Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={customCapacity}
                    onChange={(e) => setCustomCapacity(Number(e.target.value))}
                    className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Meeting Time</label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Driver Phone</label>
                  <input
                    type="text"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreatePlanModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded"
                >
                  {actionLoading ? 'Creating...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Passenger */}
      {showAssignPassengerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Assign Passenger to Manifest</h3>

            <div className="flex space-x-2 border-b pb-2">
              <button
                type="button"
                onClick={() => setAssignType('learner')}
                className={`text-xs px-3 py-1 rounded font-semibold ${
                  assignType === 'learner' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Learner
              </button>
              <button
                type="button"
                onClick={() => setAssignType('staff')}
                className={`text-xs px-3 py-1 rounded font-semibold ${
                  assignType === 'staff' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Staff Supervisor
              </button>
            </div>

            {assignError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded">
                {assignError}
              </div>
            )}

            <form onSubmit={handleAssignPassenger} className="space-y-3 text-xs">
              {assignType === 'learner' ? (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Select Event Learner *</label>
                  <select
                    value={selectedLearnerId}
                    onChange={(e) => setSelectedLearnerId(e.target.value)}
                    className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                    required
                  >
                    <option value="">-- Choose Learner --</option>
                    {participants.map(p => {
                      const l = learnerMap.get(p.learnerId);
                      const sub = submissions.find(
                        s => s.learnerId === p.learnerId && s.submissionStatus !== 'superseded'
                      );
                      const hasConsent = sub?.participationApproved && sub?.transportApproved;
                      return (
                        <option key={p.id} value={p.learnerId}>
                          {l ? `${l.firstName} ${l.lastName}` : p.learnerId} {hasConsent ? '(Consent ✓)' : '(No Transport Consent)'}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Select Staff Member *</label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                    required
                  >
                    <option value="">-- Choose Staff --</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Seat Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 12A"
                  value={seatNumber}
                  onChange={(e) => setSeatNumber(e.target.value)}
                  className="w-full border-slate-300 rounded px-2.5 py-1.5 text-xs"
                />
              </div>

              {assignType === 'learner' && (
                <div className="pt-2">
                  <label className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowConsentOverride}
                      onChange={(e) => setAllowConsentOverride(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                    />
                    <span className="text-[11px] text-slate-600">
                      <strong>Admin Override:</strong> Assign learner even if approved transport consent has not been recorded (logged in audit trail).
                    </span>
                  </label>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAssignPassengerModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded"
                >
                  Assign to Manifest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
