# ArtsFlow OS

**ArtsFlow OS** is an enterprise-grade operating system engineered specifically for Arts Academies, Music Schools, Dance Studios, Community Ensembles, and Multi-Disciplinary Creative Arts Organisations.

ArtsFlow OS manages the operational lifecycle of an arts academy: from learner registration and instrument/costume inventories to staff timesheets, fee administration, event logistics, and operational analytics. The v1.0 release candidate is undergoing production security validation.

---

## Release Status

- **Current Version**: `1.0.0-rc.1` (Release Candidate)
- **Status**: Release validation in progress
- **Target**: Production readiness after security, portal, backup, and smoke-test gates pass

---

## Core Capabilities

### 1. Core & Teaching Operations
* **Tenant Scoping & Multi-Tenancy**: Data isolation backed by Firestore row-level security rules.
* **People & Enrolments**: Centralized registry for Learners, Guardians, and Staff with many-to-many relationship mapping.
* **Programme & Group Management**: Multi-disciplinary programmes (Music, Dance, Theatre, Arts) and group/ensemble classes.
* **Scheduling & Attendance**: Timetabled session management with real-time registers (`present`, `late`, `absent`, `excused`) and streak detection.
* **Operational Follow-Ups**: Priority task tracking linked to attendance anomalies and learners.

### 2. Music & Dance Specialist Operations
* **Music Operations**: Instrument inventory, asset condition tracking, checkout/return allocations, repertoire library, practice logs, and graded milestone assessments.
* **Dance Operations**: Graded syllabus levels, studio classes, choreography repertoire with scene cueing, costume inventory & allocations, and performance evaluations.

### 3. Events, Logistics & Safety
* **Event Production**: Comprehensive planning for concerts, recitals, festivals, and tours with run sheets and performance items.
* **Digital Consent**: Cryptographic consent requests, legal waiver submissions, and verification workflows.
* **Transport Management**: Fleet & private vehicle rosters, passenger manifests, boarding statuses, and route tracking.

### 4. Finance & Automated Billing
* **Fee Schedules & Charges**: Fixed, recurring, tuition, and sibling-discounted fee structures.
* **Invoicing**: Concurrency-safe sequential numbering, auto-calculation, issue and delivery workflows.
* **Payments & Allocations**: Minor-unit (integer cents) financial ledger, payment recording (Cash, EFT, Gateway), receipt generation, and real-time reconciliation.

### 5. Communication & Document Management
* **Communication Preparation**: Message composition with dynamic variable substitution. WhatsApp click-to-chat is available; automated Email/SMS delivery is not configured.
* **Document Engine**: Cloud document repository with automated letterhead branding, certificate generator, and version control.

### 6. Operational Intelligence & Automation
* **Executive Dashboards & Analytics**: Live KPIs for retention, attendance compliance, debtor ageing, and event readiness.
* **Workflow Automation Engine**: Event-driven rules (`on_session_missed`, `on_invoice_issued`, `on_event_created`) with loop prevention and cooldown timers.

### 7. Staff Operations & Workload Management
* **Teaching & Supervisory Assignments**: Roster allocation, availability tracking, and conflict detection.
* **Timesheets & Work Records**: Work session logging, rate calculation, verification, and self-approval protection.
* **Staff Substitutions**: Structured cover teacher workflows with automated audit trails.

### 8. Self-Service Portals
* **Guardian Portal**: A dedicated guardian interface exists, but production relationship-rule validation remains a release gate.
* **Learner Accounts**: Learner identities are blocked from the administration interface. Learner self-service is planned after v1.0 and is not presented as shipped functionality.

### 9. Platform Operations & Integrations
* **System Health & Data Quality**: Automated referential integrity scanner and orphan detector.
* **Backups & Recovery**: Recovery procedures are documented; managed backups must be configured and verified separately in Google Cloud.
* **Integration Adapters**: Local iCalendar/accounting exports and WhatsApp click-to-chat are available. Email, SMS, gateway, and webhook runtimes are not configured.

---

## Architectural Principles

```text
TypeScript Domain Models
          ↓
  Base Repository (Tenant Scoped)
          ↓
Business Logic Services (Audit Logged & Validated)
          ↓
    Custom React Hooks
          ↓
Accessible, Responsive UI Views
          ↓
Firestore Security Rules & Composite Indexes
```

1. **Service-Oriented Writes**: Operational screens use typed services; authentication/bootstrap flows contain narrowly scoped direct Firebase writes.
2. **Authoritative Sources of Truth**: Entities such as `learners` and `guardians` are unified system-wide and never duplicated into module silos.
3. **Money Minor Units**: All financial calculations operate on integer minor units (cents) to completely eliminate floating-point drift.
4. **Deny-by-Default Security**: Security rules deny all reads and writes unless explicitly authorized by tenant membership or verified token ownership.

---

## Tech Stack

* **Frontend Framework**: React 19 with TypeScript 6
* **Build Tool**: Vite 8 & TailwindCSS 4
* **Icons & UI Utilities**: Lucide React, clsx, tailwind-merge, date-fns
* **Database & Auth**: Firebase Authentication & Cloud Firestore (Modular SDK v12)
* **Storage**: Cloud Storage for Firebase
* **Hosting**: Firebase Hosting
* **Test Suite**: Vitest (Unit, Integration, and Security Matrix tests)

---

## Getting Started Locally

### Prerequisites
* Node.js 20+
* npm 10+
* Firebase CLI (`npm install -g firebase-tools` or via `npx`)

### Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Sbozo88/ArtsFlow-OS.git
   cd ArtsFlow-OS
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local` and configure your Firebase project credentials:
   ```bash
   cp .env.example .env.local
   ```
   Provide values for:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

4. **Run the local development server**:
   ```bash
   npm run dev
   ```

---

## Verification & Testing

Execute the automated test suites:
```bash
# Run unit and integration tests
npm test

# Run TypeScript typecheck
npm run typecheck

# Run linter
npm run lint

# Compile production bundle
npm run build
```

---

## Deployment Workflow

Deploy to Firebase Hosting:
```bash
npm run build && npx firebase deploy --only hosting
```

Deploy Firestore Security Rules & Indexes:
```bash
npx firebase deploy --only firestore:rules,firestore:indexes
```

Deploy Storage Security Rules:
```bash
npx firebase deploy --only storage
```

---

## License & Operational Rights

ArtsFlow OS is distributed under the terms of the MIT License. See [LICENSE](./LICENSE) for details.
