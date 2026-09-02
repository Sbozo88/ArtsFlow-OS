# ArtsFlow OS — Release Checklist (v1.0.0-rc.1)

Use this pre-flight checklist prior to tagging or promoting any release candidate of **ArtsFlow OS** to production.

---

## 1. Code Quality & Static Analysis
- [x] **TypeScript Compilation**: `npm run typecheck` exits with 0 errors across all source files and test suites.
- [x] **Linting**: `npm run lint` exits with 0 errors.
- [x] **Zero Direct Firestore Writes**: Confirmed all UI views dispatch through domain services.
- [x] **Bundle Build**: `npm run build` completes successfully with an optimized Vite production bundle in `dist/`.

---

## 2. Automated Test Suite
- [x] **Core & Teaching Operations**: All student, guardian, enrolment, and attendance tests pass.
- [x] **Music & Dance Operations**: Instrument allocation, repertoire, syllabus, and costume tests pass.
- [x] **Finance & Billing Tests**: Integer minor unit arithmetic, invoice calculations, and allocation tests pass.
- [x] **Staff Operations Tests**: Timesheet verification, self-approval protection, and workload tests pass.
- [x] **Portal Isolation Tests**: Guardian and Learner relationship boundary tests pass.
- [x] **Multi-Tenant Isolation Master Test**: Automated verification that Organisation A cannot read/write Organisation B across 10 collections.
- [x] **Total Automated Test Count**: 135+ passing unit and integration tests.

---

## 3. Security & Access Rules
- [x] **Deny-by-Default**: Confirmed root fallback rule blocks all unmanaged paths in `firestore.rules`.
- [x] **Multi-Tenant Scoping**: All operational Firestore collections enforce `isUserInOrg(resource.data.organisationId)`.
- [x] **Anti-Enumeration Hardening**: Public endpoints (`guardianInvitations`, `consentRequests`) separate `get` from `list` to prevent collection scraping.
- [x] **Storage Rules Hardened**: Scoped to `/organisations/{orgId}/`, restricts max file size (25MB standard / 5MB image), prohibits executable binaries.
- [x] **RBAC Matrix Enforced**: All 8 roles tested against sensitive permissions; teacher cannot access finance; viewer cannot mutate state.

---

## 4. Financial & Mathematical Integrity
- [x] **Minor Units Enforced**: All currency stored in integer cents with zero floating point drift.
- [x] **Finance Reconciliation Verified**: `financeReconciliationService` proves `Invoice Total - Allocations = Balance` and `Payment Amount - Allocations = Unallocated`.
- [x] **Invoice Statuses Derived**: Paid invoices cannot have positive balances; overdue status derives from organisation timezone.

---

## 5. Attendance Calculation Consistency
- [x] Single authoritative formula used across dashboards, student profiles, analytics, reports, and portals (`metricCalculations.calculateAttendanceRate`).
- [x] Excused absences exempted from penalty by default.

---

## 6. Self-Service Portals
- [x] **Guardian Portal**: Independent layout, authenticated routes, verified linked learners only, fee settlement and consent forms operational.
- [x] **Learner Portal**: Mobile-first bottom navigation, timetable inspection, home practice logging, repertoire viewing, zero access to guardian billing.

---

## 7. Platform Operations & Resilient Integrations
- [x] **External Provider Safety**: Platform fails gracefully if Email, SMS, or WhatsApp APIs are unconfigured; fallback to manual prepared dispatches.
- [x] **Data Quality Scanner**: Integrated in Settings → System Preferences; detects orphaned records, broken group links, and financial anomalies.
- [x] **Safe Export Engine**: Data export strips passwords, tokens, API keys, and webhook secrets.
- [x] **Seed Safety Lock**: Demo seed script strictly blocked in production (`NODE_ENV === 'production'`).
- [x] **Migration Framework**: Versioned migrations support dry-run validation.

---

## 8. Documentation Completeness
- [x] `README.md`: Updated with full system capabilities and setup.
- [x] `ARCHITECTURE.md`: Layered flow, tenant isolation, and finance design.
- [x] `DATA_MODEL.md`: Entity relationships and collection schema directory.
- [x] `SECURITY.md`: RBAC matrix, Firestore/Storage rules, and threat model.
- [x] `OPERATIONS.md`: Deployment, monitoring, rollback, and backup review.
- [x] `ADMIN_GUIDE.md`: Operational manual for academy directors and staff.
- [x] `PORTAL_GUIDE.md`: Self-service instructions for guardians and learners.
- [x] `RECOVERY.md`: Disaster recovery, backup restoration, and incident triage.
- [x] `CHANGELOG.md`: Release notes for `1.0.0-rc.1`.

---

## 9. Post-Deployment Smoke Test (Verification)
1. Log in with an administrator account.
2. Verify Executive Dashboard loads without console errors.
3. Open Learners directory; inspect sample student profile.
4. Verify Attendance Registers load and calculate percentage rates.
5. Open Invoices and Payments; verify balance calculations.
6. Test Guardian Portal login at `/portal/login`.
7. Verify 404 page handles non-existent routes (`/random-path`) with contextual back navigation.
8. Navigate to Settings → System Preferences; verify release metadata reads `v1.0.0-rc.1`.
