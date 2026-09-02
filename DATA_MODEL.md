# ArtsFlow OS — Data Model & Collection Directory

This document details the core database schemas, entity relationships, and Firestore collection taxonomy in **ArtsFlow OS**.

---

## 1. Entity Relationship Overview

```text
Organisation
  ├── Settings & Periods (organisationSettings, organisationCalendarPeriods)
  ├── Staff (staff, staffAssignments, staffAvailability, timesheets)
  ├── Programmes (programmes)
  │     └── Programme Groups (programmeGroups)
  │           ├── Sessions (sessions)
  │           │     ├── Attendance (attendance)
  │           │     ├── Session Repertoire (sessionRepertoire)
  │           │     └── Session Choreography (sessionChoreography)
  │           └── Enrolments (enrolments)
  │                 └── Learner (learners)
  ├── Guardians (guardians)
  │     └── Learner-Guardian Links (learnerGuardians)
  ├── Music Assets (instruments, instrumentAllocations, repertoire, practiceLogs)
  ├── Dance Assets (danceLevels, choreography, costumes, costumeAllocations)
  ├── Events (events, eventParticipants, eventStaff, eventSchedule, eventPerformances)
  │     ├── Consent (consentRequests, consentSubmissions)
  │     └── Transport (transportProviders, transportVehicles, transportPlans, passengers)
  ├── Finance (chargeTypes, charges, invoices, invoiceLineItems, payments, allocations)
  ├── Communications (communications, communicationTemplates, communicationRecipients)
  ├── Documents (documents, documentVersions, documentTemplates)
  ├── Automation (automationRules, automationExecutions, notifications)
  └── Audit Trail (auditLogs)
```

---

## 2. Base Record Contract

Every operational record across all collections implements the standard `BaseRecord` interface:

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique document ID (Firestore generated or sequential UUID). |
| `organisationId` | `string` | Foreign key referencing the parent organisation tenant. |
| `createdAt` | `string` (ISO 8601) | Timestamp of record creation. |
| `updatedAt` | `string` (ISO 8601) | Timestamp of last record modification. |
| `createdBy` | `string` | User ID or actor responsible for document creation. |
| `updatedBy` | `string` | User ID or actor responsible for last modification. |
| `status` | `RecordStatus` | Lifecycle flag (`'active'`, `'archived'`, `'deleted'`). |

---

## 3. Primary Domain Collections

### Core & Teaching Hierarchy

#### `organisations`
* **Path**: `/organisations/{orgId}`
* **Description**: Primary multi-tenant academy entity.
* **Fields**: `name`, `code`, `contactEmail`, `contactPhone`, `address`, `status`.

#### `learners`
* **Path**: `/learners/{learnerId}`
* **Description**: Canonical student record. Authoritative across music, dance, and general operations.
* **Fields**: `firstName`, `lastName`, `preferredName`, `email`, `phone`, `dateOfBirth`, `address`, `medicalNotes`, `specialNeeds`, `status`.

#### `guardians`
* **Path**: `/guardians/{guardianId}`
* **Description**: Parent or legal guardian record.
* **Fields**: `firstName`, `lastName`, `email`, `mobileNumber`, `relationship`, `workPhone`, `idNumber`.

#### `learnerGuardians`
* **Path**: `/learnerGuardians/{linkId}`
* **Description**: Many-to-many relationship mapping between learners and guardians.
* **Fields**: `learnerId`, `guardianId`, `relationshipType`, `primaryContact` (boolean), `emergencyContact` (boolean), `financialContact` (boolean), `receivesCommunication` (boolean).

#### `staff`
* **Path**: `/staff/{staffId}`
* **Description**: Teaching and administrative personnel.
* **Fields**: `firstName`, `lastName`, `email`, `mobileNumber`, `role`, `specialisation`, `employmentType`, `status`.

#### `programmes`
* **Path**: `/programmes/{programmeId}`
* **Description**: Academy discipline or departmental umbrella (e.g. Orchestral Music, Ballet, Jazz).
* **Fields**: `name`, `description`, `programmeType` (`'music'`, `'dance'`, `'general'`), `status`.

#### `programmeGroups`
* **Path**: `/programmeGroups/{groupId}`
* **Description**: Classes, ensembles, or troupes within a programme.
* **Fields**: `programmeId`, `name`, `level`, `capacity`, `primaryTeacherId`, `room`, `status`.

#### `enrolments`
* **Path**: `/enrolments/{enrolmentId}`
* **Description**: Student membership within a specific group.
* **Fields**: `learnerId`, `programmeId`, `groupId`, `startDate`, `endDate`, `enrolmentStatus` (`'active'`, `'paused'`, `'completed'`, `'withdrawn'`).

#### `sessions`
* **Path**: `/sessions/{sessionId}`
* **Description**: Timetabled class or rehearsal occurrences.
* **Fields**: `groupId`, `date`, `startTime`, `endTime`, `teacherIds`, `sessionType` (`'lesson'`, `'rehearsal'`, `'workshop'`), `room`.

#### `attendance`
* **Path**: `/attendance/{attendanceId}`
* **Description**: Student attendance record for a session.
* **Fields**: `sessionId`, `learnerId`, `attendanceStatus` (`'present'`, `'absent'`, `'late'`, `'excused'`), `minutesLate`, `notes`.

---

### Finance Collections

#### `chargeTypes` & `charges`
* **Path**: `/chargeTypes/{id}`, `/charges/{chargeId}`
* **Description**: Billable fees for tuition, instruments, uniforms, examinations, or events.
* **Fields**: `learnerId`, `chargeTypeId`, `amount` (integer cents), `currency`, `description`, `chargeStatus` (`'active'`, `'invoiced'`, `'waived'`, `'cancelled'`).

#### `invoices` & `invoiceLineItems`
* **Path**: `/invoices/{invoiceId}`, `/invoiceLineItems/{itemId}`
* **Description**: Formal billing accounts issued to guardians or adult learners.
* **Fields**: `invoiceNumber` (sequential), `learnerId`, `guardianId`, `issueDate`, `dueDate`, `total` (cents), `amountPaid` (cents), `balance` (cents), `invoiceStatus` (`'draft'`, `'issued'`, `'partially_paid'`, `'paid'`, `'overdue'`, `'cancelled'`).

#### `payments` & `paymentAllocations`
* **Path**: `/payments/{paymentId}`, `/paymentAllocations/{allocId}`
* **Description**: Recorded remittances and ledger allocation offsets.
* **Fields**: `paymentNumber`, `amount` (cents), `allocatedAmount` (cents), `paymentMethod` (`'cash'`, `'eft'`, `'credit_card'`, `'gateway'`), `paymentStatus` (`'unallocated'`, `'partially_allocated'`, `'allocated'`, `'reversed'`).

---

### External Portal & Authentication Collections

#### `guardianPortalAccess`
* **Path**: `/guardianPortalAccess/{id}`
* **Fields**: `userId`, `guardianId`, `accessStatus` (`'invited'`, `'active'`, `'disabled'`, `'revoked'`), `acceptedAt`.

#### `guardianInvitations`
* **Path**: `/guardianInvitations/{id}`
* **Fields**: `guardianId`, `email`, `token`, `invitationStatus` (`'pending'`, `'accepted'`, `'expired'`), `expiresAt`.

#### `learnerPortalAccess` & `learnerInvitations`
* **Path**: `/learnerPortalAccess/{id}`, `/learnerInvitations/{id}`
* **Fields**: `userId`, `learnerId`, `accessStatus`, `token`, `invitationStatus`.

---

### System & Audit Collections

#### `organisationSettings`
* **Path**: `/organisationSettings/{orgId}`
* **Fields**: `profile`, `calendar`, `attendance`, `finance`, `staff`, `communication`, `automation`, `portal`, `branding`, `system`, `schemaVersion`.

#### `auditLogs`
* **Path**: `/auditLogs/{logId}`
* **Description**: Append-only immutable historical audit ledger.
* **Fields**: `actorId`, `action`, `entityType`, `entityId`, `timestamp`, `previousState`, `newState`.
