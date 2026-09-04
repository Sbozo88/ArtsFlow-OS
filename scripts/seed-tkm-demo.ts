/**
 * ArtsFlow OS — TKM Master Register Demo Auto-Population System
 *
 * Populates a dedicated internal demonstration organisation:
 * - Organisation: "TKM Demo — Thabang Ka Mmino" (org_demo_tkm)
 * - 46 Learners from Consolidated_TKM_Master_Student_Database.pdf
 *   - Exactly 28 Active, 6 Pending, 8 Verify, 2 Unconfirmed Details, 2 Inactive
 *   - Exactly zero parent contact PII imported (no real phone numbers, emails, addresses)
 *   - Preservation of source verification notes and audit traceability
 * - 15 Operational Demo Staff records (non-login, operational titles only)
 * - 6 Programmes: Instrumental Music, Orchestra, Marimba & Percussion, Recorder, Music Theory, Dance
 * - 11 Groups reflecting actual TKM streams and classes
 * - Multi-Enrolment Architecture (one learner record, multiple enrolments)
 * - Demo Sessions (past & upcoming) & Demo Attendance with realistic distribution
 * - Demo Instruments (TKM-DEMO-* series) with demo allocations
 * - Demo Repertoire, Demo Event ("TKM Demo Showcase"), and Sample Demo Finance
 *
 * STRICT SAFETY LOCK:
 * - Target organisation is strictly `org_demo_tkm`.
 * - Aborts and refuses execution if target resolves to `org_tkm_pilot` or non-demo org.
 * - Live write requires explicit `ALLOW_PRODUCTION_SEED=true`.
 * - Idempotent via deterministic IDs and setDoc(..., { merge: true }).
 */

import { doc, setDoc } from 'firebase/firestore';
import { db } from '../src/lib/firebase';

interface NodeProcess {
  env: Record<string, string | undefined>;
  argv?: string[];
  exit?: (code?: number) => void;
}
declare const process: NodeProcess;

export const TKM_DEMO_ORGANISATION_ID = 'org_demo_tkm';
export const FORBIDDEN_PILOT_ORGANISATION_ID = 'org_tkm_pilot';

export function assertTkmSafeEnvironment(options?: { allowProdOverride?: boolean }): void {
  const isProd = process.env.NODE_ENV === 'production' || process.env.FIREBASE_PROJECT_ID?.includes('prod');
  const allowProd = options?.allowProdOverride ?? (process.env.ALLOW_PRODUCTION_SEED === 'true');

  if (isProd && !allowProd) {
    throw new Error(
      'FATAL SECURITY LOCK: Seeding TKM demo data to production is prohibited without explicit authorization. ' +
      'Set ALLOW_PRODUCTION_SEED=true to proceed with live seeding.'
    );
  }

  // Double check that target org is never a production real pilot org
  if ((TKM_DEMO_ORGANISATION_ID as string) === FORBIDDEN_PILOT_ORGANISATION_ID) {
    throw new Error(
      `FATAL SAFETY LOCK: Target organisation cannot be ${FORBIDDEN_PILOT_ORGANISATION_ID}. Must be ${TKM_DEMO_ORGANISATION_ID}.`
    );
  }
}

export interface TkmLearnerSourceRecord {
  num: number;
  firstName: string;
  lastName: string;
  sourceClass: string;
  sourceStatus: 'ACTIVE' | 'PENDING' | 'VERIFY' | 'UNCONFIRMED DETAILS' | 'INACTIVE';
  groupId: string;
  programmeId: string;
  verificationNote?: string;
}

export const TKM_LEARNERS_RAW: TkmLearnerSourceRecord[] = [
  { num: 1, firstName: 'Lehakwe', lastName: 'Molefe', sourceClass: 'Violin', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_violin', programmeId: 'prog_tkm_instrumental' },
  { num: 2, firstName: 'Luthando', lastName: 'Tom', sourceClass: 'Violin', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_violin', programmeId: 'prog_tkm_instrumental' },
  { num: 3, firstName: 'Mahlatse', lastName: 'Nkoana', sourceClass: 'Violin', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_violin', programmeId: 'prog_tkm_instrumental' },
  { num: 4, firstName: 'Melokuhle', lastName: 'Tshabalala', sourceClass: 'Violin', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_violin', programmeId: 'prog_tkm_instrumental' },
  { num: 5, firstName: 'Okuhle', lastName: 'Ngema', sourceClass: 'Violin', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_violin', programmeId: 'prog_tkm_instrumental' },
  { num: 6, firstName: 'Siphimphilo', lastName: 'Masoku', sourceClass: 'Violin', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_violin', programmeId: 'prog_tkm_instrumental' },
  { num: 7, firstName: 'Tlhalefo', lastName: 'Mbundu', sourceClass: 'Violin', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_violin', programmeId: 'prog_tkm_instrumental' },
  { num: 8, firstName: 'Tokelo', lastName: 'Ntlhoka', sourceClass: 'Violin / Viola', sourceStatus: 'VERIFY', groupId: 'grp_tkm_violin', programmeId: 'prog_tkm_instrumental', verificationNote: 'Conflicting forms: Violin / Viola dual entry' },
  { num: 9, firstName: 'Asemahle', lastName: 'Mpofu', sourceClass: 'Viola', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_viola', programmeId: 'prog_tkm_instrumental' },
  { num: 10, firstName: 'Kopano', lastName: 'Mathebe', sourceClass: 'Viola', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_viola', programmeId: 'prog_tkm_instrumental' },
  { num: 11, firstName: 'Sibongile', lastName: 'Sebesho', sourceClass: 'Viola', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_viola', programmeId: 'prog_tkm_instrumental' },
  { num: 12, firstName: 'Amogelang', lastName: 'Mchunu', sourceClass: 'Cello', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_cello', programmeId: 'prog_tkm_instrumental' },
  { num: 13, firstName: 'Lesego', lastName: 'Mathebe', sourceClass: 'Cello', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_cello', programmeId: 'prog_tkm_instrumental' },
  { num: 14, firstName: 'Luyanda Khumoetsile', lastName: 'Qaphai', sourceClass: 'Flute', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_flute', programmeId: 'prog_tkm_instrumental' },
  { num: 15, firstName: 'Otsile Unathi', lastName: 'Setlhapelo', sourceClass: 'Flute', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_flute', programmeId: 'prog_tkm_instrumental' },
  { num: 16, firstName: 'Thato', lastName: 'Majafa', sourceClass: 'Flute', sourceStatus: 'VERIFY', groupId: 'grp_tkm_flute', programmeId: 'prog_tkm_instrumental', verificationNote: 'Match form and physical register' },
  { num: 17, firstName: 'Kulani', lastName: 'Mafatle', sourceClass: 'Clarinet', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_clarinet', programmeId: 'prog_tkm_instrumental' },
  { num: 18, firstName: 'Lesedi', lastName: 'Segopa', sourceClass: 'Clarinet', sourceStatus: 'VERIFY', groupId: 'grp_tkm_clarinet', programmeId: 'prog_tkm_instrumental', verificationNote: 'Attendance and instrument status' },
  { num: 19, firstName: 'Mpilo', lastName: 'Twala', sourceClass: 'Clarinet', sourceStatus: 'VERIFY', groupId: 'grp_tkm_clarinet', programmeId: 'prog_tkm_instrumental', verificationNote: 'Parent/contact tracing required' },
  { num: 20, firstName: 'Anele', lastName: 'Ntuli', sourceClass: 'Trumpet', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_trumpet', programmeId: 'prog_tkm_instrumental', verificationNote: 'Attendance monitoring' },
  { num: 21, firstName: 'Simphiwe', lastName: 'Matati', sourceClass: 'Trumpet', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_trumpet', programmeId: 'prog_tkm_instrumental' },
  { num: 22, firstName: 'Siphesihle', lastName: 'Yika', sourceClass: 'Trumpet', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_trumpet', programmeId: 'prog_tkm_instrumental' },
  { num: 23, firstName: 'Nkosinathi', lastName: 'Nxele', sourceClass: 'Trumpet', sourceStatus: 'PENDING', groupId: 'grp_tkm_trumpet', programmeId: 'prog_tkm_instrumental', verificationNote: 'Registration form outstanding' },
  { num: 24, firstName: 'Ntokozo', lastName: 'Thipane', sourceClass: 'Trumpet', sourceStatus: 'PENDING', groupId: 'grp_tkm_trumpet', programmeId: 'prog_tkm_instrumental', verificationNote: 'Registration form outstanding' },
  { num: 25, firstName: 'Amahle', lastName: 'Maseko', sourceClass: 'Recorder', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_recorder', programmeId: 'prog_tkm_recorder' },
  { num: 26, firstName: 'Kagoentle', lastName: 'Moeletsi', sourceClass: 'Recorder', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_recorder', programmeId: 'prog_tkm_recorder' },
  { num: 27, firstName: 'Lethabo', lastName: 'Mosehle', sourceClass: 'Recorder', sourceStatus: 'VERIFY', groupId: 'grp_tkm_recorder', programmeId: 'prog_tkm_recorder', verificationNote: 'Parent/contact tracing required' },
  { num: 28, firstName: 'Letlotlo Lebohang Oarabile', lastName: 'Jakobo', sourceClass: 'Recorder', sourceStatus: 'PENDING', groupId: 'grp_tkm_recorder', programmeId: 'prog_tkm_recorder', verificationNote: 'Parent response outstanding' },
  { num: 29, firstName: 'Boikanyo', lastName: 'Maishoane', sourceClass: 'Marimba & Percussion', sourceStatus: 'PENDING', groupId: 'grp_tkm_marimba', programmeId: 'prog_tkm_marimba', verificationNote: 'Parent response outstanding' },
  { num: 30, firstName: 'Atlegang', lastName: 'Sibeko', sourceClass: 'Marimba & Percussion', sourceStatus: 'INACTIVE', groupId: 'grp_tkm_marimba', programmeId: 'prog_tkm_marimba', verificationNote: 'Instrument return outstanding' },
  { num: 31, firstName: 'Emihle', lastName: 'Nonkonyana', sourceClass: 'Marimba & Percussion', sourceStatus: 'INACTIVE', groupId: 'grp_tkm_marimba', programmeId: 'prog_tkm_marimba', verificationNote: 'Confirmed left; archive record' },
  { num: 32, firstName: 'Kganya', lastName: 'Manala', sourceClass: 'Marimba & Percussion', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_marimba', programmeId: 'prog_tkm_marimba' },
  { num: 33, firstName: 'Khanya Mj', lastName: 'Masilo', sourceClass: 'Marimba & Percussion', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_marimba', programmeId: 'prog_tkm_marimba', verificationNote: 'Attendance monitoring' },
  { num: 34, firstName: 'Lesedi', lastName: 'Manala', sourceClass: 'Marimba & Percussion', sourceStatus: 'UNCONFIRMED DETAILS', groupId: 'grp_tkm_marimba', programmeId: 'prog_tkm_marimba', verificationNote: 'Name inconsistency' },
  { num: 35, firstName: 'Makhiwesizwe', lastName: 'Madlopha', sourceClass: 'Marimba & Percussion', sourceStatus: 'VERIFY', groupId: 'grp_tkm_marimba', programmeId: 'prog_tkm_marimba', verificationNote: 'Teacher says learner left; parent confirmation pending' },
  { num: 36, firstName: 'Nqobile Melokuhle', lastName: 'Madlopha', sourceClass: 'Marimba & Percussion', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_marimba', programmeId: 'prog_tkm_marimba' },
  { num: 37, firstName: 'Owethu Amahle', lastName: 'Setshwaro', sourceClass: 'Marimba & Percussion', sourceStatus: 'PENDING', groupId: 'grp_tkm_marimba', programmeId: 'prog_tkm_marimba', verificationNote: 'Parent response outstanding' },
  { num: 38, firstName: 'Siphesihle Lwandle', lastName: 'Manzini', sourceClass: 'Marimba & Percussion', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_marimba', programmeId: 'prog_tkm_marimba' },
  { num: 39, firstName: 'Tshiamo Lungile', lastName: 'Ndhlovu', sourceClass: 'Marimba & Percussion', sourceStatus: 'PENDING', groupId: 'grp_tkm_marimba', programmeId: 'prog_tkm_marimba', verificationNote: 'Parent response outstanding' },
  { num: 40, firstName: 'Thuto', lastName: 'Mbundu', sourceClass: 'Marimba & Percussion', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_marimba', programmeId: 'prog_tkm_marimba' },
  { num: 41, firstName: 'Zothani', lastName: 'Ngema', sourceClass: 'Marimba & Percussion', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_marimba', programmeId: 'prog_tkm_marimba' },
  { num: 42, firstName: 'Bonolo', lastName: 'Sebalo', sourceClass: 'Dance', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_dance', programmeId: 'prog_tkm_dance', verificationNote: 'Duplicate forms consolidated' },
  { num: 43, firstName: 'Lubanzi Kgalaletso', lastName: 'Qaphai', sourceClass: 'Dance', sourceStatus: 'ACTIVE', groupId: 'grp_tkm_dance', programmeId: 'prog_tkm_dance' },
  { num: 44, firstName: 'Mokoena', lastName: 'Keletso', sourceClass: 'Dance', sourceStatus: 'UNCONFIRMED DETAILS', groupId: 'grp_tkm_dance', programmeId: 'prog_tkm_dance', verificationNote: 'Name order requires verification: Mokoena Keletso' },
  { num: 45, firstName: 'Ayanda', lastName: 'Mpawu', sourceClass: 'Not confirmed', sourceStatus: 'VERIFY', groupId: 'grp_tkm_unconfirmed', programmeId: 'prog_tkm_instrumental', verificationNote: 'Match form and physical register' },
  { num: 46, firstName: 'Khutso', lastName: 'Chakane', sourceClass: 'Not confirmed', sourceStatus: 'VERIFY', groupId: 'grp_tkm_unconfirmed', programmeId: 'prog_tkm_instrumental', verificationNote: 'Match form and physical register' }
];

export const TKM_DEMO_DATA = {
  organisation: {
    id: TKM_DEMO_ORGANISATION_ID,
    organisationId: TKM_DEMO_ORGANISATION_ID,
    name: 'TKM Demo — Thabang Ka Mmino',
    shortName: 'TKM Demo',
    slug: 'tkm-demo',
    organisationType: 'community_arts',
    country: 'South Africa',
    timezone: 'Africa/Johannesburg',
    currency: 'ZAR',
    contactEmail: 'demo@thabangkammino.org.example',
    contactPhone: '+27 11 555 9100',
    address: 'Soweto Cultural Centre, Gauteng, 1804',
    status: 'active',
    tenantStatus: 'active',
    billingMode: 'complimentary',
    assignedPlanId: 'plan_professional',
    isDemoTenant: true,
    notes: 'INTERNAL DEMO — Operational register based on Consolidated TKM Master Student Database 2026. Non-commercial dataset.'
  },

  programmes: [
    {
      id: 'prog_tkm_instrumental',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      name: 'Instrumental Music',
      description: 'Comprehensive instrumental tuition across strings, woodwinds, and brass.',
      programmeType: 'music',
      programmeStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'prog_tkm_orchestra',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      name: 'Orchestra',
      description: 'TKM Youth Ensemble and symphonic orchestral performance practice.',
      programmeType: 'music',
      programmeStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'prog_tkm_marimba',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      name: 'Marimba & Percussion',
      description: 'Traditional and contemporary African marimba ensembles and rhythm exploration.',
      programmeType: 'music',
      programmeStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'prog_tkm_recorder',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      name: 'Recorder',
      description: 'Foundation wind instrument tuition and musical literacy.',
      programmeType: 'music',
      programmeStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'prog_tkm_theory',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      name: 'Music Theory',
      description: 'Core musicianship, notation, ear training, and graded music theory.',
      programmeType: 'music',
      programmeStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'prog_tkm_dance',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      name: 'Dance',
      description: 'Contemporary, traditional, and ensemble cultural dance education.',
      programmeType: 'dance',
      programmeStatus: 'active',
      status: 'active',
      isDemoRecord: true
    }
  ],

  groups: [
    {
      id: 'grp_tkm_violin',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      programmeId: 'prog_tkm_instrumental',
      name: 'Violin',
      groupType: 'instrumental',
      level: 'all_levels',
      teacherId: 'staff_tkm_gloria',
      capacity: 20,
      groupStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'grp_tkm_viola',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      programmeId: 'prog_tkm_instrumental',
      name: 'Viola',
      groupType: 'instrumental',
      level: 'all_levels',
      teacherId: 'staff_tkm_vusi',
      capacity: 15,
      groupStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'grp_tkm_cello',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      programmeId: 'prog_tkm_instrumental',
      name: 'Cello',
      groupType: 'instrumental',
      level: 'all_levels',
      teacherId: 'staff_tkm_bongani',
      capacity: 15,
      groupStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'grp_tkm_flute',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      programmeId: 'prog_tkm_instrumental',
      name: 'Flute',
      groupType: 'instrumental',
      level: 'all_levels',
      teacherId: 'staff_tkm_nqobile',
      capacity: 15,
      groupStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'grp_tkm_clarinet',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      programmeId: 'prog_tkm_instrumental',
      name: 'Clarinet',
      groupType: 'instrumental',
      level: 'all_levels',
      teacherId: 'staff_tkm_thoko',
      capacity: 15,
      groupStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'grp_tkm_trumpet',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      programmeId: 'prog_tkm_instrumental',
      name: 'Trumpet / Brass',
      groupType: 'instrumental',
      level: 'all_levels',
      teacherId: 'staff_tkm_isaac',
      capacity: 20,
      groupStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'grp_tkm_marimba',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      programmeId: 'prog_tkm_marimba',
      name: 'Marimba & Percussion',
      groupType: 'ensemble',
      level: 'all_levels',
      teacherId: 'staff_tkm_gontse',
      capacity: 25,
      groupStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'grp_tkm_recorder',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      programmeId: 'prog_tkm_recorder',
      name: 'Recorder',
      groupType: 'instrumental',
      level: 'foundation',
      teacherId: 'staff_tkm_nkuli',
      capacity: 20,
      groupStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'grp_tkm_theory',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      programmeId: 'prog_tkm_theory',
      name: 'Music Theory',
      groupType: 'theory',
      level: 'foundation',
      teacherId: 'staff_tkm_innocent',
      capacity: 40,
      groupStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'grp_tkm_dance',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      programmeId: 'prog_tkm_dance',
      name: 'Dance',
      groupType: 'dance',
      level: 'all_levels',
      teacherId: 'staff_tkm_thami',
      capacity: 25,
      groupStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'grp_tkm_orchestra',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      programmeId: 'prog_tkm_orchestra',
      name: 'TKM Youth Orchestra',
      groupType: 'orchestra',
      level: 'advanced',
      teacherId: 'staff_tkm_innocent',
      capacity: 35,
      groupStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'grp_tkm_unconfirmed',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      programmeId: 'prog_tkm_instrumental',
      name: 'Class / Instrument To Verify',
      groupType: 'verification',
      level: 'unassigned',
      capacity: 20,
      groupStatus: 'active',
      status: 'active',
      isDemoRecord: true
    }
  ],

  staff: [
    {
      id: 'staff_tkm_innocent',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      firstName: 'Innocent',
      lastName: 'Mokoena',
      role: 'Music / Programme Director',
      specialisation: 'Orchestral Conducting & Theory',
      email: 'innocent.mokoena@thabang-ka-mmino.example.com',
      mobileNumber: '+27 82 555 9001',
      staffStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'staff_tkm_never',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      firstName: 'Never',
      lastName: 'Bandarasi',
      role: 'School Oversight',
      specialisation: 'Institutional Governance',
      email: 'never.bandarasi@thabang-ka-mmino.example.com',
      mobileNumber: '+27 83 555 9002',
      staffStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'staff_tkm_thokozani',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      firstName: 'Thokozani',
      lastName: 'Mazibuko',
      role: 'Teacher',
      specialisation: 'General Music Practice',
      email: 'thokozani.mazibuko@thabang-ka-mmino.example.com',
      mobileNumber: '+27 84 555 9003',
      staffStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'staff_tkm_thoko',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      firstName: 'Thoko',
      lastName: 'Thotobolo',
      role: 'Teacher',
      specialisation: 'Clarinet',
      email: 'thoko.thotobolo@thabang-ka-mmino.example.com',
      mobileNumber: '+27 81 555 9004',
      staffStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'staff_tkm_nqobile',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      firstName: 'Nqobile',
      lastName: 'Mhlungu',
      role: 'Teacher',
      specialisation: 'Flute',
      email: 'nqobile.mhlungu@thabang-ka-mmino.example.com',
      mobileNumber: '+27 82 555 9005',
      staffStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'staff_tkm_gloria',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      firstName: 'Gloria',
      lastName: 'Boyi',
      role: 'Teacher',
      specialisation: 'Violin / Strings',
      email: 'gloria.boyi@thabang-ka-mmino.example.com',
      mobileNumber: '+27 83 555 9006',
      staffStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'staff_tkm_vusi',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      firstName: 'Vusi',
      lastName: 'Hlatshwayo',
      role: 'Teacher',
      specialisation: 'Viola / Strings',
      email: 'vusi.hlatshwayo@thabang-ka-mmino.example.com',
      mobileNumber: '+27 84 555 9007',
      staffStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'staff_tkm_bongani',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      firstName: 'Bongani',
      lastName: 'Kunene',
      role: 'Teacher',
      specialisation: 'Cello',
      email: 'bongani.kunene@thabang-ka-mmino.example.com',
      mobileNumber: '+27 81 555 9008',
      staffStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'staff_tkm_william',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      firstName: 'William',
      lastName: 'Nobela',
      role: 'Teacher',
      specialisation: 'Cello',
      email: 'william.nobela@thabang-ka-mmino.example.com',
      mobileNumber: '+27 82 555 9009',
      staffStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'staff_tkm_gontse',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      firstName: 'Gontse',
      lastName: 'Segona',
      role: 'Teacher',
      specialisation: 'Marimba & Percussion',
      email: 'gontse.segona@thabang-ka-mmino.example.com',
      mobileNumber: '+27 83 555 9010',
      staffStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'staff_tkm_nkuli',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      firstName: 'Nkuli',
      lastName: 'Shiburi',
      role: 'Teacher',
      specialisation: 'Recorder & Early Childhood Music',
      email: 'nkuli.shiburi@thabang-ka-mmino.example.com',
      mobileNumber: '+27 84 555 9011',
      staffStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'staff_tkm_nomonde',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      firstName: 'Nomonde',
      lastName: 'Kubeka',
      role: 'Teacher',
      specialisation: 'General Music',
      email: 'nomonde.kubeka@thabang-ka-mmino.example.com',
      mobileNumber: '+27 81 555 9012',
      staffStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'staff_tkm_thami',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      firstName: 'Thami',
      lastName: 'Masoka',
      role: 'Teacher',
      specialisation: 'Dance & Choreography',
      email: 'thami.masoka@thabang-ka-mmino.example.com',
      mobileNumber: '+27 82 555 9013',
      staffStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'staff_tkm_isaac',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      firstName: 'Isaac',
      lastName: 'Molelekoa',
      role: 'Teacher',
      specialisation: 'Trumpet & Brass',
      email: 'isaac.molelekoa@thabang-ka-mmino.example.com',
      mobileNumber: '+27 83 555 9014',
      staffStatus: 'active',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'staff_tkm_mpande',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      firstName: 'Mpande',
      lastName: 'Maseko',
      role: 'Gatekeeper',
      specialisation: 'Site Operations & Security',
      email: 'mpande.maseko@thabang-ka-mmino.example.com',
      mobileNumber: '+27 84 555 9015',
      staffStatus: 'active',
      status: 'active',
      isDemoRecord: true
    }
  ],

  // 46 Learners constructed deterministically from source records
  learners: TKM_LEARNERS_RAW.map((rec) => {
    const paddedId = String(rec.num).padStart(3, '0');
    const id = `tkm_demo_lrn_${paddedId}`;
    const isActive = rec.sourceStatus === 'ACTIVE';
    const isInactive = rec.sourceStatus === 'INACTIVE';
    const learnerStatus = isActive ? 'active' : isInactive ? 'inactive' : 'pending';
    const requiresVerification = !isActive && !isInactive;

    return {
      id,
      organisationId: TKM_DEMO_ORGANISATION_ID,
      firstName: rec.firstName,
      lastName: rec.lastName,
      learnerStatus,
      status: isActive ? 'active' : 'inactive',
      sourceRegistryStatus: rec.sourceStatus,
      requiresVerification,
      verificationNote: rec.verificationNote,
      demoSource: 'TKM Consolidated Master Student Database 2026',
      demoSeedVersion: 'tkm-master-v1',
      isDemoRecord: true
    };
  }),

  // Multi-enrolment architecture: 1 learner, multiple enrolments
  enrolments: (() => {
    const list: Array<{
      id: string;
      organisationId: string;
      learnerId: string;
      groupId: string;
      programmeId: string;
      startDate: string;
      enrolmentStatus: 'active' | 'paused' | 'withdrawn';
      notes?: string;
      status: 'active' | 'inactive';
      isDemoRecord: boolean;
    }> = [];

    // 1. Primary class enrolment for each of the 46 learners
    for (const rec of TKM_LEARNERS_RAW) {
      const paddedId = String(rec.num).padStart(3, '0');
      const learnerId = `tkm_demo_lrn_${paddedId}`;
      const isWithdrawn = rec.sourceStatus === 'INACTIVE';
      const isPaused = rec.sourceStatus === 'PENDING' || rec.sourceStatus === 'VERIFY' || rec.sourceStatus === 'UNCONFIRMED DETAILS';
      const enrolmentStatus = isWithdrawn ? 'withdrawn' : isPaused ? 'paused' : 'active';

      list.push({
        id: `tkm_demo_enr_prim_${paddedId}`,
        organisationId: TKM_DEMO_ORGANISATION_ID,
        learnerId,
        groupId: rec.groupId,
        programmeId: rec.programmeId,
        startDate: '2026-02-01',
        enrolmentStatus,
        notes: rec.verificationNote ? `Source note: ${rec.verificationNote}` : undefined,
        status: enrolmentStatus === 'active' ? 'active' : 'inactive',
        isDemoRecord: true
      });
    }

    // 2. Multi-Enrolment #1: Tokelo Ntlhoka (#8) enrolled in both Violin and Viola
    list.push({
      id: 'tkm_demo_enr_multi_008_viola',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      learnerId: 'tkm_demo_lrn_008',
      groupId: 'grp_tkm_viola',
      programmeId: 'prog_tkm_instrumental',
      startDate: '2026-02-01',
      enrolmentStatus: 'paused',
      notes: 'Dual entry verification in progress for Viola class',
      status: 'inactive',
      isDemoRecord: true
    });

    // 3. Multi-Enrolment #2: Core Theory group enrolments for active instrumentalists
    const theoryLearnerNums = [1, 9, 12, 14, 17, 21, 25, 32];
    for (const num of theoryLearnerNums) {
      const paddedId = String(num).padStart(3, '0');
      list.push({
        id: `tkm_demo_enr_theory_${paddedId}`,
        organisationId: TKM_DEMO_ORGANISATION_ID,
        learnerId: `tkm_demo_lrn_${paddedId}`,
        groupId: 'grp_tkm_theory',
        programmeId: 'prog_tkm_theory',
        startDate: '2026-02-01',
        enrolmentStatus: 'active',
        notes: 'Co-requisite music literacy & theory enrolment',
        status: 'active',
        isDemoRecord: true
      });
    }

    // 4. Multi-Enrolment #3: TKM Youth Orchestra enrolments for selected active players
    const orchestraLearnerNums = [1, 9, 12, 14, 17, 21];
    for (const num of orchestraLearnerNums) {
      const paddedId = String(num).padStart(3, '0');
      list.push({
        id: `tkm_demo_enr_orch_${paddedId}`,
        organisationId: TKM_DEMO_ORGANISATION_ID,
        learnerId: `tkm_demo_lrn_${paddedId}`,
        groupId: 'grp_tkm_orchestra',
        programmeId: 'prog_tkm_orchestra',
        startDate: '2026-02-15',
        enrolmentStatus: 'active',
        notes: 'Ensemble audition cleared for youth orchestra',
        status: 'active',
        isDemoRecord: true
      });
    }

    return list;
  })(),

  // Fictional non-PII demo guardians (only if needed for system referential integrity)
  guardians: [
    {
      id: 'tkm_demo_grd_001',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      firstName: 'Demo Guardian',
      lastName: '001',
      mobileNumber: '+27 82 555 0001',
      email: 'demo.guardian001@example.com',
      notes: 'Fictional demo guardian profile. No real contact data imported.',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_grd_002',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      firstName: 'Demo Guardian',
      lastName: '002',
      mobileNumber: '+27 82 555 0002',
      email: 'demo.guardian002@example.com',
      notes: 'Fictional demo guardian profile. No real contact data imported.',
      status: 'active',
      isDemoRecord: true
    }
  ],

  // Demo instrument assets matching TKM streams
  instruments: [
    {
      id: 'tkm_demo_inst_vln_001',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      assetNumber: 'TKM-DEMO-VLN-001',
      instrumentType: 'Violin',
      instrumentFamily: 'strings',
      make: 'Stentor',
      model: 'Student II (4/4)',
      condition: 'good',
      instrumentStatus: 'allocated',
      ownershipType: 'organisation',
      storageLocation: 'TKM Rehearsal Hall - Locker V1',
      notes: 'Demo instrument asset for string stream demonstration.',
      status: 'active',
      isDemoAsset: true,
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_inst_vla_001',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      assetNumber: 'TKM-DEMO-VLA-001',
      instrumentType: 'Viola',
      instrumentFamily: 'strings',
      make: 'Yamaha',
      model: 'VA5S 15.5-inch',
      condition: 'good',
      instrumentStatus: 'allocated',
      ownershipType: 'organisation',
      storageLocation: 'TKM Rehearsal Hall - Locker V2',
      notes: 'Demo instrument asset for viola stream demonstration.',
      status: 'active',
      isDemoAsset: true,
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_inst_cel_001',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      assetNumber: 'TKM-DEMO-CEL-001',
      instrumentType: 'Cello',
      instrumentFamily: 'strings',
      make: 'Primavera',
      model: '200 Cello Outfit',
      condition: 'fair',
      instrumentStatus: 'allocated',
      ownershipType: 'organisation',
      storageLocation: 'TKM Rehearsal Hall - Room C',
      notes: 'Demo instrument asset for cello stream demonstration.',
      status: 'active',
      isDemoAsset: true,
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_inst_flt_001',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      assetNumber: 'TKM-DEMO-FLT-001',
      instrumentType: 'Flute',
      instrumentFamily: 'woodwinds',
      make: 'Yamaha',
      model: 'YFL-212 Silver Plated',
      condition: 'excellent',
      instrumentStatus: 'allocated',
      ownershipType: 'organisation',
      storageLocation: 'TKM Wind Cabinet - Shelf 1',
      notes: 'Demo instrument asset for flute stream demonstration.',
      status: 'active',
      isDemoAsset: true,
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_inst_cla_001',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      assetNumber: 'TKM-DEMO-CLA-001',
      instrumentType: 'Clarinet',
      instrumentFamily: 'woodwinds',
      make: 'Buffet Crampon',
      model: 'Prodige Bb Clarinet',
      condition: 'good',
      instrumentStatus: 'allocated',
      ownershipType: 'organisation',
      storageLocation: 'TKM Wind Cabinet - Shelf 2',
      notes: 'Demo instrument asset for clarinet stream demonstration.',
      status: 'active',
      isDemoAsset: true,
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_inst_trp_001',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      assetNumber: 'TKM-DEMO-TRP-001',
      instrumentType: 'Trumpet',
      instrumentFamily: 'brass',
      make: 'Yamaha',
      model: 'YTR-2330 Standard Bb',
      condition: 'good',
      instrumentStatus: 'allocated',
      ownershipType: 'organisation',
      storageLocation: 'TKM Brass Storage - Shelf B1',
      notes: 'Demo instrument asset for brass stream demonstration.',
      status: 'active',
      isDemoAsset: true,
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_inst_mrb_001',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      assetNumber: 'TKM-DEMO-MRB-001',
      instrumentType: 'Marimba',
      instrumentFamily: 'percussion',
      make: 'African Musical Instruments',
      model: 'Soprano C-Scale Marimba',
      condition: 'good',
      instrumentStatus: 'available',
      ownershipType: 'organisation',
      storageLocation: 'TKM Main Hall Stage',
      notes: 'Demo percussion instrument asset for ensemble demonstration.',
      status: 'active',
      isDemoAsset: true,
      isDemoRecord: true
    }
  ],

  // Instrument Allocations to demo learners
  instrumentAllocations: [
    {
      id: 'tkm_demo_alloc_vln_01',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      instrumentId: 'tkm_demo_inst_vln_001',
      learnerId: 'tkm_demo_lrn_001', // Lehakwe Molefe
      allocatedDate: '2026-02-01',
      conditionOut: 'good',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_alloc_vla_01',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      instrumentId: 'tkm_demo_inst_vla_001',
      learnerId: 'tkm_demo_lrn_009', // Asemahle Mpofu
      allocatedDate: '2026-02-01',
      conditionOut: 'good',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_alloc_cel_01',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      instrumentId: 'tkm_demo_inst_cel_001',
      learnerId: 'tkm_demo_lrn_012', // Amogelang Mchunu
      allocatedDate: '2026-02-01',
      conditionOut: 'fair',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_alloc_flt_01',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      instrumentId: 'tkm_demo_inst_flt_001',
      learnerId: 'tkm_demo_lrn_014', // Luyanda Khumoetsile Qaphai
      allocatedDate: '2026-02-01',
      conditionOut: 'excellent',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_alloc_cla_01',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      instrumentId: 'tkm_demo_inst_cla_001',
      learnerId: 'tkm_demo_lrn_017', // Kulani Mafatle
      allocatedDate: '2026-02-01',
      conditionOut: 'good',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_alloc_trp_01',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      instrumentId: 'tkm_demo_inst_trp_001',
      learnerId: 'tkm_demo_lrn_021', // Simphiwe Matati
      allocatedDate: '2026-02-01',
      conditionOut: 'good',
      status: 'active',
      isDemoRecord: true
    }
  ],

  // Repertoire demo set
  repertoire: [
    {
      id: 'tkm_demo_rep_orch_01',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      title: 'Demo Orchestra Piece 1',
      composer: 'Demo Ensemble Works',
      instrumentOrVoice: 'Youth Orchestra',
      difficulty: 'intermediate',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_rep_str_01',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      title: 'Demo Strings Exercise',
      composer: 'TKM Faculty Demo',
      instrumentOrVoice: 'Strings Ensemble',
      difficulty: 'beginner',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_rep_brs_01',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      title: 'Demo Brass Ensemble Piece',
      composer: 'Traditional Arr. Demo',
      instrumentOrVoice: 'Brass & Percussion',
      difficulty: 'intermediate',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_rep_mrb_01',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      title: 'Demo Marimba Piece',
      composer: 'African Heritage Demo',
      instrumentOrVoice: 'Marimba Ensemble',
      difficulty: 'intermediate',
      status: 'active',
      isDemoRecord: true
    }
  ],

  // Demo Sessions: 1 past, 1 upcoming for major groups
  sessions: [
    {
      id: 'tkm_demo_ses_vln_past',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      groupId: 'grp_tkm_violin',
      date: '2026-08-29',
      startTime: '09:00',
      endTime: '10:30',
      venue: 'Soweto Cultural Centre - Studio A',
      teacherIds: ['staff_tkm_gloria'],
      sessionType: 'lesson',
      sessionStatus: 'completed',
      notes: 'Demo completed class session for Violin stream.',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_ses_vln_upcoming',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      groupId: 'grp_tkm_violin',
      date: '2026-09-12',
      startTime: '09:00',
      endTime: '10:30',
      venue: 'Soweto Cultural Centre - Studio A',
      teacherIds: ['staff_tkm_gloria'],
      sessionType: 'lesson',
      sessionStatus: 'scheduled',
      notes: 'Demo scheduled class session for Violin stream.',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_ses_flt_past',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      groupId: 'grp_tkm_flute',
      date: '2026-08-29',
      startTime: '10:45',
      endTime: '12:00',
      venue: 'Soweto Cultural Centre - Studio B',
      teacherIds: ['staff_tkm_nqobile'],
      sessionType: 'lesson',
      sessionStatus: 'completed',
      notes: 'Demo completed class session for Flute stream.',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_ses_flt_upcoming',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      groupId: 'grp_tkm_flute',
      date: '2026-09-12',
      startTime: '10:45',
      endTime: '12:00',
      venue: 'Soweto Cultural Centre - Studio B',
      teacherIds: ['staff_tkm_nqobile'],
      sessionType: 'lesson',
      sessionStatus: 'scheduled',
      notes: 'Demo scheduled class session for Flute stream.',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_ses_mrb_past',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      groupId: 'grp_tkm_marimba',
      date: '2026-08-29',
      startTime: '13:00',
      endTime: '15:00',
      venue: 'Soweto Cultural Centre - Main Hall',
      teacherIds: ['staff_tkm_gontse'],
      sessionType: 'rehearsal',
      sessionStatus: 'completed',
      notes: 'Demo completed rehearsal for Marimba & Percussion.',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_ses_mrb_upcoming',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      groupId: 'grp_tkm_marimba',
      date: '2026-09-12',
      startTime: '13:00',
      endTime: '15:00',
      venue: 'Soweto Cultural Centre - Main Hall',
      teacherIds: ['staff_tkm_gontse'],
      sessionType: 'rehearsal',
      sessionStatus: 'scheduled',
      notes: 'Demo scheduled rehearsal for Marimba & Percussion.',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_ses_orch_past',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      groupId: 'grp_tkm_orchestra',
      date: '2026-08-29',
      startTime: '15:30',
      endTime: '17:30',
      venue: 'Soweto Cultural Centre - Main Hall Stage',
      teacherIds: ['staff_tkm_innocent'],
      sessionType: 'rehearsal',
      sessionStatus: 'completed',
      notes: 'Demo youth orchestra rehearsal.',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_ses_orch_upcoming',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      groupId: 'grp_tkm_orchestra',
      date: '2026-09-12',
      startTime: '15:30',
      endTime: '17:30',
      venue: 'Soweto Cultural Centre - Main Hall Stage',
      teacherIds: ['staff_tkm_innocent'],
      sessionType: 'rehearsal',
      sessionStatus: 'scheduled',
      notes: 'Demo youth orchestra rehearsal.',
      status: 'active',
      isDemoRecord: true
    }
  ],

  // Demo Attendance for past sessions only
  attendance: [
    // Past Violin Session attendance (learners 1 to 7)
    { id: 'tkm_demo_att_vln_01', organisationId: TKM_DEMO_ORGANISATION_ID, sessionId: 'tkm_demo_ses_vln_past', learnerId: 'tkm_demo_lrn_001', attendanceStatus: 'present', markedBy: 'staff_tkm_gloria', status: 'active', isDemoRecord: true },
    { id: 'tkm_demo_att_vln_02', organisationId: TKM_DEMO_ORGANISATION_ID, sessionId: 'tkm_demo_ses_vln_past', learnerId: 'tkm_demo_lrn_002', attendanceStatus: 'present', markedBy: 'staff_tkm_gloria', status: 'active', isDemoRecord: true },
    { id: 'tkm_demo_att_vln_03', organisationId: TKM_DEMO_ORGANISATION_ID, sessionId: 'tkm_demo_ses_vln_past', learnerId: 'tkm_demo_lrn_003', attendanceStatus: 'late', markedBy: 'staff_tkm_gloria', status: 'active', isDemoRecord: true },
    { id: 'tkm_demo_att_vln_04', organisationId: TKM_DEMO_ORGANISATION_ID, sessionId: 'tkm_demo_ses_vln_past', learnerId: 'tkm_demo_lrn_004', attendanceStatus: 'present', markedBy: 'staff_tkm_gloria', status: 'active', isDemoRecord: true },
    { id: 'tkm_demo_att_vln_05', organisationId: TKM_DEMO_ORGANISATION_ID, sessionId: 'tkm_demo_ses_vln_past', learnerId: 'tkm_demo_lrn_005', attendanceStatus: 'excused', notes: 'Prior school sports commitment', markedBy: 'staff_tkm_gloria', status: 'active', isDemoRecord: true },
    { id: 'tkm_demo_att_vln_06', organisationId: TKM_DEMO_ORGANISATION_ID, sessionId: 'tkm_demo_ses_vln_past', learnerId: 'tkm_demo_lrn_006', attendanceStatus: 'present', markedBy: 'staff_tkm_gloria', status: 'active', isDemoRecord: true },
    { id: 'tkm_demo_att_vln_07', organisationId: TKM_DEMO_ORGANISATION_ID, sessionId: 'tkm_demo_ses_vln_past', learnerId: 'tkm_demo_lrn_007', attendanceStatus: 'absent', markedBy: 'staff_tkm_gloria', status: 'active', isDemoRecord: true },

    // Past Flute Session attendance (learners 14, 15)
    { id: 'tkm_demo_att_flt_14', organisationId: TKM_DEMO_ORGANISATION_ID, sessionId: 'tkm_demo_ses_flt_past', learnerId: 'tkm_demo_lrn_014', attendanceStatus: 'present', markedBy: 'staff_tkm_nqobile', status: 'active', isDemoRecord: true },
    { id: 'tkm_demo_att_flt_15', organisationId: TKM_DEMO_ORGANISATION_ID, sessionId: 'tkm_demo_ses_flt_past', learnerId: 'tkm_demo_lrn_015', attendanceStatus: 'present', markedBy: 'staff_tkm_nqobile', status: 'active', isDemoRecord: true },

    // Past Orchestra Session attendance (enrolled members 1, 9, 12, 14, 17, 21)
    { id: 'tkm_demo_att_orch_01', organisationId: TKM_DEMO_ORGANISATION_ID, sessionId: 'tkm_demo_ses_orch_past', learnerId: 'tkm_demo_lrn_001', attendanceStatus: 'present', markedBy: 'staff_tkm_innocent', status: 'active', isDemoRecord: true },
    { id: 'tkm_demo_att_orch_09', organisationId: TKM_DEMO_ORGANISATION_ID, sessionId: 'tkm_demo_ses_orch_past', learnerId: 'tkm_demo_lrn_009', attendanceStatus: 'present', markedBy: 'staff_tkm_innocent', status: 'active', isDemoRecord: true },
    { id: 'tkm_demo_att_orch_12', organisationId: TKM_DEMO_ORGANISATION_ID, sessionId: 'tkm_demo_ses_orch_past', learnerId: 'tkm_demo_lrn_012', attendanceStatus: 'present', markedBy: 'staff_tkm_innocent', status: 'active', isDemoRecord: true },
    { id: 'tkm_demo_att_orch_14', organisationId: TKM_DEMO_ORGANISATION_ID, sessionId: 'tkm_demo_ses_orch_past', learnerId: 'tkm_demo_lrn_014', attendanceStatus: 'present', markedBy: 'staff_tkm_innocent', status: 'active', isDemoRecord: true },
    { id: 'tkm_demo_att_orch_17', organisationId: TKM_DEMO_ORGANISATION_ID, sessionId: 'tkm_demo_ses_orch_past', learnerId: 'tkm_demo_lrn_017', attendanceStatus: 'late', markedBy: 'staff_tkm_innocent', status: 'active', isDemoRecord: true },
    { id: 'tkm_demo_att_orch_21', organisationId: TKM_DEMO_ORGANISATION_ID, sessionId: 'tkm_demo_ses_orch_past', learnerId: 'tkm_demo_lrn_021', attendanceStatus: 'present', markedBy: 'staff_tkm_innocent', status: 'active', isDemoRecord: true }
  ],

  // Demo Showcase Event
  events: [
    {
      id: 'tkm_demo_evt_showcase',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      title: 'TKM Demo Showcase',
      description: 'Internal pilot demonstration showcase bringing together Orchestra, Marimba, and Dance.',
      eventType: 'performance',
      startDate: '2026-10-24T14:00:00Z',
      endDate: '2026-10-24T17:00:00Z',
      venue: 'Soweto Cultural Centre Main Auditorium',
      eventStatus: 'planned',
      status: 'active',
      isDemoRecord: true
    }
  ],

  // Event participants
  eventParticipants: [
    { id: 'tkm_demo_ep_01', organisationId: TKM_DEMO_ORGANISATION_ID, eventId: 'tkm_demo_evt_showcase', learnerId: 'tkm_demo_lrn_001', role: 'Concertmaster', status: 'active', isDemoRecord: true },
    { id: 'tkm_demo_ep_14', organisationId: TKM_DEMO_ORGANISATION_ID, eventId: 'tkm_demo_evt_showcase', learnerId: 'tkm_demo_lrn_014', role: 'Lead Flute', status: 'active', isDemoRecord: true },
    { id: 'tkm_demo_ep_32', organisationId: TKM_DEMO_ORGANISATION_ID, eventId: 'tkm_demo_evt_showcase', learnerId: 'tkm_demo_lrn_032', role: 'Marimba Section Lead', status: 'active', isDemoRecord: true },
    { id: 'tkm_demo_ep_42', organisationId: TKM_DEMO_ORGANISATION_ID, eventId: 'tkm_demo_evt_showcase', learnerId: 'tkm_demo_lrn_042', role: 'Principal Dancer', status: 'active', isDemoRecord: true }
  ],

  // Consent demo records
  consentRequests: [
    {
      id: 'tkm_demo_consent_01',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      eventId: 'tkm_demo_evt_showcase',
      learnerId: 'tkm_demo_lrn_001',
      consentType: 'performance_and_media',
      consentStatus: 'granted',
      grantedAt: '2026-08-20T10:00:00Z',
      notes: 'Demo performance and archival media consent',
      status: 'active',
      isDemoRecord: true
    }
  ],

  // Transport demo plan
  transportPlans: [
    {
      id: 'tkm_demo_trans_01',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      eventId: 'tkm_demo_evt_showcase',
      transportType: 'bus',
      providerName: 'Community Shuttle Services Demo',
      capacity: 35,
      departureLocation: 'TKM Rehearsal Grounds',
      destination: 'Soweto Cultural Centre Main Auditorium',
      departureTime: '2026-10-24T12:30:00Z',
      returnTime: '2026-10-24T18:00:00Z',
      status: 'active',
      isDemoRecord: true
    }
  ],

  // Fictional sample finance (marked isDemoRecord: true)
  charges: [
    {
      id: 'tkm_demo_chg_01',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      learnerId: 'tkm_demo_lrn_001',
      title: 'Demo Annual Registration Charge',
      amount: 15000, // ZAR 150.00
      currency: 'ZAR',
      chargeStatus: 'invoiced',
      chargeDate: '2026-02-01',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_chg_02',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      learnerId: 'tkm_demo_lrn_001',
      title: 'Demo Instrument Programme Charge',
      amount: 25000, // ZAR 250.00
      currency: 'ZAR',
      chargeStatus: 'invoiced',
      chargeDate: '2026-02-01',
      status: 'active',
      isDemoRecord: true
    },
    {
      id: 'tkm_demo_chg_03',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      learnerId: 'tkm_demo_lrn_002',
      title: 'Demo Annual Registration Charge',
      amount: 15000, // ZAR 150.00
      currency: 'ZAR',
      chargeStatus: 'uninvoiced',
      chargeDate: '2026-02-01',
      status: 'active',
      isDemoRecord: true
    }
  ],

  invoices: [
    {
      id: 'tkm_demo_inv_01',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      learnerId: 'tkm_demo_lrn_001',
      invoiceNumber: 'TKM-DEMO-INV-001',
      totalAmount: 40000, // ZAR 400.00
      amountPaid: 40000,
      balance: 0,
      currency: 'ZAR',
      invoiceStatus: 'paid',
      dueDate: '2026-02-28',
      status: 'active',
      isDemoRecord: true
    }
  ],

  payments: [
    {
      id: 'tkm_demo_pay_01',
      organisationId: TKM_DEMO_ORGANISATION_ID,
      invoiceId: 'tkm_demo_inv_01',
      amount: 40000, // ZAR 400.00
      currency: 'ZAR',
      paymentMethod: 'eft',
      paymentStatus: 'successful',
      paymentDate: '2026-02-15',
      reference: 'TKM-PAY-DEMO-001',
      status: 'active',
      isDemoRecord: true
    }
  ]
};

export interface TkmSeedSummary {
  organisation: number;
  staff: number;
  programmes: number;
  groups: number;
  learners: number;
  active: number;
  pending: number;
  verify: number;
  unconfirmed: number;
  inactive: number;
  enrolments: number;
  demoSessions: number;
  demoAttendance: number;
  demoInstruments: number;
  repertoire: number;
  events: number;
  charges: number;
  invoices: number;
  payments: number;
}

export function computeTkmSeedSummary(): TkmSeedSummary {
  const activeCount = TKM_DEMO_DATA.learners.filter(l => l.sourceRegistryStatus === 'ACTIVE').length;
  const pendingCount = TKM_DEMO_DATA.learners.filter(l => l.sourceRegistryStatus === 'PENDING').length;
  const verifyCount = TKM_DEMO_DATA.learners.filter(l => l.sourceRegistryStatus === 'VERIFY').length;
  const unconfirmedCount = TKM_DEMO_DATA.learners.filter(l => l.sourceRegistryStatus === 'UNCONFIRMED DETAILS').length;
  const inactiveCount = TKM_DEMO_DATA.learners.filter(l => l.sourceRegistryStatus === 'INACTIVE').length;

  return {
    organisation: 1,
    staff: TKM_DEMO_DATA.staff.length,
    programmes: TKM_DEMO_DATA.programmes.length,
    groups: TKM_DEMO_DATA.groups.length,
    learners: TKM_DEMO_DATA.learners.length,
    active: activeCount,
    pending: pendingCount,
    verify: verifyCount,
    unconfirmed: unconfirmedCount,
    inactive: inactiveCount,
    enrolments: TKM_DEMO_DATA.enrolments.length,
    demoSessions: TKM_DEMO_DATA.sessions.length,
    demoAttendance: TKM_DEMO_DATA.attendance.length,
    demoInstruments: TKM_DEMO_DATA.instruments.length,
    repertoire: TKM_DEMO_DATA.repertoire.length,
    events: TKM_DEMO_DATA.events.length,
    charges: TKM_DEMO_DATA.charges.length,
    invoices: TKM_DEMO_DATA.invoices.length,
    payments: TKM_DEMO_DATA.payments.length
  };
}

export async function runTkmDemoSeed(
  dryRun: boolean = true,
  options?: { founderUid?: string; founderEmail?: string }
): Promise<{
  success: boolean;
  organisationId: string;
  summary: TkmSeedSummary;
  dryRun: boolean;
}> {
  // 1. Safety assertions
  assertTkmSafeEnvironment({ allowProdOverride: !dryRun && process.env.ALLOW_PRODUCTION_SEED === 'true' });

  // 2. Validate source count matches exact master register
  if (TKM_DEMO_DATA.learners.length !== 46) {
    throw new Error(`SOURCE COUNT MISMATCH: Expected 46 learners from master register, got ${TKM_DEMO_DATA.learners.length}`);
  }

  const summary = computeTkmSeedSummary();

  console.log('\n======================================================');
  console.log('ARTSFLOW OS — TKM DEMO POPULATION SEED ENGINE');
  console.log('======================================================');
  console.log(`Organisation ID:     ${TKM_DEMO_ORGANISATION_ID}`);
  console.log(`Target Org Name:     ${TKM_DEMO_DATA.organisation.name}`);
  console.log(`Mode:                ${dryRun ? 'DRY RUN (no writes)' : 'LIVE PRODUCTION WRITE'}`);
  console.log('------------------------------------------------------');
  console.log('SEED SUMMARY:');
  console.log(`Organisation:        ${summary.organisation}`);
  console.log(`Staff:               ${summary.staff}`);
  console.log(`Programmes:          ${summary.programmes}`);
  console.log(`Groups:              ${summary.groups}`);
  console.log(`Learners:            ${summary.learners}`);
  console.log(`  - Active:          ${summary.active}`);
  console.log(`  - Pending:         ${summary.pending}`);
  console.log(`  - Verify:          ${summary.verify}`);
  console.log(`  - Unconfirmed:     ${summary.unconfirmed}`);
  console.log(`  - Inactive:        ${summary.inactive}`);
  console.log(`Enrolments:          ${summary.enrolments}`);
  console.log(`Demo Sessions:       ${summary.demoSessions}`);
  console.log(`Demo Attendance:     ${summary.demoAttendance}`);
  console.log(`Demo Instruments:    ${summary.demoInstruments}`);
  console.log(`Repertoire:          ${summary.repertoire}`);
  console.log(`Showcase Events:     ${summary.events}`);
  console.log('------------------------------------------------------');
  console.log('RECONCILIATION NOTICE:');
  console.log('TKM DEMO DATASET');
  console.log('Based on current consolidated operational register (46 records).');
  console.log('The broader TKM registry reconciliation target is 77 unique learners.');
  console.log('This demo dataset must not be treated as the final verified live TKM registry.');
  console.log('======================================================\n');

  if (dryRun) {
    return {
      success: true,
      organisationId: TKM_DEMO_ORGANISATION_ID,
      summary,
      dryRun: true
    };
  }

  // Live execution write
  console.log(`[TKM-SEED] Writing live demo records for ${TKM_DEMO_ORGANISATION_ID} to Firestore...`);
  const now = new Date().toISOString();

  // 1. Organisation
  await setDoc(doc(db, 'organisations', TKM_DEMO_ORGANISATION_ID), {
    ...TKM_DEMO_DATA.organisation,
    updatedAt: now,
    createdAt: now
  }, { merge: true });

  // 2. All demo collections
  const collectionsMap: Record<string, Array<{ id: string; [key: string]: unknown }>> = {
    programmes: TKM_DEMO_DATA.programmes,
    groups: TKM_DEMO_DATA.groups,
    staff: TKM_DEMO_DATA.staff,
    learners: TKM_DEMO_DATA.learners,
    enrolments: TKM_DEMO_DATA.enrolments,
    guardians: TKM_DEMO_DATA.guardians,
    instruments: TKM_DEMO_DATA.instruments,
    instrumentAllocations: TKM_DEMO_DATA.instrumentAllocations,
    repertoire: TKM_DEMO_DATA.repertoire,
    sessions: TKM_DEMO_DATA.sessions,
    attendance: TKM_DEMO_DATA.attendance,
    events: TKM_DEMO_DATA.events,
    eventParticipants: TKM_DEMO_DATA.eventParticipants,
    consentRequests: TKM_DEMO_DATA.consentRequests,
    transportPlans: TKM_DEMO_DATA.transportPlans,
    charges: TKM_DEMO_DATA.charges,
    invoices: TKM_DEMO_DATA.invoices,
    payments: TKM_DEMO_DATA.payments
  };

  let totalWritten = 1; // org
  for (const [colName, records] of Object.entries(collectionsMap)) {
    for (const rec of records) {
      await setDoc(doc(db, colName, rec.id), {
        ...rec,
        updatedAt: now,
        createdAt: now
      }, { merge: true });
      totalWritten++;
    }
  }

  // 3. Founder Organisation Admin Memberships
  const founderUids = [
    options?.founderUid,
    'usr_founder_founder_artsflow_co_za',
    'usr_founder_test_123'
  ].filter(Boolean) as string[];

  for (const fUid of founderUids) {
    const memId = `mem_${fUid}_${TKM_DEMO_ORGANISATION_ID}`;
    await setDoc(doc(db, 'organisationMemberships', memId), {
      id: memId,
      organisationId: TKM_DEMO_ORGANISATION_ID,
      userId: fUid,
      email: options?.founderEmail || 'founder@artsflow.co.za',
      displayName: 'Platform Founder',
      role: 'organisation_admin',
      membershipStatus: 'active',
      isDefaultOrganisation: false,
      joinedAt: now,
      updatedAt: now,
      updatedBy: 'tkm_seed_script',
      createdAt: now,
      createdBy: 'tkm_seed_script',
      status: 'active',
      isDemoRecord: true
    }, { merge: true });
    totalWritten++;
  }

  console.log(`[TKM-SEED] Successfully wrote ${totalWritten} records to Firestore.`);

  return {
    success: true,
    organisationId: TKM_DEMO_ORGANISATION_ID,
    summary,
    dryRun: false
  };
}

// Allow direct CLI execution
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.endsWith('seed-tkm-demo.ts')) {
  try {
    const isLive = process.argv.includes('--live');
    const isDry = process.argv.includes('--dry-run') || !isLive;

    runTkmDemoSeed(isDry).then(res => {
      console.log('[TKM SEED RESULT]', JSON.stringify(res, null, 2));
    }).catch(err => {
      console.error('[TKM SEED ERROR]', err);
      process.exit?.(1);
    });
  } catch (err) {
    console.error('[TKM SEED ERROR]', (err as Error).message);
    process.exit?.(1);
  }
}
