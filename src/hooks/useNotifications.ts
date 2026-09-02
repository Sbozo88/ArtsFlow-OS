import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/automation/notificationService';
import type { AppNotification, NotificationStatus, AlertSeverity, NotificationType } from '../types';

export function useNotifications(filters?: {
  status?: NotificationStatus;
  severity?: AlertSeverity;
  type?: NotificationType;
}) {
  const { organisationId, user, authUser } = useAuth();
  const userId = authUser?.uid || user?.uid || '';

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!organisationId || !userId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await notificationService.getNotifications(organisationId, userId, filters);
      setNotifications(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [organisationId, userId, filters]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId || !userId) return;

    const load = async () => {
      try {
        const data = await notificationService.getNotifications(organisationId, userId, filters);
        if (mounted) {
          setNotifications(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load notifications');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [organisationId, userId, filters?.status, filters?.severity, filters?.type]);

  const markAsRead = async (notificationId: string) => {
    if (!organisationId || !userId) return;
    try {
      await notificationService.markAsRead(organisationId, notificationId, userId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, notificationStatus: 'read' as const, readAt: new Date().toISOString() } : n))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    if (!organisationId || !userId) return;
    try {
      await notificationService.markAllAsRead(organisationId, userId, userId);
      const now = new Date().toISOString();
      setNotifications(prev =>
        prev.map(n => ({ ...n, notificationStatus: 'read' as const, readAt: now }))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to mark all as read');
    }
  };

  const dismiss = async (notificationId: string) => {
    if (!organisationId || !userId) return;
    try {
      await notificationService.dismiss(organisationId, notificationId, userId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss notification');
    }
  };

  return {
    notifications,
    loading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismiss
  };
}
