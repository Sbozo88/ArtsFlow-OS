# ArtsFlow OS — System Architecture

This document describes the architectural patterns, multi-tenant isolation model, domain service layer, security hierarchy, and data flow pipelines for **ArtsFlow OS**.

---

## 1. High-Level Architectural Flow

```text
[ Browser / Client Views ]
          │
          ▼
[ Custom React Hooks Layer ]
          │
          ▼
[ Business Domain Services ] ──(Audit Trail)──► [ auditLogs Collection ]
          │
          ▼
[ Base Repository (Tenant Scoped) ]
          │
          ▼
[ Cloud Firestore & Storage ] ◄──(Rules Enforcement)── [ firestore.rules & storage.rules ]
```

### Key Architectural Tenets
1. **Separation of Concerns**: UI components never directly mutate Firestore documents. All mutations, business validations, and authorization checks are contained in dedicated service classes in `src/services/`.
2. **Tenant Scoping at Data Layer**: Every persistent repository extends `BaseRepository<T>`, automatically attaching `organisationId`, `createdAt`, `updatedAt`, `createdBy`, and `updatedBy` to all document writes.
3. **Immutability of Audit Trails**: Sensitive operations (e.g. enrolment changes, invoice cancellations, payment allocations, timesheet verifications) automatically append tamper-evident entries into the `auditLogs` collection.

---

## 2. Multi-Tenant Isolation Model

ArtsFlow OS supports isolated multi-tenant operation where multiple arts academies operate securely on a single Firebase infrastructure instance.

### Tenant Resolution
1. **Internal Staff & Administrators**: Authenticated via Firebase Auth. The user document (`/users/{uid}`) contains the user's `organisationId` and `role`.
2. **Firestore Rule Enforcement**:
   ```javascript
   function isUserInOrg(orgId) {
     return request.auth != null && (
       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organisationId == orgId
     );
   }
   ```
   Every operational collection requires `isUserInOrg(resource.data.organisationId)` for read and update operations.
3. **Cross-Tenant Leak Prevention**: Repository queries automatically filter by `where('organisationId', '==', orgId)`. Client-side forgery of `organisationId` in update requests is strictly blocked at the security rule layer with `isOrgUnchanged()`.

---

## 3. External Portal Architecture

To safely allow external guardians and learners access to academy resources without granting internal staff privileges, ArtsFlow OS implements **Relationship-Based Portal Isolation**.

### Guardian Portal Isolation
- Guardians authenticate with standard Firebase Auth credentials.
- Their `AuthRole` is strictly `'guardian'`, granting zero permissions in the internal staff system (`ROLE_PERMISSIONS.guardian = []`).
- An authoritative context resolution service (`guardianAccessService.resolveGuardianContext`) verifies active status in `guardianPortalAccess` and identifies the guardian's verified linked learners from `learnerGuardians`.
- Guardians can strictly query only:
  - Attendance records matching their linked `learnerId`.
  - Invoices addressed to their `guardianId` or linked `learnerId`.
  - Consent requests targeted to their `guardianId`.
  - Messages addressed to their recipient identity.

### Learner Portal Isolation
- Students authenticate with student accounts (`AuthRole` = `'learner'`).
- The learner portal service (`learnerAccessService.resolveLearnerContext`) verifies student identity in `learnerPortalAccess`.
- Internal staff notes, disciplinary remarks, and financial billing details are defensively stripped before transmission to learner views.

---

## 4. Financial Architecture & Money Consistency

The finance domain is designed with banking-grade calculation guarantees:

1. **Integer Minor Units (Zero Floating Point Drift)**:
   - All amounts on charges, invoices, payments, allocations, waivers, and discounts are stored exclusively in **integer cents** (e.g. `R450.00` is represented as `45000`).
   - Utilities in `src/lib/money.ts` (`addMoney`, `subtractMoney`, `toCents`, `toMajor`, `calculateBalance`) ensure all arithmetic is integer-safe.
2. **Concurrency-Safe Number Generation**:
   - Invoices (`INV-YYYY-XXXXXX`) and Payments (`PAY-YYYY-XXXXXX`) use atomic Firestore transactions (`runTransaction`) on sequential counter documents (`invoiceCounters` and `paymentCounters`) to guarantee contiguous, collision-free numbering.
3. **Immutable History & Authoritative Derivation**:
   - Payments and Invoices are never directly deleted; cancellations and reversals generate explicit offsetting allocation state changes.
   - An invoice's `balance` and `amountPaid` are strictly derived from active payment allocations (`SUM(allocations.amount)`), verified via `financeReconciliationService`.

---

## 5. Attendance Calculation Definition

Attendance compliance across dashboards, analytics, reports, guardian portals, and learner profiles adheres to a single authoritative formula:

$$\text{Attendance Rate} = \frac{\text{Present} + \text{Late}}{\text{Present} + \text{Late} + \text{Absent}} \times 100$$

- **Excused absences** are exempted from penalty and excluded from the denominator by default.
- Custom organisation policies (e.g., counting late arrivals as partial attendance or including excused in denominator) are governed by `organisationSettings.attendance` and centralized in `metricCalculations.calculateAttendanceRate`.

---

## 6. Workflow Automation Engine

The automation subsystem (`src/services/automation/`) automates operational tasks without user intervention:

1. **Trigger Types**:
   - `on_session_missed`: Triggers when attendance registers record absent or late marks.
   - `on_consecutive_absence`: Triggers when streak exceeds configured threshold (default: 3).
   - `on_invoice_issued` & `on_invoice_overdue`: Triggers automated fee reminders.
   - `on_event_created`: Schedules consent request creation and staff notifications.
2. **Safety & Loop Prevention**:
   - **Cooldown Windows**: Enforces minimum intervals (e.g., 24h) between re-triggering the same rule for the same entity.
   - **Deduplication Hashes**: Generates deterministic execution keys (`ruleId_entityId_date`) to prevent duplicate dispatches.
   - **Human Approval Boundaries**: Sensitive actions (e.g. writing off debt, expelling learners) are prohibited from automated execution.

---

## 7. Integration Abstraction Layer

All external communications and external services implement resilient adapter interfaces (`src/services/communicationDeliveryService.ts` and `src/services/platformOperationsService.ts`):

- **Graceful Fallbacks**: If an external provider (e.g., SMS or WhatsApp Cloud API) is unavailable or unconfigured, the system gracefully falls back to structured manual dispatches (`wa.me` browser intents or prepared SMS segments) with the status `'prepared'`, rather than failing or falsely claiming `'delivered'`.
- **Zero Hard Dependencies**: Core academy operations (timetabling, attendance, enrolment, and billing) remain 100% functional without external API credentials.
