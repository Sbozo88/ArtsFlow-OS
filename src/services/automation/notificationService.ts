import { notificationRepository } from '../../repositories/notificationRepository';
import { auditService } from '../auditService';
import type { AppNotification, NotificationType, AlertSeverity, NotificationStatus, AuthRole } from '../../types';

export interface CreateNotificationInput {
  recipientUserId: string;
  recipientRole?: AuthRole;
  notificationType: NotificationType;
  title: string;
  message: string;
  severity: AlertSeverity;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  automationRuleId?: string;
  automationExecutionId?: string;
}

export const notificationService = {
  /**
   * Dispatches an in-app internal notification to a staff member.
   */
  async createNotification(
    organisationId: string,
    actorId: string,
    input: CreateNotificationInput
  ): Promise<AppNotification> {
    const notification = await notificationRepository.create(organisationId, actorId, {
      recipientUserId: input.recipientUserId,
      recipientRole: input.recipientRole,
      notificationType: input.notificationType,
      title: input.title,
      message: input.message,
      severity: input.severity,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      actionUrl: input.actionUrl,
      notificationStatus: 'unread',
      automationRuleId: input.automationRuleId,
      automationExecutionId: input.automationExecutionId
    });

    await auditService.log(
      organisationId,
      actorId,
      'CREATE_NOTIFICATION',
      'notification',
      notification.id,
      undefined,
      { title: input.title, recipientUserId: input.recipientUserId, severity: input.severity }
    );

    return notification;
  },

  /**
   * Fetches active (non-dismissed) notifications for a user.
   */
  async getNotifications(
    organisationId: string,
    userId: string,
    filters?: {
      status?: NotificationStatus;
      severity?: AlertSeverity;
      type?: NotificationType;
      limit?: number;
    }
  ): Promise<AppNotification[]> {
    const all = await notificationRepository.getForUser(organisationId, userId);

    return all.filter(n => {
      if (filters?.status && n.notificationStatus !== filters.status) return false;
      if (filters?.severity && n.severity !== filters.severity) return false;
      if (filters?.type && n.notificationType !== filters.type) return false;
      return true;
    }).slice(0, filters?.limit || 50);
  },

  /**
   * Gets unread notifications and total unread count for badges.
   */
  async getUnreadSummary(organisationId: string, userId: string): Promise<{
    count: number;
    recentUnread: AppNotification[];
  }> {
    const unread = await notificationRepository.getUnreadForUser(organisationId, userId);
    return {
      count: unread.length,
      recentUnread: unread.slice(0, 5)
    };
  },

  /**
   * Marks a notification as read.
   */
  async markAsRead(organisationId: string, notificationId: string, actorId: string): Promise<void> {
    await notificationRepository.markAsRead(organisationId, notificationId, actorId);
    await auditService.log(
      organisationId,
      actorId,
      'MARK_NOTIFICATION_READ',
      'notification',
      notificationId
    );
  },

  /**
   * Marks all unread notifications for a user as read.
   */
  async markAllAsRead(organisationId: string, userId: string, actorId: string): Promise<void> {
    await notificationRepository.markAllAsRead(organisationId, userId, actorId);
  },

  /**
   * Dismisses a notification from the inbox.
   */
  async dismiss(organisationId: string, notificationId: string, actorId: string): Promise<void> {
    await notificationRepository.dismiss(organisationId, notificationId, actorId);
    await auditService.log(
      organisationId,
      actorId,
      'DISMISS_NOTIFICATION',
      'notification',
      notificationId
    );
  }
};
