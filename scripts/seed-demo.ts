/**
 * ArtsFlow OS — Safe Demo Seeding System
 *
 * Generates realistic, fully populated, fictional demonstration records for:
 * - Organisation: "ArtsFlow Demo Arts Academy" (org_demo_artsflow)
 * - 12 Learners, 6 Guardians, 5 Staff
 * - Programmes: Music & Dance
 * - Groups: Junior Brass, Senior Orchestra, Beginner Strings, Senior Dance
 * - Enrolments, Sessions (Past & Upcoming), Attendance
 * - Instruments, Allocations, Repertoire, Practice Logs, Music Assessments
 * - Choreography, Dance Assessments
 * - Event: "Spring Arts Showcase", Participants, Consent, Transport Plan
 * - Finance: Charges, Invoices, Payments, Outstanding Balances
 * - Communications, Documents, Automation Rules, Follow-Ups
 *
 * STRICT SAFETY LOCK:
 * Automatically aborts and refuses execution in production environments unless
 * explicitly overridden with ALLOW_PRODUCTION_SEED=true.
 */

import { doc, setDoc } from 'firebase/firestore';
import { db } from '../src/lib/firebase';

interface NodeProcess {
  env: Record<string, string | undefined>;
  argv?: string[];
  exit?: (code?: number) => void;
}
declare const process: NodeProcess;

export function assertSafeEnvironment(): void {
  const isProd = process.env.NODE_ENV === 'production' || process.env.FIREBASE_PROJECT_ID?.includes('prod');
  if (isProd && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    throw new Error(
      'FATAL SECURITY LOCK: Seeding demo data is strictly prohibited in production environments. ' +
      'Set NODE_ENV=development or run against a local/staging emulator.'
    );
  }
}

export const DEMO_ORGANISATION_ID = 'org_demo_artsflow';

export const DEMO_DATA = {
  organisation: {
    id: DEMO_ORGANISATION_ID,
    organisationId: DEMO_ORGANISATION_ID,
    name: 'ArtsFlow Demo Arts Academy',
    contactEmail: 'demo@artsflow-academy.example.com',
    contactPhone: '+27 11 555 0100',
    address: '14 Performance Way, Braamfontein, Johannesburg, 2001',
    timezone: 'Africa/Johannesburg',
    currency: 'ZAR',
    status: 'active',
    tenantStatus: 'active',
    billingMode: 'complimentary',
    assignedPlanId: 'plan_professional',
    organisationType: 'music_and_dance',
    isDemoTenant: true
  },

  programmes: [
    {
      id: 'prog_demo_music',
      organisationId: DEMO_ORGANISATION_ID,
      name: 'Music Programme',
      description: 'Comprehensive orchestral, brass, strings, and instrumental performance tuition.',
      programmeType: 'music',
      status: 'active'
    },
    {
      id: 'prog_demo_dance',
      organisationId: DEMO_ORGANISATION_ID,
      name: 'Dance Programme',
      description: 'Classical ballet foundations, contemporary choreography, and ensemble repertoire.',
      programmeType: 'dance',
      status: 'active'
    }
  ],

  groups: [
    {
      id: 'grp_demo_brass',
      organisationId: DEMO_ORGANISATION_ID,
      programmeId: 'prog_demo_music',
      name: 'Junior Brass',
      level: 'intermediate',
      capacity: 15,
      status: 'active'
    },
    {
      id: 'grp_demo_orchestra',
      organisationId: DEMO_ORGANISATION_ID,
      programmeId: 'prog_demo_music',
      name: 'Senior Orchestra',
      level: 'advanced',
      capacity: 25,
      status: 'active'
    },
    {
      id: 'grp_demo_strings',
      organisationId: DEMO_ORGANISATION_ID,
      programmeId: 'prog_demo_music',
      name: 'Beginner Strings',
      level: 'beginner',
      capacity: 20,
      status: 'active'
    },
    {
      id: 'grp_demo_dance_senior',
      organisationId: DEMO_ORGANISATION_ID,
      programmeId: 'prog_demo_dance',
      name: 'Senior Dance',
      level: 'advanced',
      capacity: 16,
      status: 'active'
    }
  ],

  staff: [
    {
      id: 'staff_demo_conductor',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'Thabo',
      lastName: 'Mokoena',
      email: 'thabo.mokoena@artsflow-academy.example.com',
      mobileNumber: '+27 82 555 1001',
      role: 'Head of Music / Master Conductor',
      staffStatus: 'active',
      status: 'active'
    },
    {
      id: 'staff_demo_choreographer',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'Lerato',
      lastName: 'Dlamini',
      email: 'lerato.dlamini@artsflow-academy.example.com',
      mobileNumber: '+27 83 555 1002',
      role: 'Principal Dance Instructor',
      staffStatus: 'active',
      status: 'active'
    },
    {
      id: 'staff_demo_strings',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'Willem',
      lastName: 'Botha',
      email: 'willem.botha@artsflow-academy.example.com',
      mobileNumber: '+27 84 555 1003',
      role: 'Strings Director & Violin Tutor',
      staffStatus: 'active',
      status: 'active'
    },
    {
      id: 'staff_demo_dance_coach',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'Nomvula',
      lastName: 'Zulu',
      email: 'nomvula.zulu@artsflow-academy.example.com',
      mobileNumber: '+27 81 555 1004',
      role: 'Contemporary Dance Specialist',
      staffStatus: 'active',
      status: 'active'
    },
    {
      id: 'staff_demo_admin',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'Patricia',
      lastName: 'Meyer',
      email: 'patricia.meyer@artsflow-academy.example.com',
      mobileNumber: '+27 79 555 1005',
      role: 'Academy Registrar & Student Services',
      staffStatus: 'active',
      status: 'active'
    }
  ],

  learners: [
    {
      id: 'lrn_demo_01',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'Kagiso',
      lastName: 'Khumalo',
      preferredName: 'KG',
      email: 'kg.khumalo@example.com',
      phone: '+27 71 555 2001',
      dateOfBirth: '2010-04-15',
      learnerStatus: 'active',
      status: 'active'
    },
    {
      id: 'lrn_demo_02',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'Zanele',
      lastName: 'Ndlovu',
      preferredName: 'Zani',
      email: 'zanele.ndlovu@example.com',
      phone: '+27 72 555 2002',
      dateOfBirth: '2009-08-22',
      learnerStatus: 'active',
      status: 'active'
    },
    {
      id: 'lrn_demo_03',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'Liam',
      lastName: 'Naidoo',
      preferredName: 'Liam',
      email: 'liam.naidoo@example.com',
      phone: '+27 73 555 2003',
      dateOfBirth: '2011-01-10',
      learnerStatus: 'active',
      status: 'active'
    },
    {
      id: 'lrn_demo_04',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'Neo',
      lastName: 'Sithole',
      preferredName: 'Neo',
      email: 'neo.sithole@example.com',
      phone: '+27 74 555 2004',
      dateOfBirth: '2008-11-05',
      learnerStatus: 'active',
      status: 'active'
    },
    {
      id: 'lrn_demo_05',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'Chloe',
      lastName: 'Jacobs',
      preferredName: 'Chloe',
      email: 'chloe.jacobs@example.com',
      phone: '+27 76 555 2005',
      dateOfBirth: '2010-07-19',
      learnerStatus: 'active',
      status: 'active'
    },
    {
      id: 'lrn_demo_06',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'Amara',
      lastName: 'van der Merwe',
      preferredName: 'Amara',
      email: 'amara.vdm@example.com',
      phone: '+27 78 555 2006',
      dateOfBirth: '2009-03-30',
      learnerStatus: 'active',
      status: 'active'
    },
    {
      id: 'lrn_demo_07',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'Ethan',
      lastName: 'Pillay',
      preferredName: 'Ethan',
      email: 'ethan.pillay@example.com',
      phone: '+27 82 555 2007',
      dateOfBirth: '2011-09-12',
      learnerStatus: 'active',
      status: 'active'
    },
    {
      id: 'lrn_demo_08',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'Mia',
      lastName: 'Botha',
      preferredName: 'Mia',
      email: 'mia.botha@example.com',
      phone: '+27 83 555 2008',
      dateOfBirth: '2008-06-25',
      learnerStatus: 'active',
      status: 'active'
    },
    {
      id: 'lrn_demo_09',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'Tumelo',
      lastName: 'Mthembu',
      preferredName: 'Tumelo',
      email: 'tumelo.m@example.com',
      phone: '+27 84 555 2009',
      dateOfBirth: '2010-12-03',
      learnerStatus: 'active',
      status: 'active'
    },
    {
      id: 'lrn_demo_10',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'Sophia',
      lastName: 'Ferreira',
      preferredName: 'Sophie',
      email: 'sophia.f@example.com',
      phone: '+27 81 555 2010',
      dateOfBirth: '2011-05-18',
      learnerStatus: 'active',
      status: 'active'
    },
    {
      id: 'lrn_demo_11',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'Ayanda',
      lastName: 'Dube',
      preferredName: 'Aya',
      email: 'ayanda.dube@example.com',
      phone: '+27 79 555 2011',
      dateOfBirth: '2009-02-14',
      learnerStatus: 'active',
      status: 'active'
    },
    {
      id: 'lrn_demo_12',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'Joshua',
      lastName: 'Coetzee',
      preferredName: 'Josh',
      email: 'josh.c@example.com',
      phone: '+27 72 555 2012',
      dateOfBirth: '2010-10-08',
      learnerStatus: 'active',
      status: 'active'
    }
  ],

  guardians: [
    {
      id: 'grd_demo_01',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'Sipho',
      lastName: 'Khumalo',
      email: 'sipho.khumalo@example.com',
      mobileNumber: '+27 82 555 3001',
      relationship: 'father',
      status: 'active'
    },
    {
      id: 'grd_demo_02',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'Priya',
      lastName: 'Naidoo',
      email: 'priya.naidoo@example.com',
      mobileNumber: '+27 83 555 3002',
      relationship: 'mother',
      status: 'active'
    },
    {
      id: 'grd_demo_03',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'Busi',
      lastName: 'Sithole',
      email: 'busi.sithole@example.com',
      mobileNumber: '+27 84 555 3003',
      relationship: 'mother',
      status: 'active'
    },
    {
      id: 'grd_demo_04',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'Johan',
      lastName: 'van der Merwe',
      email: 'johan.vdm@example.com',
      mobileNumber: '+27 81 555 3004',
      relationship: 'father',
      status: 'active'
    },
    {
      id: 'grd_demo_05',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'David',
      lastName: 'Jacobs',
      email: 'david.jacobs@example.com',
      mobileNumber: '+27 79 555 3005',
      relationship: 'father',
      status: 'active'
    },
    {
      id: 'grd_demo_06',
      organisationId: DEMO_ORGANISATION_ID,
      firstName: 'Rashida',
      lastName: 'Pillay',
      email: 'rashida.pillay@example.com',
      mobileNumber: '+27 72 555 3006',
      relationship: 'mother',
      status: 'active'
    }
  ],

  enrolments: [
    { id: 'enr_demo_01', organisationId: DEMO_ORGANISATION_ID, learnerId: 'lrn_demo_01', groupId: 'grp_demo_brass', status: 'active', enrolmentStatus: 'active' },
    { id: 'enr_demo_02', organisationId: DEMO_ORGANISATION_ID, learnerId: 'lrn_demo_01', groupId: 'grp_demo_orchestra', status: 'active', enrolmentStatus: 'active' },
    { id: 'enr_demo_03', organisationId: DEMO_ORGANISATION_ID, learnerId: 'lrn_demo_02', groupId: 'grp_demo_strings', status: 'active', enrolmentStatus: 'active' },
    { id: 'enr_demo_04', organisationId: DEMO_ORGANISATION_ID, learnerId: 'lrn_demo_03', groupId: 'grp_demo_brass', status: 'active', enrolmentStatus: 'active' },
    { id: 'enr_demo_05', organisationId: DEMO_ORGANISATION_ID, learnerId: 'lrn_demo_04', groupId: 'grp_demo_dance_senior', status: 'active', enrolmentStatus: 'active' },
    { id: 'enr_demo_06', organisationId: DEMO_ORGANISATION_ID, learnerId: 'lrn_demo_05', groupId: 'grp_demo_strings', status: 'active', enrolmentStatus: 'active' },
    { id: 'enr_demo_07', organisationId: DEMO_ORGANISATION_ID, learnerId: 'lrn_demo_06', groupId: 'grp_demo_orchestra', status: 'active', enrolmentStatus: 'active' },
    { id: 'enr_demo_08', organisationId: DEMO_ORGANISATION_ID, learnerId: 'lrn_demo_07', groupId: 'grp_demo_brass', status: 'active', enrolmentStatus: 'active' },
    { id: 'enr_demo_09', organisationId: DEMO_ORGANISATION_ID, learnerId: 'lrn_demo_08', groupId: 'grp_demo_dance_senior', status: 'active', enrolmentStatus: 'active' },
    { id: 'enr_demo_10', organisationId: DEMO_ORGANISATION_ID, learnerId: 'lrn_demo_09', groupId: 'grp_demo_orchestra', status: 'active', enrolmentStatus: 'active' },
    { id: 'enr_demo_11', organisationId: DEMO_ORGANISATION_ID, learnerId: 'lrn_demo_10', groupId: 'grp_demo_strings', status: 'active', enrolmentStatus: 'active' },
    { id: 'enr_demo_12', organisationId: DEMO_ORGANISATION_ID, learnerId: 'lrn_demo_11', groupId: 'grp_demo_dance_senior', status: 'active', enrolmentStatus: 'active' }
  ],

  sessions: [
    {
      id: 'sess_demo_past_strings',
      organisationId: DEMO_ORGANISATION_ID,
      groupId: 'grp_demo_strings',
      staffId: 'staff_demo_strings',
      title: 'Beginner Strings Weekly Rehearsal',
      sessionDate: '2026-09-02',
      startTime: '14:00',
      endTime: '15:30',
      status: 'completed',
      sessionStatus: 'completed'
    },
    {
      id: 'sess_demo_past_dance',
      organisationId: DEMO_ORGANISATION_ID,
      groupId: 'grp_demo_dance_senior',
      staffId: 'staff_demo_choreographer',
      title: 'Senior Contemporary Dance Masterclass',
      sessionDate: '2026-09-02',
      startTime: '15:30',
      endTime: '17:00',
      status: 'completed',
      sessionStatus: 'completed'
    },
    {
      id: 'sess_demo_today_brass',
      organisationId: DEMO_ORGANISATION_ID,
      groupId: 'grp_demo_brass',
      staffId: 'staff_demo_conductor',
      title: 'Junior Brass Sectional & Intonation',
      sessionDate: '2026-09-03',
      startTime: '14:30',
      endTime: '16:00',
      status: 'scheduled',
      sessionStatus: 'scheduled'
    },
    {
      id: 'sess_demo_upcoming_orch',
      organisationId: DEMO_ORGANISATION_ID,
      groupId: 'grp_demo_orchestra',
      staffId: 'staff_demo_conductor',
      title: 'Senior Orchestra Full Ensemble Rehearsal',
      sessionDate: '2026-09-04',
      startTime: '16:00',
      endTime: '18:00',
      status: 'scheduled',
      sessionStatus: 'scheduled'
    }
  ],

  attendance: [
    { id: 'att_demo_01', organisationId: DEMO_ORGANISATION_ID, sessionId: 'sess_demo_past_strings', learnerId: 'lrn_demo_02', status: 'present', attendanceStatus: 'present' },
    { id: 'att_demo_02', organisationId: DEMO_ORGANISATION_ID, sessionId: 'sess_demo_past_strings', learnerId: 'lrn_demo_05', status: 'present', attendanceStatus: 'present' },
    { id: 'att_demo_03', organisationId: DEMO_ORGANISATION_ID, sessionId: 'sess_demo_past_strings', learnerId: 'lrn_demo_10', status: 'present', attendanceStatus: 'present' },
    { id: 'att_demo_04', organisationId: DEMO_ORGANISATION_ID, sessionId: 'sess_demo_past_dance', learnerId: 'lrn_demo_04', status: 'present', attendanceStatus: 'present' },
    { id: 'att_demo_05', organisationId: DEMO_ORGANISATION_ID, sessionId: 'sess_demo_past_dance', learnerId: 'lrn_demo_08', status: 'present', attendanceStatus: 'present' },
    { id: 'att_demo_06', organisationId: DEMO_ORGANISATION_ID, sessionId: 'sess_demo_past_dance', learnerId: 'lrn_demo_11', status: 'late', attendanceStatus: 'late' }
  ],

  instruments: [
    {
      id: 'inst_demo_trumpet',
      organisationId: DEMO_ORGANISATION_ID,
      assetNumber: 'AF-MUS-001',
      instrumentType: 'Trumpet',
      make: 'Yamaha',
      model: 'YTR-2330',
      serialNumber: 'YTR-8812-ZA',
      ownershipType: 'school_owned',
      condition: 'excellent',
      instrumentStatus: 'allocated',
      status: 'active'
    },
    {
      id: 'inst_demo_trombone',
      organisationId: DEMO_ORGANISATION_ID,
      assetNumber: 'AF-MUS-002',
      instrumentType: 'Trombone',
      make: 'Bach',
      model: 'Aristocrat TB-501',
      serialNumber: 'TB-4491-ZA',
      ownershipType: 'school_owned',
      condition: 'good',
      instrumentStatus: 'allocated',
      status: 'active'
    },
    {
      id: 'inst_demo_violin',
      organisationId: DEMO_ORGANISATION_ID,
      assetNumber: 'AF-MUS-003',
      instrumentType: 'Violin',
      make: 'Stentor',
      model: 'Student I 4/4',
      serialNumber: 'ST-9921-ZA',
      ownershipType: 'school_owned',
      condition: 'excellent',
      instrumentStatus: 'allocated',
      status: 'active'
    },
    {
      id: 'inst_demo_cello',
      organisationId: DEMO_ORGANISATION_ID,
      assetNumber: 'AF-MUS-004',
      instrumentType: 'Cello',
      make: 'Primavera',
      model: '200 Series 4/4',
      serialNumber: 'PR-3320-ZA',
      ownershipType: 'school_owned',
      condition: 'good',
      instrumentStatus: 'allocated',
      status: 'active'
    }
  ],

  instrumentAllocations: [
    {
      id: 'alloc_demo_trumpet',
      organisationId: DEMO_ORGANISATION_ID,
      instrumentId: 'inst_demo_trumpet',
      learnerId: 'lrn_demo_01',
      allocatedDate: '2026-08-01',
      conditionOut: 'excellent',
      allocationStatus: 'active',
      status: 'active'
    },
    {
      id: 'alloc_demo_trombone',
      organisationId: DEMO_ORGANISATION_ID,
      instrumentId: 'inst_demo_trombone',
      learnerId: 'lrn_demo_03',
      allocatedDate: '2026-08-01',
      conditionOut: 'good',
      allocationStatus: 'active',
      status: 'active'
    },
    {
      id: 'alloc_demo_violin',
      organisationId: DEMO_ORGANISATION_ID,
      instrumentId: 'inst_demo_violin',
      learnerId: 'lrn_demo_02',
      allocatedDate: '2026-08-01',
      conditionOut: 'excellent',
      allocationStatus: 'active',
      status: 'active'
    },
    {
      id: 'alloc_demo_cello',
      organisationId: DEMO_ORGANISATION_ID,
      instrumentId: 'inst_demo_cello',
      learnerId: 'lrn_demo_05',
      allocatedDate: '2026-08-01',
      conditionOut: 'good',
      allocationStatus: 'active',
      status: 'active'
    }
  ],

  repertoire: [
    {
      id: 'rep_demo_fanfare',
      organisationId: DEMO_ORGANISATION_ID,
      programmeId: 'prog_demo_music',
      groupId: 'grp_demo_brass',
      title: 'Liberty Fanfare',
      composer: 'John Williams',
      arranger: 'Paul Lavender',
      difficulty: 'intermediate',
      durationMinutes: 4,
      repertoireStatus: 'rehearsing',
      status: 'active'
    },
    {
      id: 'rep_demo_vivaldi',
      organisationId: DEMO_ORGANISATION_ID,
      programmeId: 'prog_demo_music',
      groupId: 'grp_demo_strings',
      title: 'Spring from The Four Seasons (Allegro)',
      composer: 'Antonio Vivaldi',
      arranger: 'Sandra Dackow',
      difficulty: 'beginner',
      durationMinutes: 3,
      repertoireStatus: 'learning',
      status: 'active'
    },
    {
      id: 'rep_demo_dvorak',
      organisationId: DEMO_ORGANISATION_ID,
      programmeId: 'prog_demo_music',
      groupId: 'grp_demo_orchestra',
      title: 'Symphony No. 9 "From the New World" - Largo',
      composer: 'Antonín Dvořák',
      difficulty: 'advanced',
      durationMinutes: 7,
      repertoireStatus: 'performance_ready',
      status: 'active'
    }
  ],

  practiceLogs: [
    {
      id: 'prac_demo_01',
      organisationId: DEMO_ORGANISATION_ID,
      learnerId: 'lrn_demo_01',
      groupId: 'grp_demo_brass',
      practiceDate: '2026-09-02',
      durationMinutes: 40,
      practiceType: 'home_practice',
      notes: 'Focused on double-tonguing and high G accuracy in Liberty Fanfare.',
      teacherComment: 'Noticeable improvement in tone clarity.',
      status: 'active'
    },
    {
      id: 'prac_demo_02',
      organisationId: DEMO_ORGANISATION_ID,
      learnerId: 'lrn_demo_02',
      groupId: 'grp_demo_strings',
      practiceDate: '2026-09-02',
      durationMinutes: 35,
      practiceType: 'home_practice',
      notes: 'Practiced Vivaldi Spring mm. 1-28 with metronome at 80 bpm.',
      teacherComment: 'Keep bowing wrist relaxed.',
      status: 'active'
    }
  ],

  musicAssessments: [
    {
      id: 'mass_demo_01',
      organisationId: DEMO_ORGANISATION_ID,
      learnerId: 'lrn_demo_01',
      groupId: 'grp_demo_brass',
      teacherId: 'staff_demo_conductor',
      assessmentDate: '2026-08-28',
      assessmentType: 'term_assessment',
      tone: 88,
      technique: 90,
      rhythm: 86,
      musicality: 88,
      overallScore: 88,
      teacherComment: 'Outstanding breath stamina and rapid articulation development.',
      nextSteps: 'Work on lyrical phrasing in dynamic soft sections.',
      status: 'active'
    }
  ],

  choreography: [
    {
      id: 'choreo_demo_echoes',
      organisationId: DEMO_ORGANISATION_ID,
      programmeId: 'prog_demo_dance',
      groupId: 'grp_demo_dance_senior',
      title: 'Echoes of Dawn',
      choreographer: 'Lerato Dlamini',
      style: 'Contemporary / Afro-Fusion',
      difficulty: 'advanced',
      durationMinutes: 5,
      musicTitle: 'Imbube Reflections',
      choreographyStatus: 'rehearsing',
      status: 'active'
    }
  ],

  danceAssessments: [
    {
      id: 'dass_demo_01',
      organisationId: DEMO_ORGANISATION_ID,
      learnerId: 'lrn_demo_04',
      groupId: 'grp_demo_dance_senior',
      teacherId: 'staff_demo_choreographer',
      assessmentDate: '2026-08-29',
      assessmentType: 'performance_readiness',
      technique: 92,
      timing: 90,
      coordination: 94,
      musicality: 90,
      overallScore: 92,
      teacherComment: 'Superb leap extension and expressive artistic presence.',
      nextSteps: 'Focus on transition pacing during floor floorwork sequences.',
      status: 'active'
    }
  ],

  events: [
    {
      id: 'event_demo_showcase',
      organisationId: DEMO_ORGANISATION_ID,
      name: 'Spring Arts Showcase',
      eventType: 'showcase',
      description: 'Annual flagship academy gala featuring Junior Brass, Senior Orchestra, Beginner Strings, and Senior Dance.',
      startDate: '2026-09-18',
      endDate: '2026-09-18',
      startTime: '18:00',
      endTime: '21:00',
      venue: 'Linder Auditorium, Johannesburg',
      address: '27 St Andrews Rd, Parktown, Johannesburg, 2193',
      eventStatus: 'confirmed',
      organiser: 'ArtsFlow Demo Arts Academy',
      status: 'active'
    }
  ],

  eventParticipants: [
    { id: 'ep_demo_01', organisationId: DEMO_ORGANISATION_ID, eventId: 'event_demo_showcase', learnerId: 'lrn_demo_01', participantRole: 'soloist', participationStatus: 'confirmed', status: 'active' },
    { id: 'ep_demo_02', organisationId: DEMO_ORGANISATION_ID, eventId: 'event_demo_showcase', learnerId: 'lrn_demo_02', participantRole: 'performer', participationStatus: 'confirmed', status: 'active' },
    { id: 'ep_demo_03', organisationId: DEMO_ORGANISATION_ID, eventId: 'event_demo_showcase', learnerId: 'lrn_demo_03', participantRole: 'performer', participationStatus: 'confirmed', status: 'active' },
    { id: 'ep_demo_04', organisationId: DEMO_ORGANISATION_ID, eventId: 'event_demo_showcase', learnerId: 'lrn_demo_04', participantRole: 'performer', participationStatus: 'confirmed', status: 'active' },
    { id: 'ep_demo_05', organisationId: DEMO_ORGANISATION_ID, eventId: 'event_demo_showcase', learnerId: 'lrn_demo_05', participantRole: 'performer', participationStatus: 'confirmed', status: 'active' },
    { id: 'ep_demo_06', organisationId: DEMO_ORGANISATION_ID, eventId: 'event_demo_showcase', learnerId: 'lrn_demo_08', participantRole: 'performer', participationStatus: 'confirmed', status: 'active' }
  ],

  consentRequests: [
    {
      id: 'creq_demo_01',
      organisationId: DEMO_ORGANISATION_ID,
      eventId: 'event_demo_showcase',
      learnerId: 'lrn_demo_01',
      guardianId: 'grd_demo_01',
      templateId: 'tmpl_gala_consent',
      requestStatus: 'approved',
      requestedAt: '2026-08-20T08:00:00.000Z',
      submittedAt: '2026-08-22T10:15:00.000Z',
      status: 'active'
    },
    {
      id: 'creq_demo_02',
      organisationId: DEMO_ORGANISATION_ID,
      eventId: 'event_demo_showcase',
      learnerId: 'lrn_demo_03',
      guardianId: 'grd_demo_02',
      templateId: 'tmpl_gala_consent',
      requestStatus: 'approved',
      requestedAt: '2026-08-20T08:00:00.000Z',
      submittedAt: '2026-08-23T14:20:00.000Z',
      status: 'active'
    }
  ],

  transportPlans: [
    {
      id: 'trans_demo_showcase',
      organisationId: DEMO_ORGANISATION_ID,
      eventId: 'event_demo_showcase',
      planName: 'Showcase Performer Coach Route A',
      vehicleName: '35-Seater Scania Coach (Reg: AF-BUS-01)',
      departureLocation: 'Academy Main Campus, 14 Performance Way',
      arrivalLocation: 'Linder Auditorium, Parktown',
      departureDate: '2026-09-18',
      departureTime: '15:30',
      returnDate: '2026-09-18',
      returnTime: '21:30',
      driverName: 'Lucas Sithole',
      driverPhone: '+27 82 555 4001',
      vehicleCapacity: 35,
      transportStatus: 'confirmed',
      status: 'active'
    }
  ],

  charges: [
    {
      id: 'chg_demo_01',
      organisationId: DEMO_ORGANISATION_ID,
      learnerId: 'lrn_demo_01',
      guardianId: 'grd_demo_01',
      chargeTypeId: 'chgtype_tuition',
      description: 'Term 3 Instrumental Music Tuition (Junior Brass)',
      quantity: 1,
      unitAmount: 180000,
      amount: 180000,
      currency: 'ZAR',
      chargeDate: '2026-08-01',
      chargeStatus: 'invoiced',
      status: 'active'
    },
    {
      id: 'chg_demo_02',
      organisationId: DEMO_ORGANISATION_ID,
      learnerId: 'lrn_demo_04',
      guardianId: 'grd_demo_03',
      chargeTypeId: 'chgtype_tuition',
      description: 'Term 3 Senior Contemporary Dance Tuition',
      quantity: 1,
      unitAmount: 160000,
      amount: 160000,
      currency: 'ZAR',
      chargeDate: '2026-08-01',
      chargeStatus: 'invoiced',
      status: 'active'
    },
    {
      id: 'chg_demo_03',
      organisationId: DEMO_ORGANISATION_ID,
      learnerId: 'lrn_demo_03',
      guardianId: 'grd_demo_02',
      chargeTypeId: 'chgtype_instrument',
      description: 'Term 3 Trombone Instrument Hire',
      quantity: 1,
      unitAmount: 45000,
      amount: 45000,
      currency: 'ZAR',
      chargeDate: '2026-08-01',
      chargeStatus: 'invoiced',
      status: 'active'
    }
  ],

  invoices: [
    {
      id: 'inv_demo_01',
      organisationId: DEMO_ORGANISATION_ID,
      invoiceNumber: 'INV-2026-000001',
      learnerId: 'lrn_demo_01',
      guardianId: 'grd_demo_01',
      issueDate: '2026-08-01',
      dueDate: '2026-08-31',
      currency: 'ZAR',
      subtotal: 180000,
      discountTotal: 0,
      waiverTotal: 0,
      total: 180000,
      amountPaid: 180000,
      balance: 0,
      invoiceStatus: 'paid',
      issuedAt: '2026-08-01T08:00:00.000Z',
      status: 'active'
    },
    {
      id: 'inv_demo_02',
      organisationId: DEMO_ORGANISATION_ID,
      invoiceNumber: 'INV-2026-000002',
      learnerId: 'lrn_demo_04',
      guardianId: 'grd_demo_03',
      issueDate: '2026-08-01',
      dueDate: '2026-08-31',
      currency: 'ZAR',
      subtotal: 160000,
      discountTotal: 0,
      waiverTotal: 0,
      total: 160000,
      amountPaid: 100000,
      balance: 60000,
      invoiceStatus: 'partially_paid',
      issuedAt: '2026-08-01T08:00:00.000Z',
      status: 'active'
    },
    {
      id: 'inv_demo_03',
      organisationId: DEMO_ORGANISATION_ID,
      invoiceNumber: 'INV-2026-000003',
      learnerId: 'lrn_demo_03',
      guardianId: 'grd_demo_02',
      issueDate: '2026-08-05',
      dueDate: '2026-09-05',
      currency: 'ZAR',
      subtotal: 45000,
      discountTotal: 0,
      waiverTotal: 0,
      total: 45000,
      amountPaid: 0,
      balance: 45000,
      invoiceStatus: 'issued',
      issuedAt: '2026-08-05T08:00:00.000Z',
      status: 'active'
    }
  ],

  payments: [
    {
      id: 'pay_demo_01',
      organisationId: DEMO_ORGANISATION_ID,
      paymentNumber: 'PAY-2026-000001',
      learnerId: 'lrn_demo_01',
      guardianId: 'grd_demo_01',
      paymentDate: '2026-08-10',
      amount: 180000,
      allocatedAmount: 180000,
      currency: 'ZAR',
      paymentMethod: 'eft',
      reference: 'EFT-KHUMALO-T3',
      receivedBy: 'staff_demo_admin',
      paymentStatus: 'allocated',
      status: 'active'
    },
    {
      id: 'pay_demo_02',
      organisationId: DEMO_ORGANISATION_ID,
      paymentNumber: 'PAY-2026-000002',
      learnerId: 'lrn_demo_04',
      guardianId: 'grd_demo_03',
      paymentDate: '2026-08-15',
      amount: 100000,
      allocatedAmount: 100000,
      currency: 'ZAR',
      paymentMethod: 'eft',
      reference: 'EFT-SITHOLE-PART1',
      receivedBy: 'staff_demo_admin',
      paymentStatus: 'partially_allocated',
      status: 'active'
    }
  ],

  communications: [
    {
      id: 'comm_demo_welcome',
      organisationId: DEMO_ORGANISATION_ID,
      communicationType: 'general',
      channel: 'email',
      subject: 'Welcome to Term 3 at ArtsFlow Demo Arts Academy',
      body: 'Dear Parents & Guardians, we are excited to commence our Spring season rehearsals and gala preparations.',
      communicationStatus: 'sent',
      sentAt: '2026-08-01T09:00:00.000Z',
      status: 'active'
    },
    {
      id: 'comm_demo_showcase',
      organisationId: DEMO_ORGANISATION_ID,
      communicationType: 'event',
      channel: 'email',
      subject: 'Spring Arts Showcase: Rehearsal Call Times & Transport Schedule',
      body: 'Important logistics notice for performers in Junior Brass, Senior Orchestra, Beginner Strings, and Senior Dance.',
      communicationStatus: 'sent',
      sentAt: '2026-08-25T11:30:00.000Z',
      status: 'active'
    }
  ],

  documents: [
    {
      id: 'doc_demo_conduct',
      organisationId: DEMO_ORGANISATION_ID,
      fileName: 'Arts Academy Code of Conduct & Safety Guidelines 2026.pdf',
      fileType: 'application/pdf',
      fileSize: 245000,
      category: 'policy',
      status: 'active'
    },
    {
      id: 'doc_demo_calendar',
      organisationId: DEMO_ORGANISATION_ID,
      fileName: 'Term 3 Performance & Rehearsal Calendar.pdf',
      fileType: 'application/pdf',
      fileSize: 180000,
      category: 'schedule',
      status: 'active'
    }
  ],

  automationRules: [
    {
      id: 'rule_demo_absence_alert',
      organisationId: DEMO_ORGANISATION_ID,
      name: 'Notify Guardian on Unexcused Absence',
      triggerType: 'attendance_marked',
      status: 'active',
      ruleStatus: 'active'
    },
    {
      id: 'rule_demo_invoice_reminder',
      organisationId: DEMO_ORGANISATION_ID,
      name: 'Send Payment Reminder 3 Days Before Due Date',
      triggerType: 'invoice_due',
      status: 'active',
      ruleStatus: 'active'
    }
  ],

  followUps: [
    {
      id: 'followup_demo_valve_service',
      organisationId: DEMO_ORGANISATION_ID,
      category: 'instruments',
      subject: 'Schedule annual brass valve servicing with technician',
      description: 'Contact Yamaha service centre for valve calibration and ultrasonic clean of all academy student brass.',
      ownerId: 'staff_demo_conductor',
      priority: 'normal',
      followUpStatus: 'open',
      dueDate: '2026-09-15',
      status: 'active'
    },
    {
      id: 'followup_demo_scholarship',
      organisationId: DEMO_ORGANISATION_ID,
      category: 'finance',
      subject: 'Review merit scholarship application for Liam Naidoo',
      description: 'Evaluate Term 3 tuition grant following regional eisteddfod gold award.',
      ownerId: 'staff_demo_admin',
      priority: 'high',
      followUpStatus: 'in_progress',
      dueDate: '2026-09-10',
      status: 'active'
    }
  ]
};

export async function runDemoSeed(dryRun: boolean = true): Promise<{
  success: boolean;
  organisationId: string;
  recordCounts: Record<string, number>;
  dryRun: boolean;
}> {
  assertSafeEnvironment();

  const recordCounts = {
    organisations: 1,
    programmes: DEMO_DATA.programmes.length,
    groups: DEMO_DATA.groups.length,
    staff: DEMO_DATA.staff.length,
    learners: DEMO_DATA.learners.length,
    guardians: DEMO_DATA.guardians.length,
    enrolments: DEMO_DATA.enrolments.length,
    sessions: DEMO_DATA.sessions.length,
    attendance: DEMO_DATA.attendance.length,
    instruments: DEMO_DATA.instruments.length,
    instrumentAllocations: DEMO_DATA.instrumentAllocations.length,
    repertoire: DEMO_DATA.repertoire.length,
    practiceLogs: DEMO_DATA.practiceLogs.length,
    musicAssessments: DEMO_DATA.musicAssessments.length,
    choreography: DEMO_DATA.choreography.length,
    danceAssessments: DEMO_DATA.danceAssessments.length,
    events: DEMO_DATA.events.length,
    eventParticipants: DEMO_DATA.eventParticipants.length,
    consentRequests: DEMO_DATA.consentRequests.length,
    transportPlans: DEMO_DATA.transportPlans.length,
    charges: DEMO_DATA.charges.length,
    invoices: DEMO_DATA.invoices.length,
    payments: DEMO_DATA.payments.length,
    communications: DEMO_DATA.communications.length,
    documents: DEMO_DATA.documents.length,
    automationRules: DEMO_DATA.automationRules.length,
    followUps: DEMO_DATA.followUps.length
  };

  if (dryRun) {
    console.log('[SEED] Dry run completed successfully. Records validated for seeding:', recordCounts);
    return {
      success: true,
      organisationId: DEMO_ORGANISATION_ID,
      recordCounts,
      dryRun: true
    };
  }

  console.log(`[SEED] Writing ${Object.values(recordCounts).reduce((a, b) => a + b, 0)} live demo records to Firestore...`);
  const now = new Date().toISOString();

  // Organisation
  await setDoc(doc(db, 'organisations', DEMO_ORGANISATION_ID), {
    ...DEMO_DATA.organisation,
    updatedAt: now,
    createdAt: now
  }, { merge: true });

  // Collections helper
  const collectionsMap: Record<string, Array<{ id: string; [key: string]: unknown }>> = {
    programmes: DEMO_DATA.programmes,
    groups: DEMO_DATA.groups,
    staff: DEMO_DATA.staff,
    learners: DEMO_DATA.learners,
    guardians: DEMO_DATA.guardians,
    enrolments: DEMO_DATA.enrolments,
    sessions: DEMO_DATA.sessions,
    attendance: DEMO_DATA.attendance,
    instruments: DEMO_DATA.instruments,
    instrumentAllocations: DEMO_DATA.instrumentAllocations,
    repertoire: DEMO_DATA.repertoire,
    practiceLogs: DEMO_DATA.practiceLogs,
    musicAssessments: DEMO_DATA.musicAssessments,
    choreography: DEMO_DATA.choreography,
    danceAssessments: DEMO_DATA.danceAssessments,
    events: DEMO_DATA.events,
    eventParticipants: DEMO_DATA.eventParticipants,
    consentRequests: DEMO_DATA.consentRequests,
    transportPlans: DEMO_DATA.transportPlans,
    charges: DEMO_DATA.charges,
    invoices: DEMO_DATA.invoices,
    payments: DEMO_DATA.payments,
    communications: DEMO_DATA.communications,
    documents: DEMO_DATA.documents,
    automationRules: DEMO_DATA.automationRules,
    followUps: DEMO_DATA.followUps
  };

  for (const [colName, records] of Object.entries(collectionsMap)) {
    for (const rec of records) {
      await setDoc(doc(db, colName, rec.id), {
        ...rec,
        updatedAt: now,
        createdAt: now
      }, { merge: true });
    }
  }

  console.log('[SEED] Live database seeding completed successfully.');
  return {
    success: true,
    organisationId: DEMO_ORGANISATION_ID,
    recordCounts,
    dryRun: false
  };
}

// Allow direct execution from CLI
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.endsWith('seed-demo.ts')) {
  try {
    const isDry = process.argv.includes('--dry-run') || !process.argv.includes('--live');
    runDemoSeed(isDry).then(res => {
      console.log('[SEED RESULT]', JSON.stringify(res, null, 2));
    });
  } catch (err) {
    console.error((err as Error).message);
    process.exit?.(1);
  }
}
