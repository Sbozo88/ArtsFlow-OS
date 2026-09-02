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
  | 'EXPORT_REPORT';

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




