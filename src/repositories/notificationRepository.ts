import { BaseRepository } from './BaseRepository';
import { AppNotification, NotificationStatus } from '../types';

class NotificationRepository extends BaseRepository<AppNotification> {
  constructor() {
    super('notifications');
  }

  async getForUser(organisationId: string, userId: string): Promise<AppNotification[]> {
    const notifications = await this.getByOrganisation(organisationId);
    return notifications
      .filter(n => n.recipientUserId === userId && n.notificationStatus !== 'dismissed')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getByUser(organisationId: string, userId: string): Promise<AppNotification[]> {
    return this.getForUser(organisationId, userId);
  }

  async getUnreadForUser(organisationId: string, userId: string): Promise<AppNotification[]> {
    const notifications = await this.getByOrganisation(organisationId);
    return notifications
      .filter(n => n.recipientUserId === userId && n.notificationStatus === 'unread')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markAsRead(organisationId: string, notificationId: string, actorId: string): Promise<void> {
    await this.update(organisationId, actorId, notificationId, {
      notificationStatus: 'read' as NotificationStatus,
      readAt: new Date().toISOString()
    });
  }

  async markAllAsRead(organisationId: string, userId: string, actorId: string): Promise<void> {
    const unread = await this.getUnreadForUser(organisationId, userId);
    const now = new Date().toISOString();
    for (const notif of unread) {
      await this.update(organisationId, actorId, notif.id, {
        notificationStatus: 'read' as NotificationStatus,
        readAt: now
      });
    }
  }

  async dismiss(organisationId: string, notificationId: string, actorId: string): Promise<void> {
    await this.update(organisationId, actorId, notificationId, {
      notificationStatus: 'dismissed' as NotificationStatus,
      dismissedAt: new Date().toISOString()
    });
  }
}

export const notificationRepository = new NotificationRepository();
