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

export type TenantStatus =
  | 'provisioning'
  | 'trial'
  | 'active'
  | 'restricted'
  | 'suspended'
  | 'cancelled'
  | 'archived';

export interface Organisation extends BaseRecord {
  id: string;
  name: string;
  organisationType: string;
  slug?: string;
  email?: string;
  phone?: string;
  address?: string;
  tenantStatus?: TenantStatus;
  primaryAdminEmail?: string;
  primaryAdminName?: string;
  suspendedAt?: string;
  suspendedBy?: string;
  suspensionReason?: string;
  restrictedAt?: string;
  restrictedBy?: string;
  restrictionReason?: string;
  assignedPlanId?: string;
  lastActiveAt?: string;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export type PlatformRole = 'super_admin' | null;

export type OrganisationRole =
  | 'organisation_admin'
  | 'programme_director'
  | 'teacher'
  | 'finance'
  | 'viewer';

export type ExternalRole = 'guardian' | 'learner';

export type AuthRole =
  | 'super_admin'
  | 'organisation_admin'
  | 'programme_director'
  | 'teacher'
  | 'finance'
  | 'viewer'
  | 'guardian'
  | 'learner';

// Auth User Record (Simplified for Context)
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: AuthRole; // from custom claims, user doc, or resolved active membership
  platformRole?: PlatformRole;
  organisationId?: string;
  accountStatus?: 'active' | 'disabled';
  activeMembershipId?: string;
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
  photoUrl?: string;
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
  danceLevelId?: string;
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

// ─── Phase 2B: Dance Operations ───────────────────────────────────

export interface DanceLevel extends BaseRecord {
  name: string;
  description?: string;
  sequenceOrder?: number;
  levelStatus: RecordStatus;
}

export type ChoreographyStatus = 'planned' | 'learning' | 'rehearsing' | 'performance_ready' | 'retired';

export interface Choreography extends BaseRecord {
  title: string;
  choreographer?: string;
  style?: string;
  difficulty?: Difficulty;
  durationMinutes?: number;
  programmeId?: string;
  groupId?: string;
  choreographyStatus: ChoreographyStatus;
  musicTitle?: string;
  musicArtist?: string;
  notes?: string;
}

export type DanceRehearsalStatus = 'introduced' | 'learning' | 'needs_work' | 'improving' | 'performance_ready';

export interface SessionChoreography extends BaseRecord {
  sessionId: string;
  choreographyId: string;
  rehearsalStatus?: DanceRehearsalStatus;
  notes?: string;
}

export type DancePracticeType = 'individual' | 'class' | 'rehearsal' | 'sectional' | 'home_practice' | 'conditioning' | 'other';

export interface DancePracticeLog extends BaseRecord {
  learnerId: string;
  groupId?: string;
  programmeId?: string;
  choreographyId?: string;
  practiceDate: string;
  durationMinutes?: number;
  practiceType: DancePracticeType;
  practiceStatus?: string;
  notes?: string;
  teacherComment?: string;
}

export type DanceAssessmentType = 'informal' | 'class_review' | 'term_assessment' | 'audition' | 'performance_readiness' | 'end_of_cycle' | 'other';

export interface DanceAssessment extends BaseRecord {
  learnerId: string;
  programmeId?: string;
  groupId?: string;
  teacherId: string;
  assessmentDate: string;
  assessmentType: DanceAssessmentType;
  technique?: number;
  timing?: number;
  coordination?: number;
  musicality?: number;
  choreographyRetention?: number;
  participation?: number;
  performanceReadiness?: number;
  overallScore?: number;
  teacherComment?: string;
  nextSteps?: string;
}

export type CostumeStatus = 'available' | 'allocated' | 'repair' | 'lost' | 'retired';
export type CostumeCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';

export interface Costume extends BaseRecord {
  assetNumber: string;
  costumeType: string;
  description?: string;
  size?: string;
  colour?: string;
  genderFit?: string;
  quantity?: number;
  condition: CostumeCondition;
  costumeStatus: CostumeStatus;
  storageLocation?: string;
  notes?: string;
}

export type CostumeAllocationStatus = 'active' | 'returned' | 'overdue' | 'lost' | 'cancelled';

export interface CostumeAllocation extends BaseRecord {
  costumeId: string;
  learnerId: string;
  groupId?: string;
  allocatedDate: string;
  returnDueDate?: string;
  returnedDate?: string;
  conditionOut: CostumeCondition;
  conditionReturned?: CostumeCondition;
  allocationStatus: CostumeAllocationStatus;
  notes?: string;
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
  | 'ASSESS_MUSIC'
  | 'CREATE_DANCE_LEVEL'
  | 'UPDATE_DANCE_LEVEL'
  | 'ARCHIVE_DANCE_LEVEL'
  | 'CREATE_CHOREOGRAPHY'
  | 'UPDATE_CHOREOGRAPHY'
  | 'ARCHIVE_CHOREOGRAPHY'
  | 'LINK_SESSION_CHOREOGRAPHY'
  | 'CREATE_DANCE_PRACTICE_LOG'
  | 'UPDATE_DANCE_PRACTICE_LOG'
  | 'CREATE_DANCE_ASSESSMENT'
  | 'UPDATE_DANCE_ASSESSMENT'
  | 'CREATE_COSTUME'
  | 'UPDATE_COSTUME'
  | 'ARCHIVE_COSTUME'
  | 'ALLOCATE_COSTUME'
  | 'RETURN_COSTUME'
  | 'MARK_COSTUME_LOST'
  | 'CREATE_EVENT'
  | 'UPDATE_EVENT'
  | 'COMPLETE_EVENT'
  | 'CANCEL_EVENT'
  | 'ADD_EVENT_GROUP'
  | 'REMOVE_EVENT_GROUP'
  | 'ADD_EVENT_PARTICIPANT'
  | 'UPDATE_EVENT_PARTICIPANT'
  | 'WITHDRAW_EVENT_PARTICIPANT'
  | 'ADD_EVENT_STAFF'
  | 'UPDATE_EVENT_STAFF'
  | 'CREATE_EVENT_SCHEDULE_ITEM'
  | 'UPDATE_EVENT_SCHEDULE_ITEM'
  | 'CREATE_EVENT_PERFORMANCE_ITEM'
  | 'UPDATE_EVENT_PERFORMANCE_ITEM'
  | 'MARK_EVENT_ATTENDANCE'
  | 'UPDATE_EVENT_ATTENDANCE'
  | 'CREATE_CONSENT_TEMPLATE'
  | 'UPDATE_CONSENT_TEMPLATE'
  | 'CREATE_CONSENT_REQUEST'
  | 'CANCEL_CONSENT_REQUEST'
  | 'SUBMIT_CONSENT'
  | 'VERIFY_CONSENT'
  | 'DECLINE_CONSENT'
  | 'SUPERSEDE_CONSENT'
  | 'CREATE_TRANSPORT_PROVIDER'
  | 'UPDATE_TRANSPORT_PROVIDER'
  | 'CREATE_TRANSPORT_VEHICLE'
  | 'UPDATE_TRANSPORT_VEHICLE'
  | 'CREATE_TRANSPORT_PLAN'
  | 'UPDATE_TRANSPORT_PLAN'
  | 'CONFIRM_TRANSPORT_PLAN'
  | 'ADD_TRANSPORT_PASSENGER'
  | 'REMOVE_TRANSPORT_PASSENGER'
  | 'MARK_PASSENGER_BOARDED'
  | 'MARK_PASSENGER_ABSENT'
  | 'CONFIRM_TRANSPORT_DEPARTURE'
  | 'CONFIRM_TRANSPORT_RETURN'
  | 'CREATE_CHARGE_TYPE'
  | 'UPDATE_CHARGE_TYPE'
  | 'ARCHIVE_CHARGE_TYPE'
  | 'CREATE_CHARGE'
  | 'UPDATE_CHARGE'
  | 'CANCEL_CHARGE'
  | 'CREATE_BULK_CHARGES'
  | 'CREATE_INVOICE'
  | 'UPDATE_DRAFT_INVOICE'
  | 'ISSUE_INVOICE'
  | 'CANCEL_INVOICE'
  | 'RECORD_PAYMENT'
  | 'UPDATE_PAYMENT'
  | 'REVERSE_PAYMENT'
  | 'ALLOCATE_PAYMENT'
  | 'REMOVE_PAYMENT_ALLOCATION'
  | 'CREATE_DISCOUNT'
  | 'APPROVE_WAIVER'
  | 'CREATE_FINANCE_FOLLOW_UP'
  // Phase 4B: Communication & Documents
  | 'CREATE_COMMUNICATION'
  | 'UPDATE_COMMUNICATION'
  | 'SEND_COMMUNICATION'
  | 'CANCEL_COMMUNICATION'
  | 'ADD_COMMUNICATION_RECIPIENT'
  | 'DELIVERY_FAILED'
  | 'DELIVERY_CONFIRMED'
  | 'CREATE_COMMUNICATION_TEMPLATE'
  | 'UPDATE_COMMUNICATION_TEMPLATE'
  | 'UPLOAD_DOCUMENT'
  | 'UPDATE_DOCUMENT'
  | 'ARCHIVE_DOCUMENT'
  | 'CREATE_DOCUMENT_VERSION'
  | 'LINK_DOCUMENT'
  | 'UNLINK_DOCUMENT'
  | 'CREATE_DOCUMENT_TEMPLATE'
  | 'GENERATE_DOCUMENT'
  // Phase 5A: Reporting, Analytics & Operational Intelligence
  | 'ACKNOWLEDGE_OPERATIONAL_ALERT'
  | 'DISMISS_OPERATIONAL_ALERT'
  | 'RESOLVE_OPERATIONAL_ALERT'
  | 'CREATE_FOLLOW_UP_FROM_ALERT'
  | 'EXPORT_REPORT'
  // Phase 5B: Workflow Automation & Notifications
  | 'CREATE_AUTOMATION_RULE'
  | 'UPDATE_AUTOMATION_RULE'
  | 'ENABLE_AUTOMATION_RULE'
  | 'DISABLE_AUTOMATION_RULE'
  | 'PAUSE_AUTOMATION_RULE'
  | 'ARCHIVE_AUTOMATION_RULE'
  | 'RUN_AUTOMATION_RULE'
  | 'RETRY_AUTOMATION_EXECUTION'
  | 'CREATE_NOTIFICATION'
  | 'MARK_NOTIFICATION_READ'
  | 'DISMISS_NOTIFICATION'
  | 'CREATE_FOLLOW_UP_FROM_AUTOMATION'
  | 'PREPARE_COMMUNICATION_FROM_AUTOMATION'
  | 'UPDATE_NOTIFICATION_PREFERENCES'
  // Phase 6A: Staff Operations, Timesheets & Workload
  | 'CREATE_STAFF_ASSIGNMENT'
  | 'UPDATE_STAFF_ASSIGNMENT'
  | 'END_STAFF_ASSIGNMENT'
  | 'UPDATE_STAFF_AVAILABILITY'
  | 'CREATE_WORK_RECORD'
  | 'UPDATE_WORK_RECORD'
  | 'VERIFY_WORK_RECORD'
  | 'REJECT_WORK_RECORD'
  | 'CREATE_TIMESHEET'
  | 'SUBMIT_TIMESHEET'
  | 'RETURN_TIMESHEET'
  | 'VERIFY_TIMESHEET'
  | 'APPROVE_TIMESHEET'
  | 'REJECT_TIMESHEET'
  | 'CREATE_SUBSTITUTION'
  | 'CONFIRM_SUBSTITUTION'
  | 'CANCEL_SUBSTITUTION'
  // Phase 6B: Organisation Administration & Configuration
  | 'UPDATE_ORGANISATION_PROFILE'
  | 'UPDATE_BRANDING'
  | 'CREATE_CALENDAR_PERIOD'
  | 'UPDATE_CALENDAR_PERIOD'
  | 'ARCHIVE_CALENDAR_PERIOD'
  | 'UPDATE_PROGRAMME_SETTINGS'
  | 'UPDATE_ATTENDANCE_SETTINGS'
  | 'UPDATE_FINANCE_SETTINGS'
  | 'UPDATE_STAFF_SETTINGS'
  | 'UPDATE_COMMUNICATION_SETTINGS'
  | 'UPDATE_AUTOMATION_SETTINGS'
  | 'UPDATE_TRANSPORT_SETTINGS'
  | 'UPDATE_CONSENT_SETTINGS'
  | 'UPDATE_DOCUMENT_SETTINGS'
  | 'UPDATE_SYSTEM_SETTINGS'
  | 'INVITE_USER'
  | 'REVOKE_INVITATION'
  | 'ACCEPT_INVITATION'
  | 'CHANGE_USER_ROLE'
  | 'DISABLE_USER'
  | 'RESTORE_USER'
  // Phase 7A: Guardian Portal & External Access
  | 'INVITE_GUARDIAN_PORTAL'
  | 'ACTIVATE_GUARDIAN_PORTAL'
  | 'REVOKE_GUARDIAN_PORTAL'
  | 'DISABLE_GUARDIAN_PORTAL'
  | 'RESTORE_GUARDIAN_PORTAL'
  | 'GUARDIAN_SUBMIT_CONSENT'
  | 'GUARDIAN_VIEW_FINANCE'
  | 'GUARDIAN_UPDATE_CONTACT'
  | 'GUARDIAN_CREATE_CHANGE_REQUEST'
  | 'GUARDIAN_REVIEW_CHANGE_REQUEST'
  | 'GUARDIAN_DOWNLOAD_DOCUMENT'
  | 'UPDATE_PORTAL_SETTINGS'
  // SaaS 1B: Platform Super Admin Console Actions
  | 'PLATFORM_CREATE_ORGANISATION'
  | 'PLATFORM_ACTIVATE_TENANT'
  | 'PLATFORM_RESTRICT_TENANT'
  | 'PLATFORM_SUSPEND_TENANT'
  | 'PLATFORM_RESTORE_TENANT'
  | 'PLATFORM_CANCEL_TENANT'
  | 'PLATFORM_ARCHIVE_TENANT'
  | 'PLATFORM_VIEW_TENANT_SUMMARY'
  // SaaS 2A: Plans, Features & Entitlements Actions
  | 'PLATFORM_CREATE_FEATURE'
  | 'PLATFORM_UPDATE_FEATURE'
  | 'PLATFORM_CREATE_PLAN'
  | 'PLATFORM_UPDATE_PLAN'
  | 'PLATFORM_ARCHIVE_PLAN'
  | 'PLATFORM_UPDATE_PLAN_ENTITLEMENT'
  | 'PLATFORM_ASSIGN_PLAN'
  | 'PLATFORM_CREATE_ENTITLEMENT_OVERRIDE'
  | 'PLATFORM_UPDATE_ENTITLEMENT_OVERRIDE'
  | 'PLATFORM_END_ENTITLEMENT_OVERRIDE';

export type AuditScopeType = 'platform' | 'organisation';

export interface AuditLog {
  id: string;
  organisationId: string;
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  scopeType?: AuditScopeType;
  reason?: string;
  before?: unknown;
  after?: unknown;
  timestamp: string;
}

// ─── Phase 3A: Events & Performances ──────────────────────────────

export type EventType = 'concert' | 'competition' | 'festival' | 'eisteddfod' | 'showcase' | 'workshop' | 'audition' | 'camp' | 'masterclass' | 'rehearsal_day' | 'school_event' | 'community_event' | 'other';
export type EventStatus = 'draft' | 'planning' | 'confirmed' | 'completed' | 'cancelled' | 'postponed';

export interface Event extends BaseRecord {
  name: string;
  eventType: EventType;
  description?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  address?: string;
  eventStatus: EventStatus;
  organiser?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  registrationDeadline?: string;
  notes?: string;
}

export type EventGroupStatus = 'invited' | 'planned' | 'confirmed' | 'withdrawn' | 'completed';

export interface EventGroup extends BaseRecord {
  eventId: string;
  programmeId?: string;
  groupId: string;
  participationStatus: EventGroupStatus;
  notes?: string;
}

export type EventParticipantRole = 'performer' | 'participant' | 'soloist' | 'section_leader' | 'assistant' | 'other';
export type EventParticipantStatus = 'planned' | 'confirmed' | 'withdrawn' | 'attended' | 'absent';

export interface EventParticipant extends BaseRecord {
  eventId: string;
  learnerId: string;
  groupId?: string;
  programmeId?: string;
  participantRole?: EventParticipantRole;
  participationStatus: EventParticipantStatus;
  notes?: string;
}

export type EventStaffRole = 'programme_director' | 'conductor' | 'teacher' | 'dance_teacher' | 'supervisor' | 'accompanist' | 'assistant' | 'administrator' | 'volunteer' | 'other';
export type EventStaffStatus = 'planned' | 'confirmed' | 'withdrawn' | 'attended';

export interface EventStaff extends BaseRecord {
  eventId: string;
  staffId: string;
  eventRole: EventStaffRole;
  responsibility?: string;
  participationStatus: EventStaffStatus;
  notes?: string;
}

export type EventScheduleType = 'arrival' | 'registration' | 'warmup' | 'rehearsal' | 'performance' | 'break' | 'meal' | 'awards' | 'departure' | 'general';

export interface EventScheduleItem extends BaseRecord {
  eventId: string;
  title: string;
  scheduleType: EventScheduleType;
  startTime: string;
  endTime?: string;
  venueArea?: string;
  locationNote?: string;
  groupId?: string;
  programmeId?: string;
  sequenceOrder: number;
  notes?: string;
}

export type EventPerformanceType = 'music' | 'dance' | 'combined' | 'speech' | 'presentation' | 'other';
export type EventPerformanceStatus = 'planned' | 'confirmed' | 'ready' | 'performed' | 'cancelled';

export interface EventPerformanceItem extends BaseRecord {
  eventId: string;
  groupId?: string;
  programmeId?: string;
  itemType: EventPerformanceType;
  title: string;
  repertoireId?: string;
  choreographyId?: string;
  sequenceOrder: number;
  estimatedDurationMinutes?: number;
  performanceStatus: EventPerformanceStatus;
  notes?: string;
}

export type EventAttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface EventAttendance extends BaseRecord {
  eventId: string;
  learnerId: string;
  attendanceStatus: EventAttendanceStatus;
  arrivalTime?: string;
  departureTime?: string;
  notes?: string;
  markedBy: string;
}

// ─── Phase 3B: Consent & Transport ────────────────────────────────

export type ConsentType = 'event_participation' | 'indemnity' | 'transport' | 'medical' | 'media' | 'general';
export type TemplateStatus = 'active' | 'inactive' | 'archived';

export interface ConsentTemplate extends BaseRecord {
  name: string;
  consentType: ConsentType;
  title: string;
  description?: string;
  bodyText?: string;
  requiresGuardianSignature: boolean;
  requiresEmergencyContact: boolean;
  requiresMedicalDeclaration: boolean;
  requiresTransportApproval: boolean;
  requiresPhotoMediaConsent?: boolean;
  templateStatus: TemplateStatus;
}

export type ConsentRequestStatus = 'pending' | 'sent' | 'submitted' | 'approved' | 'declined' | 'expired' | 'cancelled';

export interface ConsentRequest extends BaseRecord {
  eventId: string;
  learnerId: string;
  guardianId?: string;
  templateId: string;
  requestStatus: ConsentRequestStatus;
  requestedAt: string;
  dueDate?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

export type ConsentSubmissionStatus = 'submitted' | 'verified' | 'requires_review' | 'declined' | 'superseded';

export interface ConsentSubmission extends BaseRecord {
  consentRequestId: string;
  eventId: string;
  learnerId: string;
  guardianId?: string;
  participationApproved: boolean;
  transportApproved?: boolean;
  medicalConditions?: string;
  allergies?: string;
  medication?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  indemnityAccepted: boolean;
  mediaConsent?: boolean;
  guardianName: string;
  guardianRelationship?: string;
  signatureName?: string;
  signatureTimestamp?: string;
  submissionStatus: ConsentSubmissionStatus;
  notes?: string;
}

export type TransportProviderStatus = 'active' | 'inactive' | 'archived';

export interface TransportProvider extends BaseRecord {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  providerStatus: TransportProviderStatus;
}

export type VehicleType = 'bus' | 'minibus' | 'taxi' | 'school_vehicle' | 'private_vehicle' | 'other';
export type VehicleStatus = 'available' | 'booked' | 'inactive' | 'maintenance' | 'archived';

export interface TransportVehicle extends BaseRecord {
  providerId?: string;
  vehicleName: string;
  vehicleType: VehicleType;
  registrationNumber?: string;
  capacity: number;
  driverName?: string;
  driverPhone?: string;
  vehicleStatus: VehicleStatus;
  notes?: string;
}

export type TransportPlanStatus = 'draft' | 'planned' | 'confirmed' | 'departed' | 'arrived' | 'returning' | 'completed' | 'cancelled';

export interface EventTransportPlan extends BaseRecord {
  eventId: string;
  providerId?: string;
  vehicleId?: string;
  planName: string;
  pickupLocation: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  returnDate?: string;
  returnTime?: string;
  meetingTime?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleCapacity: number;
  transportStatus: TransportPlanStatus;
  notes?: string;
}

export type PassengerType = 'learner' | 'staff' | 'volunteer' | 'other';
export type BoardingStatus = 'planned' | 'boarded' | 'absent' | 'cancelled';
export type ReturnStatus = 'pending' | 'boarded' | 'returned' | 'not_returning';

export interface TransportPassenger extends BaseRecord {
  eventTransportPlanId: string;
  eventId: string;
  passengerType: PassengerType;
  learnerId?: string;
  staffId?: string;
  boardingStatus: BoardingStatus;
  returnStatus?: ReturnStatus;
  seatNumber?: string;
  notes?: string;
}

// ─── Phase 4A: Finance & Payments ─────────────────────────────────

export type ChargeTypeCategory = 
  | 'programme' 
  | 'tuition' 
  | 'registration' 
  | 'event' 
  | 'transport' 
  | 'instrument' 
  | 'costume' 
  | 'workshop' 
  | 'competition' 
  | 'camp' 
  | 'other';

export type ChargeTypeStatus = 'active' | 'inactive' | 'archived';

export interface ChargeType extends BaseRecord {
  name: string;
  description?: string;
  category: ChargeTypeCategory;
  defaultAmount?: number; // In cents
  currency: string;
  chargeTypeStatus: ChargeTypeStatus;
}

export type ChargeStatus = 'draft' | 'active' | 'invoiced' | 'partially_waived' | 'waived' | 'cancelled';

export interface Charge extends BaseRecord {
  learnerId: string;
  guardianId?: string;
  chargeTypeId: string;
  programmeId?: string;
  groupId?: string;
  eventId?: string;
  transportPlanId?: string;
  description: string;
  quantity: number;
  unitAmount: number; // In cents
  amount: number; // In cents (quantity * unitAmount)
  currency: string;
  chargeDate: string;
  dueDate?: string;
  chargeStatus: ChargeStatus;
  discountAmount?: number; // In cents
  waivedAmount?: number; // In cents
  waiverReason?: string;
  waiverApprovedBy?: string;
  notes?: string;
}

export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice extends BaseRecord {
  invoiceNumber: string;
  learnerId: string;
  guardianId?: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number; // In cents
  discountTotal: number; // In cents
  waiverTotal: number; // In cents
  total: number; // In cents
  amountPaid: number; // In cents
  balance: number; // In cents
  invoiceStatus: InvoiceStatus;
  notes?: string;
  issuedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface InvoiceLineItem extends BaseRecord {
  invoiceId: string;
  chargeId?: string;
  description: string;
  quantity: number;
  unitAmount: number; // In cents
  lineTotal: number; // In cents
}

export type PaymentMethod = 'cash' | 'eft' | 'bank_deposit' | 'card' | 'mobile_payment' | 'other';
export type PaymentStatus = 'recorded' | 'partially_allocated' | 'allocated' | 'unallocated' | 'reversed';

export interface Payment extends BaseRecord {
  paymentNumber: string;
  learnerId?: string;
  guardianId?: string;
  paymentDate: string;
  amount: number; // In cents
  allocatedAmount?: number; // In cents
  currency: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  externalReference?: string;
  receivedBy: string;
  paymentStatus: PaymentStatus;
  notes?: string;
  reversedAt?: string;
  reversalReason?: string;
  reversedBy?: string;
}

export interface PaymentAllocation extends BaseRecord {
  paymentId: string;
  invoiceId: string;
  amount: number; // In cents
  allocationDate: string;
}

export type AdjustmentType = 'discount' | 'waiver' | 'credit' | 'correction';

export interface FinanceAdjustment extends BaseRecord {
  learnerId?: string;
  invoiceId?: string;
  chargeId?: string;
  adjustmentType: AdjustmentType;
  amount: number; // In cents
  reason: string;
  approvedBy: string;
}

// ─── Phase 4B: Communication & Documents ────────────────────────────

export type CommunicationType =
  | 'general'
  | 'guardian'
  | 'staff'
  | 'programme'
  | 'group'
  | 'event'
  | 'finance'
  | 'consent'
  | 'transport'
  | 'attendance'
  | 'follow_up'
  | 'other';

export type CommunicationChannel =
  | 'email'
  | 'whatsapp'
  | 'sms'
  | 'internal'
  | 'print'
  | 'manual';

export type CommunicationStatus =
  | 'draft'
  | 'ready'
  | 'sent'
  | 'partially_sent'
  | 'failed'
  | 'cancelled'
  | 'completed';

export interface Communication extends BaseRecord {
  communicationType: CommunicationType;
  channel: CommunicationChannel;
  subject?: string;
  body: string;
  communicationStatus: CommunicationStatus;
  sentAt?: string;
  completedAt?: string;
  relatedEntityType?: string; // 'event' | 'group' | 'programme' | 'invoice' | 'consentRequest' | 'transportPlan' | 'learner'
  relatedEntityId?: string;
  templateId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export type RecipientType = 'learner' | 'guardian' | 'staff' | 'external';

export type DeliveryStatus =
  | 'pending'
  | 'prepared'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'skipped'
  | 'cancelled';

export interface CommunicationRecipient extends BaseRecord {
  communicationId: string;
  recipientType: RecipientType;
  learnerId?: string;
  guardianId?: string;
  staffId?: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  deliveryStatus: DeliveryStatus;
  deliveryChannel: CommunicationChannel;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  failureReason?: string;
  metadata?: Record<string, unknown>;
}

export type TemplateCategory =
  | 'general'
  | 'attendance'
  | 'event'
  | 'consent'
  | 'transport'
  | 'finance'
  | 'programme'
  | 'guardian'
  | 'staff'
  | 'music'
  | 'dance'
  | 'other';

export interface CommunicationTemplate extends BaseRecord {
  name: string;
  category: TemplateCategory;
  defaultChannel?: CommunicationChannel;
  subjectTemplate?: string;
  bodyTemplate: string;
  templateStatus: TemplateStatus;
  description?: string;
}

export interface CommunicationAttachment extends BaseRecord {
  communicationId: string;
  documentId: string;
}

export type DocumentType =
  | 'general'
  | 'learner'
  | 'guardian'
  | 'staff'
  | 'programme'
  | 'group'
  | 'music'
  | 'dance'
  | 'event'
  | 'consent'
  | 'transport'
  | 'finance'
  | 'invoice'
  | 'receipt'
  | 'report'
  | 'policy'
  | 'agreement'
  | 'other';

export type DocumentStatus = 'draft' | 'active' | 'archived' | 'superseded';

export interface DocumentRecord extends BaseRecord {
  name: string;
  documentType: DocumentType;
  fileName?: string;
  storagePath?: string;
  downloadUrl?: string;
  mimeType?: string;
  fileSize?: number; // In bytes
  documentStatus: DocumentStatus;
  relatedEntityType?: string;
  relatedEntityId?: string;
  versionNumber: number;
  uploadedBy?: string;
  generatedBy?: string;
  portalVisibility?: 'internal' | 'guardian' | 'staff' | 'public';
  notes?: string;
}

export interface DocumentVersion extends BaseRecord {
  documentId: string;
  versionNumber: number;
  fileName: string;
  storagePath: string;
  downloadUrl?: string;
  mimeType: string;
  fileSize: number;
  notes?: string;
}

export type DocumentTemplateFormat = 'html' | 'text' | 'markdown';

export interface DocumentTemplate extends BaseRecord {
  name: string;
  documentType: DocumentType;
  titleTemplate?: string;
  bodyTemplate?: string;
  templateFormat: DocumentTemplateFormat;
  templateStatus: TemplateStatus;
}

export interface DocumentLink extends BaseRecord {
  documentId: string;
  entityType: string; // 'learner' | 'guardian' | 'staff' | 'event' | 'consentRequest' | 'invoice' | 'payment' | 'transportPlan' | 'group'
  entityId: string;
}

// ─── Phase 5A: Reporting, Analytics & Operational Intelligence ─────

export type OperationalAlertType =
  | 'attendance_low'
  | 'attendance_consecutive_absence'
  | 'finance_overdue'
  | 'consent_missing'
  | 'transport_capacity'
  | 'instrument_overdue'
  | 'costume_overdue'
  | 'communication_failed'
  | 'followup_overdue';

export type AlertSeverity = 'info' | 'attention' | 'urgent' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export interface OperationalAlert extends BaseRecord {
  alertType: OperationalAlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  detectedAt: string;
  alertStatus: AlertStatus;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  dismissedAt?: string;
  dismissedBy?: string;
  metadata?: Record<string, unknown>;
}

export type DateRangePreset = 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';

export interface DateRangeFilter {
  preset: DateRangePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface AnalyticsOverviewMetrics {
  activeLearners: number;
  activeEnrolments: number;
  activeProgrammes: number;
  activeGroups: number;
  attendanceRate: number;
  sessionsHeld: number;
  upcomingEvents: number;
  totalInvoiced: number; // in cents
  totalReceived: number; // in cents
  outstandingFinance: number; // in cents
  pendingConsentCount: number;
  openFollowUpsCount: number;
  activeAlertsCount: number;
}

export interface LearnerAnalyticsSummary {
  totalLearners: number;
  activeLearners: number;
  inactiveLearners: number;
  newLearnersInPeriod: number;
  multiEnrolledCount: number;
  atRiskCount: number;
  byProgramme: Array<{ programmeId: string; programmeName: string; count: number }>;
  byStatus: Record<string, number>;
  atRiskLearners: Array<{
    learner: Learner;
    riskReasons: string[];
    attendanceRate?: number;
    consecutiveAbsences?: number;
    overdueFinance?: number;
    pendingConsent?: boolean;
    openFollowUps?: number;
  }>;
}

export interface ProgrammeAnalyticsSummary {
  programmeId: string;
  programmeName: string;
  groupCount: number;
  enrolmentCount: number;
  activeLearners: number;
  teacherCount: number;
  sessionsHeld: number;
  attendanceRate: number;
  upcomingEventsCount: number;
  totalInvoiced: number;
  totalReceived: number;
  outstandingBalance: number;
  collectionRate: number;
}

export interface AttendanceAnalyticsSummary {
  sessionsHeld: number;
  attendanceRecordsCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  overallAttendanceRate: number;
  weeklyTrend: Array<{ weekLabel: string; rate: number; sessionCount: number }>;
  dayOfWeekPattern: Array<{ day: string; dayIndex: number; rate: number; sessionCount: number }>;
  lowAttendanceGroups: Array<{ groupId: string; groupName: string; programmeName: string; rate: number; sessionCount: number }>;
  consecutiveAbsenceLearners: Array<{
    learnerId: string;
    learnerName: string;
    groupName: string;
    consecutiveAbsences: number;
    lastAbsenceDate?: string;
  }>;
}

export interface EventReadinessCheck {
  eventId: string;
  eventName: string;
  eventDate: string;
  participantsCount: number;
  consentTotal: number;
  consentApproved: number;
  consentPending: number;
  staffCount: number;
  transportPlanCount: number;
  transportSeatsNeeded: number;
  transportCapacity: number;
  transportStatus: 'none_needed' | 'confirmed' | 'over_capacity' | 'unassigned';
  scheduleItemsCount: number;
  performancesCount: number;
  overallReadiness: 'ready' | 'attention_needed' | 'critical';
  readinessIssues: string[];
}

export interface FinanceAgeingSummary {
  current: number;    // Not yet due
  days1_30: number;   // 1 to 30 days overdue
  days31_60: number;  // 31 to 60 days overdue
  days61_90: number;  // 61 to 90 days overdue
  days90Plus: number; // >90 days overdue
  totalOutstanding: number;
}

export interface OperationalReportRow {
  [key: string]: string | number | boolean | null | undefined;
}

// ─── Phase 5B: Workflow Automation & Notifications ──────────────────

export type RuleCategory =
  | 'attendance'
  | 'finance'
  | 'consent'
  | 'transport'
  | 'event'
  | 'instrument'
  | 'costume'
  | 'communication'
  | 'follow_up'
  | 'programme'
  | 'general';

export type TriggerType =
  | 'record_created'
  | 'record_updated'
  | 'status_changed'
  | 'date_reached'
  | 'date_approaching'
  | 'threshold_reached'
  | 'pattern_detected'
  | 'scheduled_check'
  | 'manual_run';

export type AutomationActionType =
  | 'create_follow_up'
  | 'create_notification'
  | 'prepare_communication'
  | 'assign_owner'
  | 'change_attention_state'
  | 'create_operational_alert'
  | 'schedule_recheck';

export type RuleStatus = 'active' | 'paused' | 'disabled' | 'archived';
export type RulePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface TriggerConfig {
  daysBefore?: number;
  thresholdPercent?: number;
  consecutiveCount?: number;
  targetStatus?: string;
  field?: string;
  scheduleFrequency?: 'hourly' | 'daily' | 'weekly';
  minSessions?: number;
  overdueDays?: number;
  cooldownHours?: number;
  [key: string]: unknown;
}

export interface ConditionPredicate {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'contains' | 'is_empty' | 'is_not_empty';
  value?: unknown;
}

export interface AutomationAction {
  actionType: AutomationActionType;
  target?: string;
  category?: string;
  priority?: RulePriority;
  dueDaysFromNow?: number;
  titleTemplate?: string;
  messageTemplate?: string;
  channel?: CommunicationChannel;
  autoSend?: boolean;
  config?: Record<string, unknown>;
}

export interface AutomationRule extends BaseRecord {
  name: string;
  description?: string;
  ruleCategory: RuleCategory;
  triggerType: TriggerType;
  triggerConfig: TriggerConfig;
  conditions: ConditionPredicate[];
  actions: AutomationAction[];
  priority: RulePriority;
  ruleStatus: RuleStatus;
  cooldownMinutes?: number;
  deduplicationWindowHours?: number;
  lastEvaluatedAt?: string;
  lastTriggeredAt?: string;
  isTemplate?: boolean;
}

export type ExecutionStatus = 'triggered' | 'completed' | 'partially_completed' | 'failed' | 'skipped';

export interface AutomationExecutionDetail {
  conditionsMatched?: boolean;
  affectedEntitiesCount?: number;
  actionsTaken?: Array<{
    actionType: AutomationActionType;
    targetId?: string;
    targetType?: string;
    status: 'success' | 'failed' | 'skipped';
    summary?: string;
    error?: string;
  }>;
}

export interface AutomationExecution extends BaseRecord {
  automationRuleId: string;
  ruleName: string;
  ruleCategory: RuleCategory;
  triggeredAt: string;
  triggerEntityType?: string;
  triggerEntityId?: string;
  executionStatus: ExecutionStatus;
  actionsAttempted: number;
  actionsCompleted: number;
  actionsFailed: number;
  deduplicationKey?: string;
  errorMessage?: string;
  isDryRun?: boolean;
  executionDetails?: AutomationExecutionDetail;
}

export type NotificationType =
  | 'attendance'
  | 'finance'
  | 'consent'
  | 'transport'
  | 'event'
  | 'asset'
  | 'communication'
  | 'follow_up'
  | 'staff_operations'
  | 'system';

export type NotificationStatus = 'unread' | 'read' | 'dismissed';

export interface AppNotification extends BaseRecord {
  recipientUserId: string;
  recipientRole?: AuthRole;
  notificationType: NotificationType;
  title: string;
  message: string;
  severity: AlertSeverity; // 'info' | 'attention' | 'urgent' | 'critical'
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  notificationStatus: NotificationStatus;
  readAt?: string;
  dismissedAt?: string;
  automationRuleId?: string;
  automationExecutionId?: string;
}

export interface NotificationPreference extends BaseRecord {
  userId: string;
  attendance: boolean;
  finance: boolean;
  events: boolean;
  consent: boolean;
  transport: boolean;
  assets: boolean;
  followUps: boolean;
  communication: boolean;
}

// ─── Phase 6A: Staff Operations, Timesheets & Workload ────────────

export type AssignmentType = 'programme' | 'group' | 'event' | 'administrative' | 'general';
export type AssignmentStatus = 'active' | 'inactive' | 'completed' | 'cancelled';
export type AssignmentRole = 
  | 'lead_teacher'
  | 'assistant_teacher'
  | 'conductor'
  | 'dance_teacher'
  | 'coach'
  | 'accompanist'
  | 'supervisor'
  | 'programme_director'
  | 'administrator'
  | 'volunteer'
  | 'substitute'
  | 'other';

export interface StaffAssignment extends BaseRecord {
  staffId: string;
  assignmentType: AssignmentType;
  programmeId?: string;
  groupId?: string;
  eventId?: string;
  role: AssignmentRole;
  startDate: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  assignmentStatus: AssignmentStatus;
  isPrimary: boolean;
  notes?: string;
}

export type AvailabilityType = 'available' | 'unavailable' | 'preferred' | 'limited';
export type AvailabilityStatus = 'active' | 'inactive' | 'archived';

export interface StaffAvailability extends BaseRecord {
  staffId: string;
  availabilityType: AvailabilityType;
  date?: string;       // YYYY-MM-DD for specific dates
  dayOfWeek?: number;  // 0-6 (0 = Sunday, 1 = Monday...) for recurring weekly
  startTime?: string;  // HH:mm
  endTime?: string;    // HH:mm
  reason?: string;
  notes?: string;
  availabilityStatus: AvailabilityStatus;
}

export type WorkType = 
  | 'teaching'
  | 'rehearsal'
  | 'event'
  | 'performance'
  | 'workshop'
  | 'administration'
  | 'meeting'
  | 'setup'
  | 'supervision'
  | 'other';

export type WorkStatus = 'draft' | 'recorded' | 'verified' | 'rejected' | 'cancelled';
export type WorkSourceType = 'session' | 'event' | 'manual' | 'automation';

export interface StaffWorkRecord extends BaseRecord {
  staffId: string;
  workType: WorkType;
  sessionId?: string;
  eventId?: string;
  programmeId?: string;
  groupId?: string;
  workDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  durationMinutes: number;
  workStatus: WorkStatus;
  sourceType: WorkSourceType;
  sourceRecordId?: string;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export type TimesheetStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'verified'
  | 'approved'
  | 'rejected'
  | 'archived';

export interface Timesheet extends BaseRecord {
  staffId: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
  timesheetStatus: TimesheetStatus;
  totalMinutes: number;
  totalEntries: number;
  submittedAt?: string;
  submittedBy?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  notes?: string;
}

export type TimesheetEntryStatus = 'draft' | 'included' | 'excluded' | 'verified' | 'rejected';

export interface TimesheetEntry extends BaseRecord {
  timesheetId: string;
  staffId: string;
  workRecordId?: string;
  workDate: string; // YYYY-MM-DD
  workType: WorkType;
  programmeId?: string;
  groupId?: string;
  sessionId?: string;
  eventId?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes: number;
  entryStatus: TimesheetEntryStatus;
  notes?: string;
}

export type SubstitutionStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled';

export interface StaffSubstitution extends BaseRecord {
  sessionId: string;
  originalStaffId: string;
  substituteStaffId: string;
  reason: string;
  substitutionStatus: SubstitutionStatus;
  requestedAt?: string;
  confirmedAt?: string;
  notes?: string;
}

export interface TimesheetHoursSummary {
  teachingMinutes: number;
  eventMinutes: number;
  adminMinutes: number;
  otherMinutes: number;
  totalMinutes: number;
}

export interface StaffWorkloadSummary {
  staffId: string;
  staffName: string;
  assignedProgrammesCount: number;
  assignedGroupsCount: number;
  sessionsCount: number;
  eventsCount: number;
  totalWorkMinutes: number;
  pendingTimesheetsCount: number;
  substitutionsCount: number;
  flags: {
    highWorkload: boolean;
    lowActivity: boolean;
    noActiveAssignment: boolean;
    repeatedSubstitutions: boolean;
    timesheetOverdue: boolean;
  };
}

// ─── Phase 6B: Organisation Administration & Configuration ─────────

export type OrganisationType =
  | 'school_arts_programme'
  | 'community_arts_project'
  | 'music_school'
  | 'dance_school'
  | 'arts_organisation'
  | 'academy'
  | 'nonprofit'
  | 'other';

export interface OrganisationProfileSettings {
  name: string;
  organisationType: OrganisationType | string;
  registrationNumber?: string;
  taxNumber?: string;
  email?: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  provinceState?: string;
  postalCode?: string;
  country: string;
  timezone: string; // e.g. 'Africa/Johannesburg'
  defaultCurrency: string; // e.g. 'ZAR'
  locale: string; // e.g. 'en-ZA'
  organisationStatus: RecordStatus;
}

export interface OrganisationBrandingSettings {
  organisationDisplayName: string;
  shortName?: string;
  logoUrl?: string;
  logoStoragePath?: string;
  primaryBrandColour?: string; // e.g. '#4f46e5'
  secondaryBrandColour?: string; // e.g. '#0f172a'
  documentHeaderText?: string;
  documentFooterText?: string;
  emailSignature?: string;
}

export interface OrganisationProgrammeSettings {
  allowedProgrammeTypes: string[]; // e.g. ['music', 'dance', 'drama', 'visual_arts', 'theatre', 'poetry', 'creative_arts', 'other']
  defaultProgrammeStatus: RecordStatus;
  defaultGroupCapacity: number;
  defaultSessionDurationMinutes: number;
  defaultSessionType: SessionType;
  defaultVenue?: string;
  defaultAttendanceThreshold: number;
}

export interface OrganisationAttendanceSettings {
  lowAttendanceThresholdPercent: number; // e.g. 75
  consecutiveAbsenceThreshold: number; // e.g. 3
  lateCountsAsPresent: boolean;
  excusedCountsInDenominator: boolean;
  minimumSessionsForAttendanceAlert: number; // e.g. 3
  attendanceAutomationEnabled: boolean;
}

export interface OrganisationFinanceSettings {
  defaultCurrency: string; // e.g. 'ZAR'
  invoicePrefix: string; // e.g. 'INV-'
  invoiceSequencePadding: number; // e.g. 6
  receiptPrefix: string; // e.g. 'REC-'
  receiptSequencePadding: number; // e.g. 6
  defaultInvoiceDueDays: number; // e.g. 30
  allowUnallocatedPayments: boolean;
  financePeriodStartMonth: number; // 1-12
  taxEnabled: boolean;
  taxLabel: string; // e.g. 'VAT'
  defaultTaxRate: number; // e.g. 15
}

export interface OrganisationStaffSettings {
  defaultTimesheetPeriod: 'weekly' | 'monthly' | 'custom';
  timesheetVerificationRequired: boolean;
  timesheetApprovalRequired: boolean;
  preventSelfApproval: boolean;
  manualWorkEntryAllowed: boolean;
  maximumNormalWorkHoursPerDay: number;
  substitutionApprovalRequired: boolean;
}

export interface OrganisationConsentSettings {
  defaultConsentDueDaysBeforeEvent: number; // e.g. 14
  requireParticipationConsent: boolean;
  requireTransportConsent: boolean;
  requireMedicalDeclaration: boolean;
  requireIndemnity: boolean;
  allowGuardianDigitalAcknowledgement: boolean;
  firstReminderDaysBeforeEvent: number; // e.g. 7
  urgentReminderDaysBeforeEvent: number; // e.g. 2
}

export interface OrganisationTransportSettings {
  requireTransportConsent: boolean;
  allowOverCapacityOverride: boolean;
  defaultMeetingLeadMinutes: number; // e.g. 30
  requireReturnCheck: boolean;
  requireDriverContact: boolean;
  requireVehicleCapacity: boolean;
}

export interface OrganisationCommunicationSettings {
  defaultGuardianChannel: 'email' | 'sms' | 'whatsapp';
  defaultStaffChannel: 'email' | 'in_app';
  organisationReplyEmail?: string;
  whatsAppCountryCode?: string; // e.g. '+27'
  communicationSignature?: string;
  allowBulkGuardianCommunication: boolean;
  allowFinanceCommunication: boolean;
  allowAutomaticExternalSend: boolean;
  providerSettings?: {
    providerType: string;
    senderName?: string;
    senderAddress?: string;
    enabled: boolean;
  };
}

export interface OrganisationAutomationSettings {
  automationEnabled: boolean;
  defaultCooldownHours: number;
  dryRunNewRulesByDefault: boolean;
  allowAutoCommunicationSend: boolean;
  notificationEscalationEnabled: boolean;
}

export interface OrganisationDocumentSettings {
  defaultDocumentRetentionStatus: RecordStatus;
  maximumUploadSizeMb: number; // e.g. 10
  allowedFileTypes: string[];
  invoiceDocumentTemplateId?: string;
  receiptDocumentTemplateId?: string;
  documentFooter?: string;
}

export interface OrganisationSystemSettings {
  defaultLandingPage: string; // e.g. '/dashboard'
  dateFormat: string; // e.g. 'YYYY-MM-DD'
  timeFormat: '24h' | '12h';
  recordsPerPage: number;
}

export interface OrganisationPortalSettings {
  guardianPortalEnabled: boolean;
  showAttendance: boolean;
  showAttendanceHistory: boolean;
  showFinance: boolean;
  showPayments: boolean;
  showEvents: boolean;
  showConsent: boolean;
  showTransport: boolean;
  showDocuments: boolean;
  showMessages: boolean;
  showTeacherNames: boolean;
  allowContactUpdates: boolean;
  allowDirectProfileEdit: boolean; // if false, creates portalChangeRequests for staff review
  financeRequiresFinancialContact: boolean; // default true: only financialContact=true guardians see billing
}

export interface OrganisationSettings extends BaseRecord {
  profile: OrganisationProfileSettings;
  branding: OrganisationBrandingSettings;
  programmes: OrganisationProgrammeSettings;
  attendance: OrganisationAttendanceSettings;
  finance: OrganisationFinanceSettings;
  staff: OrganisationStaffSettings;
  consent: OrganisationConsentSettings;
  transport: OrganisationTransportSettings;
  communication: OrganisationCommunicationSettings;
  automation: OrganisationAutomationSettings;
  documents: OrganisationDocumentSettings;
  system: OrganisationSystemSettings;
  portal: OrganisationPortalSettings;
}

export type CalendarPeriodType = 'term' | 'semester' | 'quarter' | 'cycle' | 'season' | 'custom';
export type CalendarPeriodStatus = 'active' | 'completed' | 'planned' | 'archived';

export interface OrganisationCalendarPeriod extends BaseRecord {
  name: string;
  periodType: CalendarPeriodType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  calendarYear: number;
  periodStatus: CalendarPeriodStatus;
  notes?: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface OrganisationInvitation extends BaseRecord {
  email: string;
  role: AuthRole;
  invitationStatus: InvitationStatus;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  token: string;
  acceptedAt?: string;
  acceptedByUserId?: string;
}

export type MembershipStatus = 'invited' | 'active' | 'disabled' | 'revoked';

export interface OrganisationMembership extends BaseRecord {
  userId: string;
  email: string;
  displayName?: string;
  role: OrganisationRole | AuthRole;
  membershipStatus: MembershipStatus;
  isDefaultOrganisation?: boolean;
  joinedAt: string;
  lastActiveAt?: string;
}

export type PlatformPermission =
  | 'platform.dashboard.read'
  | 'platform.organisations.read'
  | 'platform.organisations.create'
  | 'platform.organisations.manage_status'
  | 'platform.users.read'
  | 'platform.health.read'
  | 'platform.audit.read'
  | 'platform.settings.manage'
  | 'platform.plans.read'
  | 'platform.plans.manage'
  | 'platform.features.read'
  | 'platform.features.manage'
  | 'platform.entitlements.manage';

export type Permission =
  | 'learners.read'
  | 'learners.write'
  | 'learners.archive'
  | 'attendance.read'
  | 'attendance.write'
  | 'finance.read'
  | 'finance.write'
  | 'finance.reverse'
  | 'events.read'
  | 'events.manage'
  | 'staff.read'
  | 'staff.verify_timesheets'
  | 'staff.approve_timesheets'
  | 'settings.read'
  | 'settings.manage'
  | 'automation.read'
  | 'automation.manage'
  | 'platform.read'
  | 'platform.manage'
  | 'users.manage'
  | PlatformPermission;

// ─── Phase 7A: Guardian Portal & External Access ────────────────────

export type GuardianPortalAccessStatus = 'invited' | 'active' | 'disabled' | 'revoked';

export interface GuardianPortalAccess extends BaseRecord {
  userId: string;
  guardianId: string;
  accessStatus: GuardianPortalAccessStatus;
  invitedAt?: string;
  acceptedAt?: string;
  lastAccessAt?: string;
  revokedAt?: string;
  revocationReason?: string;
  notes?: string;
}

export interface GuardianInvitation extends BaseRecord {
  guardianId: string;
  email: string;
  token: string;
  expiresAt: string;
  invitationStatus: InvitationStatus; // 'pending' | 'accepted' | 'expired' | 'revoked'
  acceptedByUserId?: string;
  acceptedAt?: string;
  invitedBy: string;
}

export type PortalChangeRequestStatus = 'pending' | 'approved' | 'declined' | 'completed';
export type PortalChangeRequestType = 'contact_details' | 'address' | 'emergency_contact' | 'other';

export interface PortalChangeRequest extends BaseRecord {
  guardianId: string;
  userId: string;
  requestType: PortalChangeRequestType;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
  requestStatus: PortalChangeRequestStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

// ─── Guardian-Safe View Models (DTOs) ───────────────────────────────

export interface GuardianLearnerSummaryDto {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth?: string;
  photoUrl?: string;
  programmes: {
    id: string;
    name: string;
    type: string;
    groupName?: string;
  }[];
  attendanceRate: number; // e.g. 92.5
  outstandingConsentCount: number;
  transportEnrolledCount: number;
  balanceDueCents: number;
  relationshipType: string;
  financialContact: boolean;
  emergencyContact: boolean;
}

export interface GuardianProgrammeInfoDto {
  id: string;
  name: string;
  type: string;
  description?: string;
  groupName?: string;
  venue?: string;
  schedule?: string;
  teacherDisplayName?: string;
}

export interface GuardianSessionDto {
  id: string;
  programmeId: string;
  programmeName: string;
  groupId?: string;
  groupName?: string;
  sessionDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  venue?: string;
  sessionType: string;
}

export interface GuardianAttendanceSummaryDto {
  learnerId: string;
  attendanceRate: number; // percentage
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  totalEvaluatedSessions: number;
  recentSessions: {
    sessionId: string;
    date: string;
    sessionTitle: string;
    status: 'present' | 'late' | 'absent' | 'excused';
  }[];
}

export interface GuardianEventDto {
  id: string;
  name: string;
  eventType: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  venue: string;
  address?: string;
  participationStatus: 'registered' | 'confirmed' | 'declined' | 'withdrawn' | 'attended';
  consentRequired: boolean;
  consentStatus?: 'pending' | 'submitted' | 'approved' | 'declined' | 'not_required';
  consentRequestId?: string;
  transportAvailable: boolean;
  transportStatus?: 'not_booked' | 'booked' | 'boarded' | 'returned';
  scheduleSummary?: string;
}

export interface GuardianConsentDetailDto {
  requestId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  learnerId: string;
  learnerName: string;
  deadline?: string;
  requiresTransportApproval: boolean;
  requiresMedicalDeclaration: boolean;
  requiresIndemnity: boolean;
  indemnityText?: string;
  submissionStatus: 'pending' | 'submitted' | 'approved' | 'declined' | 'superseded';
  participationApproved?: boolean;
  transportApproved?: boolean;
  indemnityAccepted?: boolean;
  medicalDeclaration?: string;
  additionalInfo?: string;
  signedByGuardianName?: string;
  signedAt?: string;
}

export interface GuardianTransportPlanDto {
  planId: string;
  eventId: string;
  eventTitle: string;
  planName: string;
  pickupLocation: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  returnDate?: string;
  returnTime?: string;
  meetingTime?: string;
  boardingStatus: 'planned' | 'boarded' | 'absent' | 'cancelled';
  returnStatus?: 'pending' | 'boarded' | 'returned' | 'not_returning';
  seatNumber?: string;
  notes?: string;
}

export interface GuardianInvoiceDto {
  id: string;
  invoiceNumber: string;
  learnerId: string;
  learnerName: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  amountPaidCents: number;
  balanceCents: number;
  invoiceStatus: InvoiceStatus;
  lineItems: {
    description: string;
    quantity: number;
    unitAmountCents: number;
    lineTotalCents: number;
  }[];
}

export interface GuardianPaymentDto {
  id: string;
  paymentDate: string;
  amountCents: number;
  currency: string;
  paymentMethod: string;
  reference?: string;
  receiptNumber?: string;
  allocations: {
    invoiceNumber: string;
    amountCents: number;
  }[];
}

export interface GuardianFinanceSummaryDto {
  learnerId: string;
  learnerName: string;
  totalInvoicedCents: number;
  totalPaidCents: number;
  outstandingBalanceCents: number;
  currency: string;
  invoices: GuardianInvoiceDto[];
  recentPayments: GuardianPaymentDto[];
  paymentInstructions?: {
    bankName?: string;
    accountHolder?: string;
    accountNumber?: string;
    branchCode?: string;
    referenceFormat?: string;
  };
}

export interface GuardianDocumentDto {
  id: string;
  name: string;
  documentType: DocumentType;
  fileName?: string;
  downloadUrl?: string;
  fileSize?: number;
  createdAt: string;
  relatedLearnerName?: string;
  relatedEventTitle?: string;
}

export interface GuardianMessageDto {
  id: string;
  communicationType: CommunicationType;
  channel: CommunicationChannel;
  subject?: string;
  body: string;
  sentAt?: string;
  relatedLearnerName?: string;
  relatedEventTitle?: string;
}

export interface GuardianProfileDto {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  mobileNumber: string;
  address?: string;
  communicationPreference?: string;
  linkedLearners: {
    learnerId: string;
    learnerName: string;
    relationshipType: string;
    financialContact: boolean;
    emergencyContact: boolean;
  }[];
}

export interface GuardianDashboardDto {
  guardian: {
    id: string;
    displayName: string;
    email?: string;
  };
  actionCards: {
    pendingConsentCount: number;
    upcomingEventsCount: number;
    overdueInvoicesCount: number;
    totalOutstandingBalanceCents: number;
    unreadNotificationsCount: number;
  };
  learners: GuardianLearnerSummaryDto[];
  nextUpcomingEvent?: GuardianEventDto;
  nextUpcomingSession?: GuardianSessionDto;
}

// ─── SaaS 2A: Plans, Features & Entitlements ───────────────────────

export type FeatureCategory =
  | 'core'
  | 'music'
  | 'dance'
  | 'events'
  | 'finance'
  | 'communication'
  | 'documents'
  | 'analytics'
  | 'automation'
  | 'staff'
  | 'portals'
  | 'integrations'
  | 'platform';

export type FeatureType = 'boolean' | 'limit' | 'configuration';

export type FeatureStatus = 'active' | 'inactive' | 'deprecated' | 'experimental';

export interface PlatformFeature {
  id: string;
  key: string;
  name: string;
  description: string;
  category: FeatureCategory;
  featureType: FeatureType;
  featureStatus: FeatureStatus;
  defaultEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  status: RecordStatus;
}

export type PlanStatus = 'draft' | 'active' | 'inactive' | 'archived';

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  description?: string;
  planStatus: PlanStatus;
  displayOrder: number;
  isPublic: boolean;
  recommended?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  status: RecordStatus;
}

export interface PlanEntitlement {
  id: string;
  planId: string;
  featureKey: string;
  enabled: boolean;
  limitValue?: number | null;
  configuration?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  status: RecordStatus;
}

export type OverrideType = 'enable' | 'disable' | 'limit' | 'configuration';

export interface OrganisationEntitlementOverride {
  id: string;
  organisationId: string;
  featureKey: string;
  overrideType: OverrideType;
  enabled?: boolean;
  limitValue?: number | null;
  configuration?: Record<string, unknown>;
  reason: string;
  startsAt?: string;
  expiresAt?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  status: RecordStatus;
}

export interface EffectiveEntitlement {
  organisationId: string;
  featureKey: string;
  enabled: boolean;
  limitValue?: number | null;
  configuration?: Record<string, unknown>;
  source: 'plan' | 'override' | 'default' | 'system';
  sourceId?: string;
  overrideReason?: string;
}


