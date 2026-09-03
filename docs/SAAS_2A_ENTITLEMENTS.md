# ArtsFlow OS v1.1 — SaaS 2A: Plans, Features & Entitlements

## Overview

The SaaS 2A phase establishes the commercial product definition and entitlement resolution architecture for ArtsFlow OS. It decouples product capabilities, subscription tiers, and customer access from billing mechanics.

```text
Platform Feature → Subscription Plan → Plan Entitlement → Organisation → Entitlement Resolver → Feature Access
```

---

## Core Domain Architecture

### 1. Platform Features (`platformFeatures`)
Global registry of functional capabilities, limit meters, and platform modules.
- **Keys**: Immutable string machine identifiers (`core.learners`, `music.core`, `dance.core`, `events.core`, `finance.core`, `guardian_portal`, etc.).
- **Categories**: `core`, `music`, `dance`, `events`, `finance`, `portals`, `automation`, `analytics`, `platform`, `limits`.
- **Status**: `active`, `beta`, `experimental`, `inactive`.
- **Safety Kill Switch**: If `featureStatus === 'inactive'`, the feature is immediately forced to `enabled: false` across all organisations and plans with `source: 'system'`.

### 2. Subscription Plans (`subscriptionPlans`)
Commercial product tiers offered by ArtsFlow:
1. **`legacy_full` (`plan_legacy_full`)**: Internal compatibility tier granting full operational access to established v1.0 tenants without disruption.
2. **`starter` (`plan_starter`)**: Essential student administration, group classes, attendance, documents, and guardian portal.
3. **`professional` (`plan_professional`)**: Comprehensive performing arts academy operations with Music, Dance, Events, and School Invoicing.
4. **`premium` (`plan_premium`)**: Advanced multi-discipline arts organisation with Automation, Advanced Analytics, and higher limit caps.
5. **`enterprise` (`plan_enterprise`)**: Full feature set, unlimited limits, white-label custom domain, and dedicated support.

### 3. Plan Entitlements (`planEntitlements`)
Deterministic mapping between a subscription plan and a platform feature.
- Document ID format: `plan_{planId}_{featureKey}`.
- Fields: `enabled: boolean`, `limitValue: number | null`, `configuration?: Record<string, unknown>`.

### 4. Organisation Entitlement Overrides (`organisationEntitlementOverrides`)
Tenant-specific time-bound overrides granted or restricted by platform super administrators:
- **Override Types**: `enable`, `disable`, `limit`, `configuration`.
- **Precedence**: Overrides take precedence over plan defaults unless overridden by a platform-level inactive kill switch.
- **Safety & Compliance**: Requires a mandatory non-empty `reason` audit explanation.
- **Time Windows**: Evaluates `startsAt` and `expiresAt`; expired overrides are automatically ignored by the resolver.

---

## Entitlement Resolution Order

The `EntitlementResolverService` resolves feature access in the following strict deterministic sequence:

1. **Organisation Resolution**:
   Lookup organisation document. If `assignedPlanId` is missing or undefined, automatically fall back to `'plan_legacy_full'`.
2. **Plan Entitlement Loading**:
   Fetch `planEntitlements` for the assigned plan. If records are unseeded, fall back to the declarative `STANDARD_PLANS` registry.
3. **Organisation Overrides Application**:
   Query active overrides for the organisation (`status === 'active'`, `startsAt <= now`, `expiresAt > now`). Active overrides supersede plan entitlements with `source: 'override'`.
4. **Platform Kill Switch (System Inactive Rule)**:
   If `PlatformFeature.featureStatus === 'inactive'`, access is forced to `enabled: false` with `source: 'system'`.
5. **In-Memory Cache**:
   Results are cached for 5 minutes (`CACHE_TTL_MS = 300,000`). Cache is explicitly invalidated on plan assignment or override mutation.

---

## UI & Navigation Gating

- **`EntitlementContext`**: Root React provider exposing `hasFeature(key)`, `getLimit(key)`, and `refreshEntitlements()`.
- **`Sidebar`**: Dynamically filters navigation groups and items based on the active organisation's entitlements.
- **`FeatureRoute`**: Route guard that intercepts navigation to non-entitled routes and redirects to `/access-denied` with informative contextual upgrade messaging.
- **`FeatureGate`**: Component wrapper for button-level and section-level feature gating with optional fallback UI.

---

## Security & Anti-Self-Upgrade

1. **Firestore Security Rules**:
   - `platformFeatures`, `subscriptionPlans`, `planEntitlements`, and `organisationEntitlementOverrides` cannot be written to by tenant users or organisation admins. Only authenticated `isPlatformAdmin()` users can mutate them.
   - Updates to `/organisations/{orgId}` strictly prohibit regular organisation admins from modifying `assignedPlanId`, `tenantStatus`, `suspensionReason`, or `restrictionReason`.
2. **Operational Service Enforcement**:
   - `invoiceService.createInvoiceFromCharges`: Rejects execution if `finance.core` is disabled.
   - `musicAssessmentService.recordAssessment`: Rejects execution if `music.core` is disabled.
   - `automationExecutionService.runRule`: Rejects execution if `automation.core` is disabled.
   - `guardianInvitationService.inviteGuardian`: Rejects execution if `guardian_portal` is disabled.
