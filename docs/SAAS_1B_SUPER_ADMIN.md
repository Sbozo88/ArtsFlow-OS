# ArtsFlow OS v1.1 — SaaS 1B: Platform Super Admin Console

## 1. Executive Summary

ArtsFlow OS v1.1 establishes the dedicated **Platform Super Admin Console** for the SaaS operator. It provides full oversight and governance across all customer school tenants, user identities, and infrastructure health without violating tenant privacy or contaminating school operational spaces.

---

## 2. Platform Scope vs. Organisation Scope

| Dimension | Platform Scope | Organisation Scope |
| :--- | :--- | :--- |
| **Actor** | SaaS Company / Operator (`super_admin`) | School Administrator / Staff (`organisation_admin`, `teacher`, etc.) |
| **Route Prefix** | `/platform/*` | `/*` (Operational workspace) |
| **Data Boundary** | Tenant metadata, system health, platform audit | Single tenant's operational data (learners, sessions, invoices) |
| **Layout Shell** | `PlatformLayout` (Dark slate, Super Admin branding) | `Layout` (White / Slate workspace) |
| **Permissions** | `platform.*` (`platform.dashboard.read`, etc.) | `learners.*`, `attendance.*`, `finance.*`, `settings.*` |
| **Direct Ops** | CANNOT mark attendance, issue invoices, or edit learners | Directly conducts school day-to-day operations |

---

## 3. Dedicated Route Architecture

The platform console lives strictly under the `/platform` route namespace, guarded by `PlatformRoute`:

```text
/platform                           -> PlatformDashboardPage (KPIs, tenant distribution, recent activity)
/platform/organisations             -> PlatformOrganisationsPage (Directory, search, filters, provisioning)
/platform/organisations/:orgId      -> PlatformOrganisationDetailPage (Overview, lifecycle controls, audit trail)
/platform/users                     -> PlatformUsersPage (Cross-tenant user directory & memberships)
/platform/health                    -> PlatformHealthPage (Subsystems, gateways, releases)
/platform/audit                     -> PlatformAuditPage (Platform-scoped audit logs)
/platform/settings                  -> PlatformSettingsPage (Platform metadata & environment labels)
```

If an unauthorized user attempts to navigate to `/platform/*`, `PlatformRoute` returns `PlatformAccessDeniedPage` displaying:
> *"You do not have access to the ArtsFlow Platform Administration area."*
No tenant metadata or platform metrics are leaked.

---

## 4. Tenant Lifecycle State Machine

Tenant status is governed exclusively by `tenantLifecycleService`. Arbitrary status updates are rejected.

```text
provisioning
  └──> trial | active

trial
  └──> active | suspended | cancelled

active
  └──> restricted | suspended | cancelled

restricted
  └──> active | suspended | cancelled

suspended
  └──> active | cancelled

cancelled
  └──> archived (Terminal)
```

### High-Impact Actions & Data Preservation
- **Suspension / Restriction / Cancellation**: Strictly requires an explicit justification reason for audit logging.
- **Confirmation**: Destructive transitions require typing the organisation name to confirm.
- **Zero Data Deletion Guarantee**: Suspension or cancellation never mutates or deletes customer records (learners, invoices, attendance, documents). It merely sets `tenantStatus = 'suspended'`, which causes `tenantAccessService.validateAccess()` to reject operational login while keeping all data intact. Restoring the tenant immediately re-enables customer access.

---

## 5. Privacy-Preserving SaaS Analytics

The Super Admin Console does not require, query, or display raw student records, guardian messages, or private school invoices for platform management. `platformMetricsService` computes aggregated counts and safe activity timestamps (`lastActiveAt`) exclusively.

---

## 6. Manual Tenant Provisioning Foundation

`platformOrganisationService.createOrganisation()` allows Super Admins to manually provision new tenant environments:
- Generates a collision-free ID (`org_<random>_<timestamp>`).
- Generates a URL-safe lowercase slug (`slug`).
- Creates the `Organisation` record.
- Optionally provisions an initial `invited` `organisation_admin` membership.
- Emits a `PLATFORM_CREATE_ORGANISATION` platform audit log.

---

## 7. Security Rules Verification

- Ordinary organisation admins CANNOT execute `.collection('organisations').get()` to view other customer tenants.
- Super Admins are granted listing access to `/organisations` and `/organisationMemberships`.
- Anti-escalation rules prevent organisation admins from assigning the `super_admin` role.
