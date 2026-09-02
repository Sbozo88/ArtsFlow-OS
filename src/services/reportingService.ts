import { learnerRepository } from '../repositories/learnerRepository';
import { enrolmentRepository } from '../repositories/enrolmentRepository';
import { programmeRepository } from '../repositories/programmeRepository';
import { programmeGroupRepository } from '../repositories/programmeGroupRepository';
import { sessionRepository } from '../repositories/sessionRepository';
import { attendanceRepository } from '../repositories/attendanceRepository';
import { invoiceRepository } from '../repositories/invoiceRepository';
import { guardianRepository } from '../repositories/guardianRepository';
import { learnerGuardianRepository } from '../repositories/learnerGuardianRepository';
import { eventRepository } from '../repositories/eventRepository';
import { eventParticipantRepository } from '../repositories/eventParticipantRepository';
import { consentRequestRepository } from '../repositories/consentRequestRepository';
import { transportPassengerRepository } from '../repositories/transportPassengerRepository';
import { instrumentRepository } from '../repositories/instrumentRepository';
import { instrumentAllocationRepository } from '../repositories/instrumentAllocationRepository';
import { costumeRepository } from '../repositories/costumeRepository';
import { costumeAllocationRepository } from '../repositories/costumeAllocationRepository';
import { followUpRepository } from '../repositories/followUpRepository';
import { staffRepository } from '../repositories/staffRepository';

import { metricCalculations } from './analytics/metricCalculations';
import { formatMoney } from '../lib/money';
import type { OperationalReportRow, AuthRole } from '../types';

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  category: 'learners' | 'attendance' | 'programmes' | 'events' | 'finance' | 'assets' | 'operations';
  sensitive?: boolean;
  columns: Array<{ key: string; label: string }>;
  fetchData: (
    organisationId: string, 
    filters?: { startDate?: string; endDate?: string; programmeId?: string; groupId?: string }
  ) => Promise<OperationalReportRow[]>;
}

export const reportingService = {
  getAvailableReports(userRole?: AuthRole): ReportDefinition[] {
    const allReports = this.getAllReportDefinitions();
    if (userRole === 'teacher' || userRole === 'viewer') {
      return allReports.filter(r => !r.sensitive);
    }
    return allReports;
  },

  getAllReportDefinitions(): ReportDefinition[] {
    return [
      // 1. Learner Register
      {
        id: 'learner-register',
        name: 'Learner Register Report',
        description: 'Complete directory of active and enrolled learners with assigned programmes and primary guardians.',
        category: 'learners',
        columns: [
          { key: 'learnerName', label: 'Learner Name' },
          { key: 'status', label: 'Status' },
          { key: 'gradeOrClass', label: 'Grade / Class' },
          { key: 'dob', label: 'Date of Birth' },
          { key: 'programmes', label: 'Programmes' },
          { key: 'guardianName', label: 'Primary Guardian' },
          { key: 'guardianContact', label: 'Guardian Mobile' }
        ],
        async fetchData(orgId, filters) {
          const [learners, enrolments, programmes, lgLinks, guardians] = await Promise.all([
            learnerRepository.getByOrganisation(orgId),
            enrolmentRepository.getByOrganisation(orgId),
            programmeRepository.getByOrganisation(orgId),
            learnerGuardianRepository.getByOrganisation(orgId),
            guardianRepository.getByOrganisation(orgId)
          ]);

          const progMap = new Map(programmes.map(p => [p.id, p.name]));
          const guardianMap = new Map(guardians.map(g => [g.id, g]));

          const rows: OperationalReportRow[] = [];

          for (const l of learners) {
            const learnerEnrolments = enrolments.filter(e => e.learnerId === l.id && e.enrolmentStatus === 'active');
            if (filters?.programmeId && !learnerEnrolments.some(e => e.programmeId === filters.programmeId)) {
              continue;
            }

            const progNames = learnerEnrolments.map(e => progMap.get(e.programmeId) || 'Unknown').join(', ') || 'None';
            const link = lgLinks.find(link => link.learnerId === l.id && link.primaryContact);
            const g = link ? guardianMap.get(link.guardianId) : undefined;

            rows.push({
              learnerName: `${l.firstName} ${l.lastName}`,
              status: l.learnerStatus,
              gradeOrClass: l.gradeOrClass || '-',
              dob: l.dateOfBirth || '-',
              programmes: progNames,
              guardianName: g ? `${g.firstName} ${g.lastName}` : 'None linked',
              guardianContact: g?.mobileNumber || '-'
            });
          }

          return rows;
        }
      },

      // 2. Attendance Summary
      {
        id: 'attendance-summary',
        name: 'Attendance Summary Report',
        description: 'Learner-by-learner attendance metrics with present, absent, late, excused counts, and compliance rates.',
        category: 'attendance',
        columns: [
          { key: 'learnerName', label: 'Learner' },
          { key: 'groupName', label: 'Group / Class' },
          { key: 'sessionsExpected', label: 'Sessions' },
          { key: 'present', label: 'Present' },
          { key: 'late', label: 'Late' },
          { key: 'absent', label: 'Absent' },
          { key: 'excused', label: 'Excused' },
          { key: 'attendanceRate', label: 'Attendance Rate' }
        ],
        async fetchData(orgId, filters) {
          const [learners, sessions, attendance, groups] = await Promise.all([
            learnerRepository.getByOrganisation(orgId),
            sessionRepository.getByOrganisation(orgId),
            attendanceRepository.getByOrganisation(orgId),
            programmeGroupRepository.getByOrganisation(orgId)
          ]);

          const learnerMap = new Map(learners.map(l => [l.id, l]));
          const groupMap = new Map(groups.map(g => [g.id, g]));

          const filteredSessions = sessions.filter(s => {
            if (s.sessionStatus === 'cancelled') return false;
            if (filters?.programmeId && groupMap.get(s.groupId)?.programmeId !== filters.programmeId) return false;
            if (filters?.groupId && s.groupId !== filters.groupId) return false;
            if (filters?.startDate && s.date < filters.startDate) return false;
            if (filters?.endDate && s.date > filters.endDate) return false;
            return true;
          });

          const sessionIds = new Set(filteredSessions.map(s => s.id));
          const filteredAttendance = attendance.filter(a => sessionIds.has(a.sessionId));

          // Group by learnerId
          const learnerAttMap = new Map<string, typeof attendance>();
          for (const a of filteredAttendance) {
            if (!learnerAttMap.has(a.learnerId)) {
              learnerAttMap.set(a.learnerId, []);
            }
            learnerAttMap.get(a.learnerId)!.push(a);
          }

          const rows: OperationalReportRow[] = [];

          for (const [learnerId, list] of learnerAttMap.entries()) {
            const l = learnerMap.get(learnerId);
            const firstSession = filteredSessions.find(s => s.id === list[0]?.sessionId);
            const grp = firstSession ? groupMap.get(firstSession.groupId) : undefined;

            let present = 0;
            let late = 0;
            let absent = 0;
            let excused = 0;

            for (const item of list) {
              if (item.attendanceStatus === 'present') present += 1;
              else if (item.attendanceStatus === 'late') late += 1;
              else if (item.attendanceStatus === 'absent') absent += 1;
              else if (item.attendanceStatus === 'excused') excused += 1;
            }

            const rate = metricCalculations.calculateAttendanceRate(list);

            rows.push({
              learnerName: l ? `${l.firstName} ${l.lastName}` : learnerId,
              groupName: grp?.name || 'Multiple',
              sessionsExpected: list.length,
              present,
              late,
              absent,
              excused,
              attendanceRate: `${rate}%`
            });
          }

          return rows.sort((a, b) => String(a.learnerName).localeCompare(String(b.learnerName)));
        }
      },

      // 3. Programme Performance Summary
      {
        id: 'programme-summary',
        name: 'Programme Operations Summary',
        description: 'High-level programme operational footprint including active enrolments, sessions held, and attendance rates.',
        category: 'programmes',
        columns: [
          { key: 'programmeName', label: 'Programme' },
          { key: 'programmeType', label: 'Programme Type' },
          { key: 'groupsCount', label: 'Groups' },
          { key: 'enrolmentsCount', label: 'Active Learners' },
          { key: 'sessionsCount', label: 'Sessions Held' },
          { key: 'attendanceRate', label: 'Avg Attendance' }
        ],
        async fetchData(orgId, filters) {
          const [programmes, groups, enrolments, sessions, attendance] = await Promise.all([
            programmeRepository.getByOrganisation(orgId),
            programmeGroupRepository.getByOrganisation(orgId),
            enrolmentRepository.getByOrganisation(orgId),
            sessionRepository.getByOrganisation(orgId),
            attendanceRepository.getByOrganisation(orgId)
          ]);

          const rows: OperationalReportRow[] = [];

          for (const p of programmes) {
            if (filters?.programmeId && p.id !== filters.programmeId) continue;

            const pGroups = groups.filter(g => g.programmeId === p.id);
            const pGroupIds = new Set(pGroups.map(g => g.id));
            const pEnrolments = enrolments.filter(e => e.programmeId === p.id && e.enrolmentStatus === 'active');

            const pSessions = sessions.filter(s => {
              if (!pGroupIds.has(s.groupId)) return false;
              if (s.sessionStatus === 'cancelled') return false;
              if (filters?.startDate && s.date < filters.startDate) return false;
              if (filters?.endDate && s.date > filters.endDate) return false;
              return true;
            });

            const pSessionIds = new Set(pSessions.map(s => s.id));
            const pAttendance = attendance.filter(a => pSessionIds.has(a.sessionId));
            const rate = metricCalculations.calculateAttendanceRate(pAttendance);

            rows.push({
              programmeName: p.name,
              programmeType: p.programmeType,
              groupsCount: pGroups.length,
              enrolmentsCount: pEnrolments.length,
              sessionsCount: pSessions.length,
              attendanceRate: `${rate}%`
            });
          }

          return rows;
        }
      },

      // 4. Event Participation & Consent
      {
        id: 'event-participants',
        name: 'Event Participation & Consent Compliance',
        description: 'Audit roster of event participants, indemnity consent verification status, and transport requirements.',
        category: 'events',
        columns: [
          { key: 'eventName', label: 'Event' },
          { key: 'eventDate', label: 'Date' },
          { key: 'learnerName', label: 'Participant' },
          { key: 'consentStatus', label: 'Consent Status' },
          { key: 'transportStatus', label: 'Transport Booking' }
        ],
        async fetchData(orgId) {
          const [events, participants, learners, consents, passengers] = await Promise.all([
            eventRepository.getByOrganisation(orgId),
            eventParticipantRepository.getByOrganisation(orgId),
            learnerRepository.getByOrganisation(orgId),
            consentRequestRepository.getByOrganisation(orgId),
            transportPassengerRepository.getByOrganisation(orgId)
          ]);

          const eventMap = new Map(events.map(e => [e.id, e]));
          const learnerMap = new Map(learners.map(l => [l.id, l]));

          const rows: OperationalReportRow[] = [];

          for (const p of participants) {
            if (p.participationStatus === 'withdrawn') continue;
            const ev = eventMap.get(p.eventId);
            const l = learnerMap.get(p.learnerId);

            const consent = consents.find(c => c.eventId === p.eventId && c.learnerId === p.learnerId);
            const passenger = passengers.find(pass => pass.eventId === p.eventId && pass.learnerId === p.learnerId);

            rows.push({
              eventName: ev?.name || 'Unknown Event',
              eventDate: ev?.startDate || '-',
              learnerName: l ? `${l.firstName} ${l.lastName}` : p.learnerId,
              consentStatus: consent ? consent.requestStatus.toUpperCase() : 'NO REQUEST FILED',
              transportStatus: passenger ? `Booked (${passenger.boardingStatus})` : 'Not Required'
            });
          }

          return rows;
        }
      },

      // 5. Finance Aged Debtors & Outstanding
      {
        id: 'finance-outstanding',
        name: 'Outstanding Invoices & Aged Debtors',
        description: 'Detailed accounts receivable ageing report by invoice with 30-day buckets and guardian contacts.',
        category: 'finance',
        sensitive: true,
        columns: [
          { key: 'invoiceNumber', label: 'Invoice #' },
          { key: 'learnerName', label: 'Learner' },
          { key: 'guardianName', label: 'Guardian' },
          { key: 'issueDate', label: 'Issue Date' },
          { key: 'dueDate', label: 'Due Date' },
          { key: 'total', label: 'Total' },
          { key: 'balance', label: 'Balance Outstanding' },
          { key: 'ageCategory', label: 'Age Bucket' }
        ],
        async fetchData(orgId) {
          const [invoices, learners, guardians, lgLinks] = await Promise.all([
            invoiceRepository.getByOrganisation(orgId),
            learnerRepository.getByOrganisation(orgId),
            guardianRepository.getByOrganisation(orgId),
            learnerGuardianRepository.getByOrganisation(orgId)
          ]);

          const learnerMap = new Map(learners.map(l => [l.id, l]));
          const guardianMap = new Map(guardians.map(g => [g.id, g]));
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const rows: OperationalReportRow[] = [];

          for (const inv of invoices) {
            if (inv.invoiceStatus === 'cancelled' || inv.balance <= 0) continue;

            const l = learnerMap.get(inv.learnerId);
            const link = lgLinks.find(link => link.learnerId === inv.learnerId && (link.financialContact || link.primaryContact));
            const g = link ? guardianMap.get(link.guardianId) : undefined;

            const dueDate = new Date(inv.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

            let ageCategory = 'Current (Not Due)';
            if (diffDays > 90) ageCategory = '90+ Days Overdue';
            else if (diffDays > 60) ageCategory = '61-90 Days Overdue';
            else if (diffDays > 30) ageCategory = '31-60 Days Overdue';
            else if (diffDays > 0) ageCategory = '1-30 Days Overdue';

            rows.push({
              invoiceNumber: inv.invoiceNumber,
              learnerName: l ? `${l.firstName} ${l.lastName}` : inv.learnerId,
              guardianName: g ? `${g.firstName} ${g.lastName}` : 'Unassigned',
              issueDate: inv.issueDate,
              dueDate: inv.dueDate,
              total: formatMoney(inv.total),
              balance: formatMoney(inv.balance),
              ageCategory
            });
          }

          return rows.sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
        }
      },

      // 6. Instrument Allocations
      {
        id: 'instrument-allocations',
        name: 'Instrument Asset & Allocation Register',
        description: 'Inventory report of issued musical instruments, serial numbers, custodians, and return dates.',
        category: 'assets',
        columns: [
          { key: 'instrumentName', label: 'Instrument' },
          { key: 'serialNumber', label: 'Serial Number' },
          { key: 'instrumentType', label: 'Type' },
          { key: 'learnerName', label: 'Allocated Learner' },
          { key: 'issuedDate', label: 'Issued Date' },
          { key: 'expectedReturn', label: 'Expected Return' },
          { key: 'condition', label: 'Condition' }
        ],
        async fetchData(orgId) {
          const [instruments, allocations, learners] = await Promise.all([
            instrumentRepository.getByOrganisation(orgId),
            instrumentAllocationRepository.getByOrganisation(orgId),
            learnerRepository.getByOrganisation(orgId)
          ]);

          const instMap = new Map(instruments.map(i => [i.id, i]));
          const learnerMap = new Map(learners.map(l => [l.id, l]));

          const rows: OperationalReportRow[] = [];

          for (const alloc of allocations) {
            if (alloc.allocationStatus !== 'active') continue;
            const inst = instMap.get(alloc.instrumentId);
            const l = learnerMap.get(alloc.learnerId);

            rows.push({
              instrumentName: inst ? `${inst.make ? inst.make + ' ' : ''}${inst.instrumentType} (${inst.assetNumber})` : 'Unknown Instrument',
              serialNumber: inst?.serialNumber || '-',
              instrumentType: inst?.instrumentType || '-',
              learnerName: l ? `${l.firstName} ${l.lastName}` : alloc.learnerId,
              issuedDate: alloc.allocatedDate || '-',
              expectedReturn: alloc.returnDueDate || 'Ongoing',
              condition: alloc.conditionOut || inst?.condition || 'Good'
            });
          }

          return rows;
        }
      },

      // 7. Costume Allocations
      {
        id: 'costume-allocations',
        name: 'Dance Costume Allocation Register',
        description: 'Tracking list of allocated performance dance costumes and return schedule.',
        category: 'assets',
        columns: [
          { key: 'costumeName', label: 'Costume' },
          { key: 'size', label: 'Size' },
          { key: 'learnerName', label: 'Learner' },
          { key: 'allocatedDate', label: 'Issued Date' },
          { key: 'expectedReturn', label: 'Expected Return' }
        ],
        async fetchData(orgId) {
          const [costumes, allocations, learners] = await Promise.all([
            costumeRepository.getByOrganisation(orgId),
            costumeAllocationRepository.getByOrganisation(orgId),
            learnerRepository.getByOrganisation(orgId)
          ]);

          const costumeMap = new Map(costumes.map(c => [c.id, c]));
          const learnerMap = new Map(learners.map(l => [l.id, l]));

          const rows: OperationalReportRow[] = [];

          for (const alloc of allocations) {
            if (alloc.allocationStatus !== 'active') continue;
            const c = costumeMap.get(alloc.costumeId);
            const l = learnerMap.get(alloc.learnerId);

            rows.push({
              costumeName: c ? `${c.description || c.costumeType} (${c.assetNumber})` : 'Costume Item',
              size: c?.size || '-',
              learnerName: l ? `${l.firstName} ${l.lastName}` : alloc.learnerId,
              allocatedDate: alloc.allocatedDate || '-',
              expectedReturn: alloc.returnDueDate || 'Ongoing'
            });
          }

          return rows;
        }
      },

      // 8. Follow-Ups Audit
      {
        id: 'followups-audit',
        name: 'Action Items & Follow-Ups Register',
        description: 'Comprehensive log of operational tasks, categories, owners, deadlines, and completion statuses.',
        category: 'operations',
        columns: [
          { key: 'subject', label: 'Subject' },
          { key: 'category', label: 'Category' },
          { key: 'priority', label: 'Priority' },
          { key: 'owner', label: 'Assigned Staff' },
          { key: 'dueDate', label: 'Due Date' },
          { key: 'status', label: 'Status' }
        ],
        async fetchData(orgId) {
          const [followUps, staffList] = await Promise.all([
            followUpRepository.getByOrganisation(orgId),
            staffRepository.getByOrganisation(orgId)
          ]);

          const staffMap = new Map(staffList.map(s => [s.id, `${s.firstName} ${s.lastName}`]));

          return followUps.map(f => ({
            subject: f.subject,
            category: f.category.toUpperCase(),
            priority: f.priority.toUpperCase(),
            owner: staffMap.get(f.ownerId) || f.ownerId || 'Unassigned',
            dueDate: f.dueDate || '-',
            status: (f.followUpStatus || f.status).toUpperCase()
          }));
        }
      },

      // 9. Contact Data Quality Exceptions
      {
        id: 'data-quality-exceptions',
        name: 'Contact & Profile Data Quality Audit',
        description: 'Highlights incomplete records including missing mobile numbers, emails, or unlinked guardians.',
        category: 'operations',
        columns: [
          { key: 'entityType', label: 'Record Type' },
          { key: 'name', label: 'Record Name' },
          { key: 'defect', label: 'Data Quality Issue' },
          { key: 'actionRequired', label: 'Remediation' }
        ],
        async fetchData(orgId) {
          const [guardians, learners, lgLinks, staffList] = await Promise.all([
            guardianRepository.getByOrganisation(orgId),
            learnerRepository.getByOrganisation(orgId),
            learnerGuardianRepository.getByOrganisation(orgId),
            staffRepository.getByOrganisation(orgId)
          ]);

          const rows: OperationalReportRow[] = [];

          // Guardians missing contact info
          for (const g of guardians) {
            if (!g.mobileNumber) {
              rows.push({
                entityType: 'Guardian',
                name: `${g.firstName} ${g.lastName}`,
                defect: 'Missing mobile phone number',
                actionRequired: 'Update guardian mobile for SMS/WhatsApp notices'
              });
            }
            if (!g.email) {
              rows.push({
                entityType: 'Guardian',
                name: `${g.firstName} ${g.lastName}`,
                defect: 'Missing email address',
                actionRequired: 'Add email address for billing and consent'
              });
            }
          }

          // Learners without linked guardians
          for (const l of learners) {
            if (l.learnerStatus !== 'active') continue;
            const hasGuardian = lgLinks.some(link => link.learnerId === l.id);
            if (!hasGuardian) {
              rows.push({
                entityType: 'Learner',
                name: `${l.firstName} ${l.lastName}`,
                defect: 'No guardian linked',
                actionRequired: 'Link a primary guardian in learner profile'
              });
            }
          }

          // Staff missing contact
          for (const s of staffList) {
            if (!s.email && !s.mobileNumber) {
              rows.push({
                entityType: 'Staff',
                name: `${s.firstName} ${s.lastName}`,
                defect: 'Missing both phone and email',
                actionRequired: 'Update staff contact details'
              });
            }
          }

          return rows;
        }
      }
    ];
  }
};
