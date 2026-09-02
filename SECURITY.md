# ArtsFlow OS — Security Model & Compliance Architecture

This document describes the security policies, tenant isolation mechanisms, access control hierarchies, and threat mitigation practices implemented across **ArtsFlow OS**.

---

## 1. Threat Model & Design Principles

ArtsFlow OS is built on four core security tenets:

1. **Multi-Tenant Isolation**: No organisation may view, query, or mutate another organisation's records.
2. **Deny-by-Default Authorization**: All Cloud Firestore and Storage paths deny reads and writes unless explicitly authorized by rules.
3. **Role & Relationship Boundary Enforcement**: Administrative privileges are strictly separated from teacher, finance, and viewer roles. External users (Guardians and Learners) have zero access to the internal administration workspace.
4. **Defense in Depth**: Access control is enforced across three distinct layers:
   - Client-side route guards (`ProtectedRoute`, `GuardianProtectedRoute`, `LearnerProtectedRoute`).
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

*\*Note: Guardians and Learners access only their own verified, relationship-scoped data via dedicated portal endpoints (`/portal/...`). They have zero access to the admin system or peer records.*

---

## 3. Server-Side Security Rules

### Cloud Firestore Rules (`firestore.rules`)
- **Default Deny**: `match /{document=**} { allow read, write: if false; }`.
- **Organisation Membership Check**: All collections enforce `isUserInOrg(resource.data.organisationId)`:
  ```javascript
  function isUserInOrg(orgId) {
    return request.auth != null && (
      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organisationId == orgId
    );
  }
  ```
- **Anti-Enumeration Protection**: Public endpoints (e.g. `guardianInvitations`, `consentRequests`) split `get` and `list`. Direct document lookup with a token/id is permitted (`allow get: if ...`), while collection scans without authorization are blocked (`allow list: if isUserInOrg(...)`).
- **Immutable Audit Logs**: The `auditLogs` collection strictly disallows `update` and `delete`.

### Cloud Storage Rules (`storage.rules`)
- **Path Isolation**: Files must reside under `/organisations/{orgId}/...`.
- **Size Constraints**: Standard documents and recordings are capped at 25MB (`request.resource.size < 25 * 1024 * 1024`), and branding images at 5MB.
- **Binary Execution Prevention**: Executable scripts (`.exe`, `.sh`, `.php`, `.js`, `.html`) are rejected by content-type verification.

---

## 4. Webhook & External API Security

1. **HMAC-SHA256 Signature Verification**: Inbound payment webhooks (e.g. Paystack / payment providers) require cryptographic signature validation using shared webhook secrets stored server-side.
2. **Idempotency Guarantees**: Webhook events check recorded transaction hashes (`paymentEvents`) to prevent double-crediting or duplicate invoice allocations.
3. **URL Protocol Sanitization**: Webhook endpoints and calendar URLs must use strict `https://` protocols. Unsafe `javascript:` or `data:` URLs are rejected by client and server validators.

---

## 5. Secret Handling & Environment Separation

- **No Secrets in Source**: Firebase API keys and secrets are loaded exclusively via environment variables (`.env.local`).
- **Sanitized Exports**: The data export engine (`platformOperationsService.exportOrganisationData`) automatically strips fields named `password`, `token`, `secret`, `apiKey`, and `webhookSecret`.
- **Production Lockout on Utilities**: Demo database seed scripts and destructive migration commands refuse execution if `NODE_ENV === 'production'`.

---

## 6. Incident Reporting & Vulnerability Disclosure

If you identify a potential security vulnerability in ArtsFlow OS, please report it privately:
- **Security Contact**: security@artsflow.example.com
- Please include: description of the issue, affected endpoint or rule, and reproducible proof-of-concept steps.
- Do NOT open public issues on GitHub for undisclosed security vulnerabilities.
