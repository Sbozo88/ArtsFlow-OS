import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { operationalAlertService } from '../services/analytics/operationalAlertService';
import type { OperationalAlert, FollowUp } from '../types';

export function useOperationalAlerts() {
  const { organisationId, authUser, user } = useAuth();
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actorId = authUser?.uid || user?.uid || 'system';

  useEffect(() => {
    let mounted = true;
    if (!organisationId) return;

    const fetchAlerts = async () => {
      try {
        const res = await operationalAlertService.getActiveAlerts(organisationId);
        if (mounted) {
          setAlerts(res);
          setError(null);
        }
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to fetch operational alerts');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAlerts();
    return () => { mounted = false; };
  }, [organisationId]);

  const refresh = async () => {
    if (!organisationId) return;
    setLoading(true);
    try {
      const res = await operationalAlertService.getActiveAlerts(organisationId);
      setAlerts(res);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch operational alerts');
    } finally {
      setLoading(false);
    }
  };

  const scanNow = async () => {
    if (!organisationId) return;
    setScanning(true);
    try {
      const res = await operationalAlertService.scanAndSyncAlerts(organisationId, actorId);
      setAlerts(res.filter(a => a.alertStatus === 'active' || a.alertStatus === 'acknowledged'));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Alert scan failed');
    } finally {
      setScanning(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    if (!organisationId) return;
    await operationalAlertService.acknowledgeAlert(organisationId, alertId, actorId);
    await refresh();
  };

  const dismissAlert = async (alertId: string) => {
    if (!organisationId) return;
    await operationalAlertService.dismissAlert(organisationId, alertId, actorId);
    await refresh();
  };

  const resolveAlert = async (alertId: string) => {
    if (!organisationId) return;
    await operationalAlertService.resolveAlert(organisationId, alertId, actorId);
    await refresh();
  };

  const createFollowUp = async (
    alertId: string,
    options?: { assignedStaffId?: string; dueDate?: string; priority?: 'low' | 'normal' | 'high' | 'urgent' }
  ): Promise<FollowUp> => {
    if (!organisationId) throw new Error('No active organisation');
    const fu = await operationalAlertService.createFollowUpFromAlert(organisationId, alertId, actorId, options);
    await refresh();
    return fu;
  };

  return {
    alerts,
    loading,
    scanning,
    error,
    scanNow,
    acknowledgeAlert,
    dismissAlert,
    resolveAlert,
    createFollowUp,
    refresh
  };
}
