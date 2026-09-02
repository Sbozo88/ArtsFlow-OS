# ArtsFlow OS

**ArtsFlow OS** is a unified, enterprise-grade operating system engineered specifically for Arts Academies, Music Schools, Dance Studios, Community Ensembles, and Multi-Disciplinary Creative Arts Organisations.

Built with strict multi-tenant architecture and domain isolation, ArtsFlow OS provides end-to-end administration: from core student registers to teaching logs, instrument & costume inventories, performance event logistics, multi-channel communication, automated invoicing & receipts, real-time operational analytics, and deterministic workflow automations.

---

## Complete Operational Architecture

ArtsFlow OS enforces a clean, strictly layered architectural flow across all modules:
```text
TypeScript Domain Models
          ↓
  Base Repository (Tenant Scoped)
          ↓
Business Logic Services (Audit Logged)
          ↓
    Custom React Hooks
          ↓
Accessible, Responsive UI Views
          ↓
Firestore Security Rules & Composite Indexes
```

No UI component makes direct Firestore mutations. Every write operation flows through domain services to guarantee multi-tenant scoping, input validation, and tamper-resistant audit logging.

---

## Systems & Completed Phases

### Phase 1A — Core Foundation
* **Tenant Isolation**: Multi-organisation data isolation backed by Firestore security rules.
* **Authentication & Roles**: Role-based access control (`admin`, `director`, `teacher`, `view_only`).
* **People Directory**: Comprehensive records for Learners, Guardians, Staff, and many-to-many Guardian-Learner links (primary contacts, collection permissions, emergency priority).
* **Organisational Hierarchy**: High-level Arts Programmes (Music, Dance, Visual Arts) and Programme Groups / Ensembles.
* **Audit Ledger**: Immutable audit trail (`auditLogs`) recording actor identity, action type, timestamps, and state diffs.

### Phase 1B — Teaching Operations
* **Enrolments**: Group and ensemble enrolment lifecycle with duplicate protection.
* **Scheduling & Sessions**: Repeating and individual lesson scheduling.
* **Attendance Tracking**: Fast session attendance registers (Present, Late with arrival time, Excused, Absent), batch registers, and absence statistics.
* **Follow-Up Tasks**: Actionable operational tasks with priority, categories, assigned owners, and resolution states.

### Phase 2A — Music Operations
* **Instrument Inventory**: Serial numbers, categories, acquisition records, conditions, and maintenance tracking.
* **Instrument Allocations**: Check-out and return flows, return condition inspections, and maintenance routing.
* **Repertoire Library**: Piece catalog (composer, difficulty, instrumentation, score links) linked directly to sessions and concerts.
* **Practice Logs & Assessments**: Self-practice logging, lesson practice goals, and formal milestone assessments.

### Phase 2B — Dance Operations
* **Dance Levels & Syllabus**: Graded technique syllabi, progression tracking, and studio classes.
* **Choreography Tracker**: Dance pieces, styles, scene breakdowns, music cues, and rehearsal progression.
* **Costume Inventory & Allocations**: Costume sets, sizes, allocations per dancer/performance, and condition tracking.
* **Assessments & Practice**: Physical conditioning logs, skill evaluations, and feedback notes.

### Phase 3A — Events & Performances
* **Event Production**: Comprehensive planning for concerts, recitals, festivals, and tours.
* **Participant Rosters**: Learner invitations, acceptance tracking, roles, and rehearsal attendance.
* **Staff Rosters**: Production roles (Stage Manager, Accompanist, Chaperone, Sound Engineer).
* **Run Sheets**: Minute-by-minute performance timelines with cue tracking.

### Phase 3B — Consent & Transport
* **Consent Management**: Dynamic consent templates, requests, and deadlines.
* **Public Guardian Portal**: Mobile-optimized, token-free consent signing (`/consent/submit/:requestId`) allowing guardians to authorize emergency treatment, media release, and transport participation.
* **Transport Logistics**: Vehicles, drivers, licensed providers, passenger manifests, capacity constraints, and pickup/dropoff itineraries.

### Phase 4A — Finance & Payments
* **Invoice Generation**: Itemized tuition, instrument rental, exam fees, costume charges, and concessions.
* **Payment Allocation**: Multi-method payments (EFT, Cash, Card, Direct Debit) with real-time balance reduction and credit balance tracking.
* **Aged Debtors & Outstanding Balances**: Automated ageing buckets (Current, 1-30, 31-60, 61-90, 90+ days) and collection rates.
* **Audit-Proof Receipts**: Immutable payment receipts with sequential numbering and printable receipt views.

### Phase 4B — Communication & Documents
* **Targeted Broadcasts**: Audience targeting by programme, ensemble, event, or account status.
* **Multi-Channel Delivery**: SMS, WhatsApp, and Email draft preparation and simulated gateway dispatch.
* **Dynamic Documents**: Templated document generation (Enrolment Letters, Statements, Progress Reports, Certificates) with merge tags and PDF/print export.
* **Document Archive**: Storage-linked file uploads and version history.

### Phase 5A — Reporting, Analytics & Operational Intelligence
* **Centralized Metric Calculation Engine**: Authoritative calculations for attendance rates, fee collection percentages, retention, and event readiness.
* **Deterministic Operational Alert Scanner**: Real-time detection of chronic absence (>=3 consecutive absences), overdue debtors, consent shortfalls (<80% with <7 days to event), and transport over-capacity.
* **Needs Attention Hub**: 1-click conversion of system anomalies into assigned follow-up work items.
* **9 Standardized Operational Reports**: Learner Register, Attendance Matrix, Aged Debtors, Instrument Allocations, Costume Audits, Consent Summaries, and Contact Data Quality with CSV export (UTF-8 BOM compatible with Excel/Sheets) and `@media print` layouts.

### Phase 5B — Workflow Automation & Notifications
* **Rule Engine**: Category-driven automation rules across 9 operational domains.
* **Deterministic Deduplication & Cooldowns**: Hash-based deduplication (`ruleId::entityType::entityId::timeScope`) preventing duplicate notifications and alerts.
* **Human-in-the-Loop Safety**: Strict operational guardrails preventing autonomous irreversible decisions (no silent learner removals, no payment cancellations; external communications prepared as drafts with `autoSend = false` by default).
* **Dry-Run Simulation**: Preview matched entities and proposed actions without mutating the database.
* **Staff Notification Centre**: Real-time bell icon, unread pill badge, popover alert tray, and full Notification Centre with deep navigation.
* **12 Pre-Configured Operational Templates**: 1-click activation for chronic absence, overdue invoice reminders, 7-day/2-day event consent alerts, overdue asset returns, and delivery failure alerts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19, TypeScript |
| **Build Tool** | Vite |
| **Routing** | React Router 7 |
| **Backend & Database** | Firebase Authentication, Cloud Firestore |
| **Storage & Hosting** | Firebase Storage, Firebase Hosting |
| **Styling** | Tailwind CSS v4, Lucide React Icons |
| **Testing** | Vitest (74 automated unit & integration tests) |
| **Code Quality** | ESLint 9 (Strict TypeScript rules) |

---

## Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/Sbozo88/ArtsFlow-OS.git
cd ArtsFlow-OS
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:
```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

### 3. Development Commands
```bash
# Start local development server (http://localhost:5173)
npm run dev

# Run all 74 unit tests
npm test

# Run strict TypeScript type checking
npm run typecheck

# Run ESLint linter
npm run lint

# Build production bundle
npm run build
```

---

## Security Model

1. **Multi-Tenant Scoping**: All operational Firestore queries filter strictly by `organisationId`. Security rules deny any cross-tenant read or write access.
2. **Deny-by-Default**: No document can be written without meeting explicit validation criteria and actor authentication.
3. **Audit Ledger & Execution Immutability**: `auditLogs` and `automationExecutions` collections allow creates only; updates and deletions are strictly blocked (`allow update, delete: if false`).
4. **Role Enforcement**: Financial data, staff compensation, and administrative settings are restricted to `admin` and `director` roles.

---

## Production Deployment

ArtsFlow OS is continuously deployed on Firebase Hosting.

* **Production URL**: [https://artflow-os.web.app](https://artflow-os.web.app)
