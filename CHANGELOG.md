# ArtsFlow OS — Changelog

All notable changes and functional releases of ArtsFlow OS are documented in this file.

---

## [Unreleased] — v1.0 release hardening

- Replaced tenant-membership-only Firebase Rules with immutable authority fields, role-aware access, bounded schemas, and emulator-backed attack tests.
- Isolated guardian and learner identities from internal application routes.
- Removed fabricated backup, webhook, integration, upload, seed, and migration success claims.
- Added an explicit Firebase validation/deployment workflow and honest release gates.
- Clarified that learner self-service, payment gateways, webhook runtimes, and verified managed backups are not shipped in v1.0.

---

## [1.0.0-rc.1] — 2026-09-02

### Release Summary
This release candidate consolidates the v1.0 application modules. Production approval remains subject to the current release checklist and security gates.

---

### Core Operations
- **Tenant Scoping & Authentication**: Multi-organisation data isolation backed by Cloud Firestore rules and typed repositories.
- **Student & Guardian Directory**: Centralized registry for Learners and Guardians with many-to-many relationship mapping (`primaryContact`, `emergencyContact`, `financialContact`).
- **Programmes & Enrolments**: Flexible multi-disciplinary hierarchy supporting Music, Dance, and general arts classes.
- **Scheduling & Attendance Registers**: Fast timetabling and session registers with real-time streak tracking.
- **Operational Follow-Ups**: Priority follow-up task system linked to attendance flags and student interventions.

### Music Specialist Operations
- **Instrument Asset Inventory**: Serial numbers, categories, acquisition records, conditions, and maintenance tracking.
- **Instrument Check-Out & Return**: Allocations workflow with condition change inspection upon return.
- **Repertoire Library**: Piece catalog with instrumentation, composer, difficulty, and attachments linked to sessions.
- **Practice & Graded Assessments**: Student practice logging and milestone evaluation rubrics.

### Dance Specialist Operations
- **Graded Syllabus & Levels**: Graded technique syllabus progression and studio classes.
- **Choreography Tracker**: Dance pieces, scene breakdowns, music cues, and rehearsal progression.
- **Costume Inventory**: Costume sets, sizes, and allocations per dancer with condition tracking.
- **Dance Evaluations**: Physical conditioning and performance assessment rubrics.

### Events & Performances
- **Production Management**: Planning for recitals, festivals, and concerts with run sheets and schedules.
- **Digital Consent**: Cryptographic consent requests with legal indemnity waiver submissions.
- **Transport Logistics**: Transport provider and fleet management, capacity monitoring, and passenger manifests.

### Finance & Billing
- **Integer Minor Units**: Standardized integer cents representation across charges, invoices, and payments (zero floating-point drift).
- **Automated Invoicing**: Concurrency-safe sequential invoice numbering, automatic line-item calculation, and status derivation.
- **Payment Reconciliation**: Payment recording (Cash, EFT, Gateway) with authoritative allocation offsets and balance reconciliation (`financeReconciliationService`).
- **Aged Debtors & Receipts**: Automated receipt generation and overdue debtor ageing buckets.

### Communication & Documents
- **Multi-Channel Dispatcher**: Unified communication engine with dynamic variable substitution for Email, SMS, and WhatsApp.
- **Resilient Fallback Protocols**: Automatic graceful degradation to manual click-to-message links (`wa.me`) when external APIs are unconfigured.
- **Document Engine**: Cloud document repository with version control and automated letterhead branding.

### Operational Intelligence & Automation
- **Executive Analytics**: Dashboards for learner retention, attendance rates, aged debtors, and concert readiness.
- **Event-Driven Automations**: Automation rules (`on_session_missed`, `on_invoice_overdue`, `on_event_created`) with deduplication and cooldown safeguards.

### Staff Operations & Administration
- **Work Records & Timesheets**: Teacher assignment rosters, availability tracking, monthly timesheets, and rate calculations.
- **Self-Approval Protection**: Rule enforcing that timesheets cannot be verified or approved by their submitter.
- **Teacher Substitutions**: Cover teacher workflows with full audit attribution.
- **Organisation Administration**: Configurable terms, public holiday blackouts, branding assets, and permission profiles.

### External Portals
- **Guardian Portal**: Independent, mobile-responsive self-service portal for parents to monitor student attendance, digitally sign consent forms, track transport, inspect invoices, and settle fees.
- **Learner Account Isolation**: Learner identities are blocked from the administration interface; full learner self-service is deferred.
- **Guardian Portal Gate**: The guardian UI is present, while production relationship-based backend enforcement remains a release gate.

### Platform Operations & Security
- **Data Quality Scanner**: Built-in referential integrity auditor detecting broken relationships and orphaned records.
- **Safe Data Export**: Export organisation records stripped of credentials, API keys, and auth tokens.
- **Disaster Recovery Runbook**: Practical recovery guidelines documented in `RECOVERY.md`.
- **Hardened Rules**: Deny-by-default rules with anti-enumeration protection on public invitation links.
- **Demo Seeding System**: Production-locked demo data seeder for local development and testing.
