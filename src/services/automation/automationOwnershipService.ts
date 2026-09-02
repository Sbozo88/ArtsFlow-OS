import { staffRepository } from '../../repositories/staffRepository';
import { programmeGroupRepository } from '../../repositories/programmeGroupRepository';
import type { RuleCategory } from '../../types';

export interface OwnershipContext {
  groupId?: string;
  programmeId?: string;
  eventId?: string;
  assignedStaffId?: string;
  category?: RuleCategory;
}

export const automationOwnershipService = {
  /**
   * Resolves the primary responsible staff member ID for an automation action.
   * Follows the ownership escalation hierarchy:
   * Direct Owner / Teacher -> Programme Director -> Organisation Admin -> First Active Staff.
   */
  async resolveOwnerId(
    organisationId: string,
    context: OwnershipContext,
    fallbackActorId?: string
  ): Promise<string> {
    // 1. Direct assignment if already specified
    if (context.assignedStaffId) {
      return context.assignedStaffId;
    }

    const allStaff = await staffRepository.getByOrganisation(organisationId);
    const activeStaff = allStaff.filter(s => s.staffStatus === 'active');

    if (activeStaff.length === 0) {
      return fallbackActorId || 'unassigned';
    }

    // 2. If group is specified, find assigned group teacher
    if (context.groupId) {
      const groups = await programmeGroupRepository.getByOrganisation(organisationId);
      const group = groups.find(g => g.id === context.groupId);
      if (group?.teacherId) {
        const teacher = activeStaff.find(s => s.id === group.teacherId);
        if (teacher) return teacher.id;
      }
    }

    // 3. Match staff by category domain
    if (context.category) {
      switch (context.category) {
        case 'finance': {
          const financeStaff = activeStaff.find(
            s => /finance|account|bursar|billing/i.test(s.role || '') || /finance/i.test(s.specialisation || '')
          );
          if (financeStaff) return financeStaff.id;
          break;
        }
        case 'instrument': {
          const musicStaff = activeStaff.find(
            s => /music|instrument|orchestra/i.test(s.role || '') || /music/i.test(s.specialisation || '')
          );
          if (musicStaff) return musicStaff.id;
          break;
        }
        case 'costume': {
          const danceStaff = activeStaff.find(
            s => /dance|costume|ballet/i.test(s.role || '') || /dance/i.test(s.specialisation || '')
          );
          if (danceStaff) return danceStaff.id;
          break;
        }
        case 'event':
        case 'transport':
        case 'consent': {
          const coordinator = activeStaff.find(
            s => /event|coordinator|logistics|transport/i.test(s.role || '')
          );
          if (coordinator) return coordinator.id;
          break;
        }
      }
    }

    // 4. Programme Director / Coordinator fallback
    const director = activeStaff.find(
      s => /director|coordinator|head|lead|manager/i.test(s.role || '')
    );
    if (director) return director.id;

    // 5. Organisation Admin fallback
    const admin = activeStaff.find(s => /admin/i.test(s.role || ''));
    if (admin) return admin.id;

    // 6. Default to first active staff or fallbackActorId
    return activeStaff[0]?.id || fallbackActorId || 'unassigned';
  },

  /**
   * Escalation chain: advances an owner to the next tier in responsibility.
   * Teacher -> Programme Director -> Organisation Admin.
   */
  async escalateOwner(
    organisationId: string,
    currentOwnerId?: string
  ): Promise<string> {
    const allStaff = await staffRepository.getByOrganisation(organisationId);
    const activeStaff = allStaff.filter(s => s.staffStatus === 'active');

    // If current owner is not admin, look for director
    const directors = activeStaff.filter(
      s => /director|coordinator|head|lead|manager/i.test(s.role || '') && s.id !== currentOwnerId
    );
    if (directors.length > 0) return directors[0].id;

    // Next look for Admin
    const admins = activeStaff.filter(
      s => /admin/i.test(s.role || '') && s.id !== currentOwnerId
    );
    if (admins.length > 0) return admins[0].id;

    return currentOwnerId || activeStaff[0]?.id || 'unassigned';
  },

  /**
   * Resolves recipient user IDs for in-app notifications.
   * Can target specific roles or domain owners.
   */
  async resolveNotificationRecipients(
    organisationId: string,
    targetRoleOrUser: string,
    context: OwnershipContext,
    fallbackActorId?: string
  ): Promise<string[]> {
    const allStaff = await staffRepository.getByOrganisation(organisationId);
    const activeStaff = allStaff.filter(s => s.staffStatus === 'active');

    if (targetRoleOrUser === 'all_staff') {
      return activeStaff.map(s => s.id);
    }

    if (targetRoleOrUser === 'admin' || targetRoleOrUser === 'organisation_admin') {
      const admins = activeStaff.filter(s => /admin/i.test(s.role || ''));
      if (admins.length > 0) return admins.map(a => a.id);
    }

    if (targetRoleOrUser === 'finance') {
      const finance = activeStaff.filter(s => /finance|account/i.test(s.role || ''));
      if (finance.length > 0) return finance.map(f => f.id);
    }

    if (targetRoleOrUser === 'director' || targetRoleOrUser === 'programme_director') {
      const directors = activeStaff.filter(s => /director|coordinator|head|lead/i.test(s.role || ''));
      if (directors.length > 0) return directors.map(d => d.id);
    }

    // Direct owner resolution
    const resolvedOwner = await this.resolveOwnerId(organisationId, context, fallbackActorId);
    return [resolvedOwner];
  }
};
