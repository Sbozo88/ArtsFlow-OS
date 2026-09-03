# ArtsFlow OS — Security Model & Compliance Architecture

This document describes the security policies, tenant isolation mechanisms, access control hierarchies, and threat mitigation practices implemented across **ArtsFlow OS**.

---

## 1. Threat Model & Design Principles

ArtsFlow OS is built on four core security tenets:

1. **Multi-Tenant Isolation**: No organisation may view, query, or mutate another organisation's records.
2. **Deny-by-Default Authorization**: All Cloud Firestore and Storage paths deny reads and writes unless explicitly authorized by rules.
3. **Role & Relationship Boundary Enforcement**: Administrative privileges are strictly separated from teacher, finance, and viewer roles. External users (Guardians and Learners) have zero access to the internal administration workspace.
4. **Defense in Depth**: Access control is enforced across three distinct layers:
   - Client-side route guards and explicit external-role redirects.
   - Business service authorization assertions (`permissionService.can(...)`, `guardianAccessService`).
   - Cloud Firestore & Storage server-side security rules.

---

## 2. Role-Based Access Control (RBAC) Matrix

ArtsFlow OS defines 8 distinct system roles:

| Module / Permission | Super Admin | Org Admin | Programme Director | Finance | Teacher | Viewer | Guardian | Learner |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Learners (Read)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌* | ❌* |
| **Learners (Write)** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Learners (Archive)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Attendance (Read)** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌* | ❌* |
| **Attendance (Write/Mark)** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Finance (Read Invoices/Pay)** | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌* | ❌ |
| **Finance (Create Invoices/Pay)** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Finance (Reversals/Adjust)** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Events (Read/View)** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌* | ❌* |
| **Events (Manage/Publish)** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Staff Directory (Read)** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Timesheets (Verify)** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Timesheets (Approve)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Settings (Read)** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Settings (Manage)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Automation Rules (Manage)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Platform Operations & Logs** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **User & Role Administration** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

*\*Note: Guardians and learners have zero access to the internal administration workspace. Guardian relationship-scoped data access remains a production release gate; learner self-service is deferred.*

---

## 3. Server-Side Security Rules

### Cloud Firestore Rules (`firestore.rules`)
- **Default Deny**: `match /{document=**} { allow read, write: if false; }`.
- **Organisation Membership Check**: Operational collections require an immutable user tenant and an authorised internal role. New tenant bootstrap is restricted to the deterministic `org_<Firebase UID>` identifier.
- **Invitation Protection**: Portal invitation records are not publicly enumerable. A server-mediated acceptance flow is required before production guardian onboarding is enabled.
- **Immutable Audit Logs**: The `auditLogs` collection strictly disallows `update` and `delete`.

### Cloud Storage Rules (`storage.rules`)
- **Path Isolation**: Files must reside under `/organisations/{orgId}/...`.
- **Size Constraints**: Standard documents and recordings are capped at 25MB (`request.resource.size < 25 * 1024 * 1024`), and branding images at 5MB.
- **Binary Execution Prevention**: Executable scripts (`.exe`, `.sh`, `.php`, `.js`, `.html`) are rejected by content-type verification.

---

## 4. Webhook & External API Security

No inbound webhook runtime or payment gateway is deployed in v1.0. Any future webhook implementation must validate provider signatures server-side, store idempotency keys, reject replays, and keep secrets out of the browser. The application must not describe those controls as active before a Cloud Functions implementation and integration test exist.

---

## 5. Secret Handling & Environment Separation

- **No Server Secrets in Source**: Provider secrets and service-account credentials must never enter source control. Firebase web configuration is a public client identifier and is restricted by Firebase/Google Cloud configuration and Security Rules, not treated as an authorisation secret.
- **Sanitized Exports**: The data export engine (`platformOperationsService.exportOrganisationData`) automatically strips fields named `password`, `token`, `secret`, `apiKey`, and `webhookSecret`.
- **Production Lockout on Utilities**: Demo database seed scripts and destructive migration commands refuse execution if `NODE_ENV === 'production'`.

---

## 6. Incident Reporting & Vulnerability Disclosure

If you identify a potential security vulnerability in ArtsFlow OS, please report it privately:
- **Security Contact**: security@artsflow.example.com
- Please include: description of the issue, affected endpoint or rule, and reproducible proof-of-concept steps.
- Do NOT open public issues on GitHub for undisclosed security vulnerabilities.
