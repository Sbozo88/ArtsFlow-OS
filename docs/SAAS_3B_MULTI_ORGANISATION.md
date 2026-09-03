# ARTSFLOW OS v1.1 — SAAS 3B: MULTI-ORGANISATION USERS & MEMBERSHIP SWITCHING

## 1. Identity & Architecture Model

In ArtsFlow OS v1.1, a single authenticated user identity may belong to multiple organisations without creating separate accounts or duplicating Firebase Auth records:

```text
AUTHENTICATED IDENTITY (Firebase Auth User)
                  │
                  ├── Organisation A (Role: organisation_admin)
                  │
                  ├── Organisation B (Role: teacher)
                  │
                  └── Organisation C (Role: finance)
```

The authoritative access pipeline:

```text
Firebase Identity
       ↓
Organisation Memberships (active / invited / disabled / revoked)
       ↓
Active Organisation Context (/select-organisation or switcher)
       ↓
Membership Role (distinct per organisation)
       ↓
Permissions (evaluated per active membership)
       ↓
Organisation Subscription (starter / professional / enterprise)
       ↓
Entitlements (commercial feature gates)
       ↓
Tenant Operations (Firestore security rules & repositories)
```

---

## 2. Membership Model

Memberships are stored in the canonical `organisationMemberships` collection with deterministic identity keys:

```text
mem_${userId}_${organisationId}
```

### 2.1 Core Attributes
- `id`: Deterministic key (`mem_${userId}_${organisationId}`)
- `userId`: Reference to the Firebase Auth user UID
- `organisationId`: Reference to the target organisation
- `role`: Role within this specific organisation (`organisation_admin`, `programme_director`, `teacher`, `finance`, `viewer`)
- `membershipStatus`: `active` | `disabled` | `revoked` | `invited`
- `isDefaultOrganisation`: Boolean indicating the user's primary workspace (at most 1 active per user)
- `joinedAt`, `invitedAt`, `acceptedAt`, `disabledAt`, `revokedAt`, `lastActiveAt`
- `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

### 2.2 Role & Platform Separation
- **Different Roles per Tenant**: A user can be `organisation_admin` in Org A and `teacher` in Org B. The tenant role is never stored globally on the `users` document.
- **Platform vs Tenant Separation**: A user with `platformRole = 'super_admin'` cannot perform school operations (such as taking attendance or managing learners) unless they possess an explicit, active `OrganisationMembership` in that specific organisation.

---

## 3. Active Organisation Resolution Lifecycle

When an authenticated user signs in, the system resolves their active workspace using the following deterministic precedence:

1. **Target Requested**: If a specific organisation was requested in session or URL context.
2. **User Preferences**: Resolves `lastActiveOrganisationId` from `userPreferences/{userId}` if the user holds an active membership there.
3. **Default Organisation**: Resolves membership with `isDefaultOrganisation === true`.
4. **Single Organisation Auto-Selection**: If the user has exactly 1 active membership, it is selected automatically without user interaction.
5. **Multi-Organisation Ambiguity**: If the user belongs to multiple organisations with no default or preference, the system redirects to `/select-organisation`.
6. **Zero Memberships**: If the user has 0 active memberships:
   - Platform super admins are redirected to `/platform`.
   - Normal users are redirected to onboarding / pending invite notification.

---

## 4. Organisation Switching Lifecycle

Switching organisations is orchestrated through `switchOrganisation(targetOrgId)`:

```text
User selects Target Organisation
                ↓
1. Validate Switch (tenantContextService.validateOrganisationSwitch)
   - Checks membership exists & matches user ID
   - Verifies membershipStatus === 'active'
   - Checks tenant organisation operational status (active / trial)
                ↓
2. Record Target in User Preferences (userPreferencesRepository)
                ↓
3. Invalidate Previous Tenant Caches
   - entitlementResolverService.invalidateCache(previousOrgId)
   - organisationSettingsService.invalidateCache(previousOrgId)
                ↓
4. Reload Context (AuthContext & ActiveOrganisationContext)
   - Loads target membership role
   - Recalculates permissions
   - Updates active organisation document
                ↓
5. Audit Emission (USER_SWITCH_ORGANISATION)
                ↓
6. Navigation Revalidation
   - Verifies route accessibility under new role
   - If route is unauthorized (e.g. teacher on /settings/finance), redirects safely to /
```

### 4.1 Race Condition Protection
Rapid successive switches (`Org A -> Org B -> Org C`) are protected via monotonic request generation tokens (`generation = ++resolutionGeneration.current`). Slower responses from intermediate organisations are discarded and cannot overwrite the target workspace.

---

## 5. UI Components

1. **Organisation Switcher (`src/components/layout/OrganisationSwitcher.tsx`)**:
   - Integrated into desktop header and mobile menus.
   - Displays active organisation name, brand, and role badge.
   - Dropdown displays all active organisations with operational statuses (e.g. `Trial · 6 days remaining`).
   - Accessible keyboard navigation (Escape, outside click handling).
   - Single-organisation accounts automatically display static title without dropdown clutter.
2. **Organisation Selection Page (`/select-organisation`)**:
   - Card grid allowing users with multiple unassigned workspaces to select an active organisation and set their default.
3. **My Organisations Page (`/account/organisations`)**:
   - Dedicated management view displaying all memberships, roles, statuses, and default toggles.
   - Enforces atomic default reassignments where only one membership is default at any time.

---

## 6. Threat Model & Security Controls

| Threat | Mitigation |
|---|---|
| **Cross-Tenant Cache Leakage** | Caches in `entitlementResolverService` and `organisationSettingsService` are strictly keyed by `organisationId` and cleared on switch. |
| **Stale Membership Reuse** | `tenantContextService.validateOrganisationSwitch` re-evaluates membership from Firestore prior to context activation. |
| **Role Escalation via Client Context** | Firestore security rules derive permissions from the authenticated UID and membership document; client-reported `activeOrganisationId` is never trusted. |
| **Platform Privilege Leakage** | `PLATFORM_PERMISSIONS` and `ALL_PERMISSIONS` are strictly decoupled. `super_admin` in `platformRole` cannot perform tenant actions without an `organisationMembership`. |
| **Tenant Switch Race Condition** | Monotonic generation tokens ensure that out-of-order network responses cannot activate stale tenant state. |
| **Revoked / Disabled Identity Access** | Memberships marked `disabled` or `revoked` immediately fail switch validation and trigger tenant access revocation. |

---

## 7. Migration & Data Quality Tools

1. **Preference Normalisation (`scripts/migrations/normalise-user-organisation-preferences.ts`)**:
   - Identifies duplicate defaults across user memberships.
   - Deterministically demotes conflicting defaults.
   - Bootstraps missing defaults and `userPreferences` for legacy accounts.
   - Fully idempotent with `--dry-run` safety mode.
2. **Membership Health Diagnostics (`platformOperationsService.scanMembershipHealth`)**:
   - Scans memberships for duplicates, orphaned references, invalid roles, and conflicting defaults.
