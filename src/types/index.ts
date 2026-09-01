export type BaseRecord = {
  id: string;
  organisationId: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy: string; // user id
  updatedBy: string; // user id
  status: 'active' | 'archived' | 'deleted';
};

export type Organisation = {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: string;
};

export type UserRole = 'Super Admin' | 'Organisation Admin' | 'Programme Director' | 'Teacher' | 'Finance' | 'Viewer';

export type User = BaseRecord & {
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  role: UserRole;
  specialisation?: string;
  employmentType?: string;
  startDate?: string;
};

export type Learner = BaseRecord & {
  firstName: string;
  lastName: string;
  preferredName?: string;
  dob?: string; // YYYY-MM-DD
  gender?: string;
  school?: string;
  gradeClass?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyInformation?: string;
  medicalNotes?: string;
};

export type Guardian = BaseRecord & {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email: string;
  address?: string;
  communicationPreference: 'email' | 'sms' | 'whatsapp' | 'any';
  notes?: string;
};

export type LearnerGuardian = BaseRecord & {
  learnerId: string;
  guardianId: string;
  relationshipType: string; // e.g., Mother, Father, Guardian
  isPrimaryContact: boolean;
  isEmergencyContact: boolean;
  receivesCommunication: boolean;
  isFinancialContact: boolean;
};

export type ProgrammeType = 'Music' | 'Dance' | 'Other';

export type Programme = BaseRecord & {
  name: string;
  type: ProgrammeType;
  description?: string;
};

export type Group = BaseRecord & {
  programmeId: string;
  name: string;
  groupType: string;
  level?: string;
  teacherId?: string;
  venue?: string;
  capacity?: number;
};

export type EnrolmentStatus = 'active' | 'paused' | 'completed' | 'withdrawn';

export type Enrolment = BaseRecord & {
  learnerId: string;
  groupId: string;
  programmeId: string;
  startDate: string;
  endDate?: string;
  enrolmentStatus: EnrolmentStatus;
  notes?: string;
};

export type SessionType = 'Lesson' | 'Rehearsal' | 'Workshop' | 'Performance' | 'Assessment' | 'Audition';

export type Session = BaseRecord & {
  groupId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  venue?: string;
  teacherIds: string[];
  sessionType: SessionType;
  notes?: string;
};

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export type Attendance = BaseRecord & {
  sessionId: string;
  learnerId: string;
  attendanceStatus: AttendanceStatus;
  arrivalTime?: string;
  departureTime?: string;
  notes?: string;
  markedBy: string; // user id
};

export type FollowUpCategory = 'Attendance' | 'Payment' | 'Behaviour' | 'Instrument' | 'Consent' | 'Parent Contact' | 'Event' | 'General';
export type FollowUpStatus = 'Open' | 'In Progress' | 'Waiting' | 'Completed' | 'Cancelled';
export type FollowUpPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type FollowUp = BaseRecord & {
  learnerId?: string;
  guardianId?: string;
  staffId?: string;
  eventId?: string;
  category: FollowUpCategory;
  subject: string;
  description: string;
  ownerId: string; // user id assigned to this
  dueDate?: string;
  priority: FollowUpPriority;
  followUpStatus: FollowUpStatus;
  resolution?: string;
};
