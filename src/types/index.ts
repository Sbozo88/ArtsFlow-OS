export type RecordStatus = 'active' | 'inactive' | 'archived' | 'deleted';

export interface BaseRecord {
  id: string;
  organisationId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  status: RecordStatus;
}

export interface Organisation extends BaseRecord {
  id: string;
  name: string;
  organisationType: string;
  email?: string;
  phone?: string;
  address?: string;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export type AuthRole = 'super_admin' | 'organisation_admin' | 'programme_director' | 'teacher' | 'finance' | 'viewer';

// Auth User Record (Simplified for Context)
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: AuthRole; // from custom claims or user doc
}

export interface Staff extends BaseRecord {
  firstName: string;
  lastName: string;
  email?: string;
  mobileNumber?: string;
  role: string;
  specialisation?: string;
  employmentType?: string;
  startDate?: string;
  staffStatus: RecordStatus;
  notes?: string;
}

export interface Learner extends BaseRecord {
  firstName: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth?: string;
  school?: string;
  gradeOrClass?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyInformation?: string;
  medicalNotes?: string;
  learnerStatus: RecordStatus;
  notes?: string;
}

export interface Guardian extends BaseRecord {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email?: string;
  address?: string;
  communicationPreference?: string;
  notes?: string;
}

export interface LearnerGuardian extends BaseRecord {
  learnerId: string;
  guardianId: string;
  relationshipType: string;
  primaryContact: boolean;
  emergencyContact: boolean;
  receivesCommunication: boolean;
  financialContact: boolean;
}

export interface Programme extends BaseRecord {
  name: string;
  programmeType: string;
  description?: string;
  programmeStatus: RecordStatus;
}

export interface ProgrammeGroup extends BaseRecord {
  programmeId: string;
  name: string;
  groupType: string;
  level?: string;
  teacherId?: string;
  venue?: string;
  capacity?: number;
  groupStatus: RecordStatus;
}

// ─── Phase 1B Types ───────────────────────────────────────────────

export type EnrolmentStatus = 'active' | 'paused' | 'completed' | 'withdrawn';

export interface Enrolment extends BaseRecord {
  learnerId: string;
  groupId: string;
  programmeId: string;
  startDate: string;
  endDate?: string;
  enrolmentStatus: EnrolmentStatus;
  notes?: string;
}

export type SessionType = 'lesson' | 'rehearsal' | 'workshop' | 'performance' | 'assessment' | 'audition';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'postponed';

export interface Session extends BaseRecord {
  groupId: string;
  date: string;
  startTime: string;
  endTime: string;
  venue?: string;
  teacherIds: string[];
  sessionType: SessionType;
  sessionStatus: SessionStatus;
  notes?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Attendance extends BaseRecord {
  sessionId: string;
  learnerId: string;
  attendanceStatus: AttendanceStatus;
  arrivalTime?: string;
  departureTime?: string;
  notes?: string;
  markedBy: string;
}

export type FollowUpCategory = 'attendance' | 'payment' | 'behaviour' | 'instrument' | 'consent' | 'parent_contact' | 'event' | 'general';
export type FollowUpPriority = 'low' | 'normal' | 'high' | 'urgent';
export type FollowUpStatus = 'open' | 'in_progress' | 'waiting' | 'completed' | 'cancelled';

export interface FollowUp extends BaseRecord {
  learnerId?: string;
  guardianId?: string;
  staffId?: string;
  sessionId?: string;
  groupId?: string;
  category: FollowUpCategory;
  subject: string;
  description: string;
  ownerId: string;
  dueDate?: string;
  priority: FollowUpPriority;
  followUpStatus: FollowUpStatus;
  resolution?: string;
  completedAt?: string;
}

// ─── Phase 2A: Music Operations ───────────────────────────────────

export type InstrumentFamily = 'strings' | 'woodwind' | 'brass' | 'percussion' | 'keyboard' | 'guitar' | 'traditional' | 'other';
export type OwnershipType = 'organisation_owned' | 'school_owned' | 'sponsored' | 'loaned_to_organisation' | 'private' | 'other';
export type InstrumentCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
export type InstrumentStatus = 'available' | 'allocated' | 'repair' | 'lost' | 'retired';

export interface Instrument extends BaseRecord {
  assetNumber: string;
  instrumentType: string;
  instrumentFamily?: InstrumentFamily;
  make?: string;
  model?: string;
  serialNumber?: string;
  ownershipType: OwnershipType;
  purchaseDate?: string;
  purchasePrice?: number;
  estimatedValue?: number;
  condition: InstrumentCondition;
  instrumentStatus: InstrumentStatus;
  storageLocation?: string;
  notes?: string;
}

export type AllocationStatus = 'active' | 'returned' | 'overdue' | 'lost' | 'cancelled';

export interface InstrumentAllocation extends BaseRecord {
  instrumentId: string;
  learnerId: string;
  allocatedDate: string;
  returnDueDate?: string;
  returnedDate?: string;
  conditionOut: InstrumentCondition;
  conditionReturned?: InstrumentCondition;
  allocationStatus: AllocationStatus;
  notes?: string;
}

export type RepertoireStatus = 'planned' | 'learning' | 'rehearsing' | 'performance_ready' | 'retired';
export type Difficulty = 'beginner' | 'easy' | 'intermediate' | 'advanced' | 'professional';

export interface Repertoire extends BaseRecord {
  title: string;
  composer?: string;
  arranger?: string;
  genre?: string;
  difficulty?: Difficulty;
  programmeId?: string;
  groupId?: string;
  repertoireStatus: RepertoireStatus;
  durationMinutes?: number;
  notes?: string;
}

export type RehearsalStatus = 'introduced' | 'learning' | 'needs_work' | 'improving' | 'performance_ready';

export interface SessionRepertoire extends BaseRecord {
  sessionId: string;
  repertoireId: string;
  rehearsalStatus?: RehearsalStatus;
  notes?: string;
}

export type PracticeType = 'individual' | 'lesson' | 'sectional' | 'ensemble' | 'home_practice' | 'other';

export interface PracticeLog extends BaseRecord {
  learnerId: string;
  groupId?: string;
  programmeId?: string;
  repertoireId?: string;
  practiceDate: string;
  durationMinutes?: number;
  practiceType: PracticeType;
  practiceStatus?: string;
  notes?: string;
  teacherComment?: string;
}

export type AssessmentType = 'informal' | 'lesson_review' | 'term_assessment' | 'audition' | 'performance_readiness' | 'end_of_cycle' | 'other';

export interface MusicAssessment extends BaseRecord {
  learnerId: string;
  programmeId?: string;
  groupId?: string;
  teacherId: string;
  assessmentDate: string;
  assessmentType: AssessmentType;
  tone?: number;
  technique?: number;
  rhythm?: number;
  reading?: number;
  musicality?: number;
  preparation?: number;
  participation?: number;
  overallScore?: number;
  teacherComment?: string;
  nextSteps?: string;
}

// ─── Audit ────────────────────────────────────────────────────────

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'ARCHIVE'
  | 'RESTORE'
  | 'LINK'
  | 'UNLINK'
  | 'DELETE'
  | 'WITHDRAW'
  | 'CANCEL'
  | 'COMPLETE'
  | 'MARK_ATTENDANCE'
  | 'ALLOCATE_INSTRUMENT'
  | 'RETURN_INSTRUMENT'
  | 'MARK_INSTRUMENT_LOST'
  | 'LINK_SESSION_REPERTOIRE'
  | 'ASSESS_MUSIC';

export interface AuditLog {
  id: string;
  organisationId: string;
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  timestamp: string;
}
