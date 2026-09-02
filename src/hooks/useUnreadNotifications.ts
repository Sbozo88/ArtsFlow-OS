import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/automation/notificationService';
import type { AppNotification } from '../types';

export function useUnreadNotifications() {
  const { organisationId, user, authUser } = useAuth();
  const userId = authUser?.uid || user?.uid || '';

  const [unreadCount, setUnreadCount] = useState(0);
  const [recentUnread, setRecentUnread] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUnread = useCallback(async () => {
    if (!organisationId || !userId) return;
    try {
      const data = await notificationService.getUnreadSummary(organisationId, userId);
      setUnreadCount(data.count);
      setRecentUnread(data.recentUnread);
    } catch (err) {
      console.error('Failed to load unread notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [organisationId, userId]);

  useEffect(() => {
    let mounted = true;
    if (!organisationId || !userId) return;

    const load = async () => {
      try {
        const data = await notificationService.getUnreadSummary(organisationId, userId);
        if (mounted) {
          setUnreadCount(data.count);
          setRecentUnread(data.recentUnread);
        }
      } catch (err) {
        console.error('Failed to load unread notifications:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    // Poll every 30 seconds for live notifications
    const interval = setInterval(load, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [organisationId, userId]);

  const markAsRead = async (notificationId: string) => {
    if (!organisationId || !userId) return;
    try {
      await notificationService.markAsRead(organisationId, notificationId, userId);
      await fetchUnread();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!organisationId || !userId) return;
    try {
      await notificationService.markAllAsRead(organisationId, userId, userId);
      await fetchUnread();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  return {
    unreadCount,
    recentUnread,
    loading,
    refresh: fetchUnread,
    markAsRead,
    markAllAsRead
  };
}
