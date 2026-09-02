import { staffRepository } from '../repositories/staffRepository';
import { staffAssignmentRepository } from '../repositories/staffAssignmentRepository';
import { staffWorkRecordRepository } from '../repositories/staffWorkRecordRepository';
import { timesheetRepository } from '../repositories/timesheetRepository';
import { staffSubstitutionRepository } from '../repositories/staffSubstitutionRepository';
import { programmeGroupRepository } from '../repositories/programmeGroupRepository';
import { sessionRepository } from '../repositories/sessionRepository';
import type { 
  StaffWorkloadSummary 
} from '../types';

export interface StaffOverviewStats {
  activeStaffCount: number;
  teachersWorkingThisWeekCount: number;
  sessionsThisWeekCount: number;
  unverifiedTimesheetsCount: number;
  timesheetsAwaitingApprovalCount: number;
  activeSubstitutionsCount: number;
  highWorkloadStaffCount: number;
  noRecentActivityStaffCount: number;
}

export interface GroupStaffCoverageItem {
  groupId: string;
  groupName: string;
  programmeId: string;
  primaryTeacherName?: string;
  assistantTeachersCount: number;
  upcomingSessionsCount: number;
  coverageStatus: 'covered' | 'unassigned' | 'substitute_active';
}

export const staffWorkloadService = {
  /**
   * Retrieves high-level overview statistics for Staff Operations dashboard.
   */
  async getOverviewStats(organisationId: string): Promise<StaffOverviewStats> {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

    const startStr = startOfWeek.toISOString().split('T')[0];
    const endStr = endOfWeek.toISOString().split('T')[0];

    const [
      allStaff,
      allSessions,
      allTimesheets,
      allSubstitutions,
      allWorkRecords
    ] = await Promise.all([
      staffRepository.getByOrganisation(organisationId),
      sessionRepository.getByOrganisation(organisationId),
      timesheetRepository.getByOrganisation(organisationId),
      staffSubstitutionRepository.getByOrganisation(organisationId),
      staffWorkRecordRepository.getByOrganisation(organisationId)
    ]);

    const activeStaff = allStaff.filter(s => s.staffStatus === 'active');
    const sessionsThisWeek = allSessions.filter(
      s => s.date >= startStr && s.date <= endStr && s.sessionStatus !== 'cancelled'
    );

    // Teachers who have a session this week
    const teacherIdsThisWeek = new Set<string>();
    for (const s of sessionsThisWeek) {
      if (s.teacherIds) {
        for (const tid of s.teacherIds) teacherIdsThisWeek.add(tid);
      }
    }

    const unverifiedTimesheets = allTimesheets.filter(
      t => t.timesheetStatus === 'submitted' || t.timesheetStatus === 'under_review'
    );

    const awaitingApproval = allTimesheets.filter(t => t.timesheetStatus === 'verified');

    const activeSubs = allSubstitutions.filter(
      s => s.substitutionStatus === 'requested' || s.substitutionStatus === 'confirmed'
    );

    // Calculate workload per staff this week (minutes)
    const workThisWeek = allWorkRecords.filter(w => w.workDate >= startStr && w.workDate <= endStr);
    const minutesByStaff = new Map<string, number>();
    for (const w of workThisWeek) {
      minutesByStaff.set(w.staffId, (minutesByStaff.get(w.staffId) || 0) + (w.durationMinutes || 0));
    }

    let highWorkloadCount = 0;
    let noRecentActivityCount = 0;

    for (const s of activeStaff) {
      const mins = minutesByStaff.get(s.id) || 0;
      if (mins > 2100) { // > 35 hours in a week
        highWorkloadCount++;
      } else if (mins === 0) {
        noRecentActivityCount++;
      }
    }

    return {
      activeStaffCount: activeStaff.length,
      teachersWorkingThisWeekCount: teacherIdsThisWeek.size,
      sessionsThisWeekCount: sessionsThisWeek.length,
      unverifiedTimesheetsCount: unverifiedTimesheets.length,
      timesheetsAwaitingApprovalCount: awaitingApproval.length,
      activeSubstitutionsCount: activeSubs.length,
      highWorkloadStaffCount: highWorkloadCount,
      noRecentActivityStaffCount: noRecentActivityCount
    };
  },

  /**
   * Calculates comprehensive workload metrics across all staff for a specified timeframe.
   */
  async getStaffWorkloadSummaries(
    organisationId: string,
    startDate: string,
    endDate: string
  ): Promise<StaffWorkloadSummary[]> {
    const [
      allStaff,
      allAssignments,
      allSessions,
      allWorkRecords,
      allTimesheets,
      allSubstitutions
    ] = await Promise.all([
      staffRepository.getByOrganisation(organisationId),
      staffAssignmentRepository.getByOrganisation(organisationId),
      sessionRepository.getByOrganisation(organisationId),
      staffWorkRecordRepository.getByOrganisation(organisationId),
      timesheetRepository.getByOrganisation(organisationId),
      staffSubstitutionRepository.getByOrganisation(organisationId)
    ]);

    const activeStaff = allStaff.filter(s => s.staffStatus === 'active');
    const recordsInRange = allWorkRecords.filter(w => w.workDate >= startDate && w.workDate <= endDate && w.workStatus !== 'cancelled');
    const sessionsInRange = allSessions.filter(s => s.date >= startDate && s.date <= endDate && s.sessionStatus !== 'cancelled');

    return activeStaff.map(staff => {
      const staffName = `${staff.firstName} ${staff.lastName}`;

      // Assignments
      const myAssignments = allAssignments.filter(a => a.staffId === staff.id && a.assignmentStatus === 'active');
      const uniqueProgrammes = new Set(myAssignments.filter(a => a.programmeId).map(a => a.programmeId));
      const uniqueGroups = new Set(myAssignments.filter(a => a.groupId).map(a => a.groupId));

      // Sessions
      const mySessions = sessionsInRange.filter(
        s => Boolean(s.teacherIds && s.teacherIds.includes(staff.id))
      );

      // Work Records
      const myRecords = recordsInRange.filter(w => w.staffId === staff.id);
      const totalWorkMinutes = myRecords.reduce((sum, r) => sum + (r.durationMinutes || 0), 0);
      const eventCount = myRecords.filter(r => r.workType === 'event' || r.workType === 'performance').length;

      // Pending Timesheets
      const myPendingTimesheets = allTimesheets.filter(
        t => t.staffId === staff.id && (t.timesheetStatus === 'draft' || t.timesheetStatus === 'submitted')
      );

      // Substitutions
      const mySubs = allSubstitutions.filter(
        s => (s.originalStaffId === staff.id || s.substituteStaffId === staff.id) && s.substitutionStatus !== 'cancelled'
      );

      // Transparent Operational Flags
      const highWorkload = totalWorkMinutes > 2400; // > 40 hours
      const lowActivity = totalWorkMinutes === 0 && myAssignments.length > 0;
      const noActiveAssignment = myAssignments.length === 0;
      const repeatedSubstitutions = mySubs.length >= 3;
      const timesheetOverdue = myRecords.length > 0 && myPendingTimesheets.some(t => t.timesheetStatus === 'draft');

      return {
        staffId: staff.id,
        staffName,
        assignedProgrammesCount: uniqueProgrammes.size,
        assignedGroupsCount: uniqueGroups.size,
        sessionsCount: mySessions.length,
        eventsCount: eventCount,
        totalWorkMinutes,
        pendingTimesheetsCount: myPendingTimesheets.length,
        substitutionsCount: mySubs.length,
        flags: {
          highWorkload,
          lowActivity,
          noActiveAssignment,
          repeatedSubstitutions,
          timesheetOverdue
        }
      };
    });
  },

  /**
   * Analyses group staff coverage to identify groups with no active assigned teacher.
   */
  async getGroupStaffCoverage(organisationId: string): Promise<GroupStaffCoverageItem[]> {
    const [groups, assignments, sessions] = await Promise.all([
      programmeGroupRepository.getByOrganisation(organisationId),
      staffAssignmentRepository.getByOrganisation(organisationId),
      sessionRepository.getByOrganisation(organisationId)
    ]);

    const activeGroups = groups.filter(g => g.groupStatus === 'active');
    const todayStr = new Date().toISOString().split('T')[0];

    return activeGroups.map(grp => {
      const grpAssignments = assignments.filter(a => a.groupId === grp.id && a.assignmentStatus === 'active');
      const primaryAssign = grpAssignments.find(a => a.isPrimary || a.role === 'lead_teacher');
      const assistants = grpAssignments.filter(a => a.role === 'assistant_teacher');

      const upcoming = sessions.filter(
        s => s.groupId === grp.id && s.date >= todayStr && s.sessionStatus === 'scheduled'
      );

      let coverageStatus: 'covered' | 'unassigned' | 'substitute_active' = 'covered';
      if (!primaryAssign && !grp.teacherId) {
        coverageStatus = 'unassigned';
      }

      return {
        groupId: grp.id,
        groupName: grp.name,
        programmeId: grp.programmeId,
        primaryTeacherName: primaryAssign?.notes || (grp.teacherId ? 'Assigned in Group' : undefined),
        assistantTeachersCount: assistants.length,
        upcomingSessionsCount: upcoming.length,
        coverageStatus
      };
    });
  }
};
