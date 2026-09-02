import { BaseRepository } from './BaseRepository';
import type { NotificationPreference } from '../types';

class NotificationPreferenceRepository extends BaseRepository<NotificationPreference> {
  constructor() {
    super('notificationPreferences');
  }

  async getForUser(organisationId: string, userId: string): Promise<NotificationPreference | null> {
    const prefs = await this.getByOrganisation(organisationId);
    return prefs.find(p => p.userId === userId) || null;
  }

  async getOrDefault(organisationId: string, userId: string): Promise<NotificationPreference> {
    const existing = await this.getForUser(organisationId, userId);
    if (existing) return existing;

    const defaultPref: NotificationPreference = {
      id: `pref_${userId}`,
      organisationId,
      userId,
      attendance: true,
      finance: true,
      events: true,
      consent: true,
      transport: true,
      assets: true,
      followUps: true,
      communication: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
      updatedBy: userId,
      status: 'active'
    };

    return defaultPref;
  }
}

export const notificationPreferenceRepository = new NotificationPreferenceRepository();
