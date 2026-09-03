# ARTSFLOW OS v1.1 — SAAS 3A: CUSTOMER PROVISIONING & SCHOOL ONBOARDING

## 1. System Overview

SaaS 3A completes the automated, orchestrated lifecycle that transitions a prospective school or arts academy into an operational tenant on ArtsFlow OS:
```text
Customer Order / Request
         ↓
Platform Provisioning Service (Idempotent Orchestrator)
         ↓
Organisation (tenantStatus: 'provisioning') + Subscription / Trial Attached
         ↓
Initial Admin Membership / Secure Invitation
         ↓
Default Settings + Calendar Terms Bootstrapped
         ↓
Customer-Facing Guided Onboarding Wizard (/onboarding)
         ↓
Readiness Engine Evaluation (100% checks)
         ↓
Go-Live Transition (tenantStatus: 'trial' or 'active')
```

---

## 2. Core Architecture & Services

### 2.1 Organisation Provisioning Service (`src/services/provisioning/organisationProvisioningService.ts`)
Orchestrates the multi-stage provisioning flow with deterministic idempotency:
- **Idempotency Key**: Each provisioning request is keyed by `provisioningRequestId` (e.g. `prov_org-name_hash`). Retrying an identical request reuses the existing `ProvisioningJob` without duplicate records.
- **Atomic Stage Progression**:
  1. `organisation_created`: Writes `Organisation` document with `tenantStatus: 'provisioning'`.
  2. `subscription_created`: Creates a trial, active manual, or complimentary subscription.
  3. `admin_invited`: Evaluates whether the primary admin email exists in `users`:
     - Existing user: Direct `OrganisationMembership` with `organisation_admin` role.
     - New user: Expiring `OrganisationInvitation` with secure token.
  4. `settings_bootstrapped`: Clones template settings (e.g. `school_music`) and writes active `OrganisationSettings`.
  5. `calendar_created`: Creates current operational academic terms (Term 1 & Term 2).
  6. `onboarding_initialized`: Initializes `OrganisationOnboarding` with `currentStep: 'welcome'`.
- **Fault Recovery & Retry**:
  If any stage encounters an error, the job records `jobStatus: 'failed'`, logs an error reference code, and audits `PLATFORM_FAIL_ORGANISATION_PROVISIONING`. Calling `retryProvisioning(actorId, jobId)` safely resumes from the point of failure without duplicate records.

### 2.2 Organisation Templates (`src/services/onboarding/onboardingTemplateService.ts`)
Pre-configured templates tailoring defaults by discipline:
- `school_music`: Music school with instrument ensembles, ensembles, terms, and tuition policies.
- `music_academy`: Classical/contemporary academy with ensembles, choirs, and orchestras.
- `dance_school`: Dance academy with classes and company ensembles.
- `community_arts`: Non-profit community arts centre with workshops and classes.
- `combined_arts`: Multi-disciplinary performing arts institute.

### 2.3 Onboarding Progress Service (`src/services/onboarding/organisationOnboardingService.ts`)
Tracks step progression, step skips, and progress persistence:
- **Effective Steps Dynamic Filtering**: Filters steps based on active plan entitlements (e.g. hides finance steps if `finance.core` is disabled).
- Steps:
  1. `welcome`
  2. `profile`
  3. `branding`
  4. `programmes`
  5. `academic_calendar`
  6. `attendance_defaults`
  7. `finance_defaults` (entitlement-gated)
  8. `staff_invites`
  9. `learner_import`
  10. `guardian_readiness`
  11. `security_review`
  12. `readiness_check`
  13. `go_live`

### 2.4 Readiness Engine (`src/services/onboarding/organisationReadinessService.ts`)
Performs dynamic, live system evaluation across 7 operational pillars:
1. `profile_configured`: Valid name, discipline type.
2. `admin_membership`: Active admin membership or pending invitation.
3. `subscription_operational`: Operational trialing, active, or complimentary subscription.
4. `programmes_created`: At least one active programme created.
5. `groups_created`: At least one class/ensemble/group created.
6. `core_settings`: Settings initialized and active.
7. `finance_configured`: If `finance.core` enabled, checks currency and invoice numbering prefix.

**Go-Live Policy (`completeOrganisationOnboarding`)**:
- Verifies 100% of required readiness conditions are satisfied.
- Updates `OrganisationOnboarding.onboardingStatus = 'completed'`.
- Transitions `Organisation.tenantStatus`:
  - `trialing` subscription $\to$ `'trial'`
  - `active` / `complimentary` subscription $\to$ `'active'`
- Audits `ORGANISATION_COMPLETE_ONBOARDING`.

---

## 3. UI Integrations

1. **Platform Admin Super Console (`/platform/organisations`)**:
   - `Provision Organisation` modal with plan selection, mode selection (`trial`, `manual_active`, `complimentary`), template selection, currency, and primary administrator details.
   - Onboarding Status badge column (`LIVE`, `READY`, `IN PROGRESS`, `NOT STARTED`).
2. **Platform Organisation Detail (`/platform/organisations/:id`)**:
   - Dedicated `Provisioning & Onboarding Status` card showing active provisioning job, stages completed, live readiness score, and `Retry Provisioning` action.
3. **Customer Guided Onboarding Wizard (`/onboarding`)**:
   - 13-step wizard with step navigation, progress indicator, CSV learner validator, programme/group creator, staff inviter, and celebratory go-live activation.
4. **Dashboard Setup Banner (`/dashboard`)**:
   - Prompts organisation admins to resume and complete setup if onboarding is incomplete.

---

## 4. Firestore Security Rules

Collections secured under `firestore.rules`:
- `organisationOnboarding`: Restricted to organisation admins or platform operators (`platform.provisioning.manage`).
- `provisioningJobs`: Read/write restricted to platform operators with `platform.provisioning.manage`.
- `organisationTemplates`: Read-only to authenticated users, write restricted to platform operators.

---

## 5. Automated Verification

- **Unit & Integration Suite**: 16 dedicated tests in `src/services/__tests__/provisioningAndOnboarding.test.ts`.
- **Total Suite**: 15 test files, 229 tests, 100% passing.
- **Rules Tests**: 16 emulator tests, 100% passing.
- **Build**: Vite production bundle compiled with 0 errors.
