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
  | 'CREATE_FINANCE_FOLLOW_UP';

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


