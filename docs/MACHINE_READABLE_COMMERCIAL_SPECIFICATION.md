# ArtsFlow OS — Machine-Readable Commercial Entitlement Specification

This document is the **implementation contract** between our commercial strategy and ArtsFlow's SaaS entitlement system.

> **Implementation Directive**:  
> Prior to configuration execution, inspect the existing `platformFeatures` registry (`src/config/platformFeaturesRegistry.ts`) and **reuse existing machine keys**. The keys below are the canonical structure; existing equivalent keys take precedence.

---

### 1. Plan identities

```yaml
plans:

  starter:
    id: plan_starter
    name: ArtsFlow Starter
    monthly_price_zar: 499
    annual_price_zar: 4990
    trial_days: 14
    status: active
    public: true

  professional:
    id: plan_professional
    name: ArtsFlow Professional
    monthly_price_zar: 999
    annual_price_zar: 9990
    trial_days: 14
    status: active
    public: true
    recommended: true
```

---

### 2. Core feature entitlements

```yaml
features:

  core.learners:
    starter: true
    professional: true

  core.guardians:
    starter: true
    professional: true

  core.staff:
    starter: true
    professional: true

  core.programmes:
    starter: true
    professional: true

  core.groups:
    starter: true
    professional: true

  core.enrolments:
    starter: true
    professional: true

  core.calendar:
    starter: true
    professional: true

  core.documents:
    starter: true
    professional: true

  core.followups:
    starter: true
    professional: true
```

---

### 3. Teaching

```yaml
  teaching.sessions:
    starter: true
    professional: true

  teaching.attendance:
    starter: true
    professional: true

  teaching.assessments:
    starter: true
    professional: true

  teaching.resources:
    starter: true
    professional: true

  teaching.advanced_attendance_analytics:
    starter: false
    professional: true

  teaching.automated_interventions:
    starter: false
    professional: true
```

---

### 4. Music

> **Policy**: Do **not** make Music a premium upgrade.

```yaml
  music.core:
    starter: true
    professional: true

  music.ensembles:
    starter: true
    professional: true

  music.instruments:
    starter: true
    professional: true

  music.repertoire:
    starter: true
    professional: true

  music.practice:
    starter: true
    professional: true

  music.assessments:
    starter: true
    professional: true
```

---

### 5. Dance

```yaml
  dance.core:
    starter: true
    professional: true

  dance.groups:
    starter: true
    professional: true

  dance.levels:
    starter: true
    professional: true

  dance.choreography:
    starter: true
    professional: true

  dance.practice:
    starter: true
    professional: true

  dance.assessments:
    starter: true
    professional: true
```

---

### 6. Parent/Guardian Portal

```yaml
  guardian_portal:
    starter: true
    professional: true

  guardian_portal.progress:
    starter: true
    professional: true

  guardian_portal.finance:
    starter: true
    professional: true

  guardian_portal.consent:
    starter: false
    professional: true
```

---

### 7. School Finance

> **Policy**: Maintain strict architectural separation from **ArtsFlow's own SaaS subscription billing**.

```yaml
  finance.core:
    starter: true
    professional: true

  finance.charges:
    starter: true
    professional: true

  finance.invoices:
    starter: true
    professional: true

  finance.payments:
    starter: true
    professional: true

  finance.basic_reports:
    starter: true
    professional: true

  finance.reconciliation:
    starter: false
    professional: true

  finance.advanced_reports:
    starter: false
    professional: true
```

---

### 8. Events, Consent & Transport

> **Policy**: This is one of the major Professional upgrade boundaries. Starter should still be able to **see relevant calendar entries** without receiving the operational Events management module.

```yaml
  events.core:
    starter: false
    professional: true

  events.participants:
    starter: false
    professional: true

  events.performance_management:
    starter: false
    professional: true

  events.staff:
    starter: false
    professional: true

  consent.core:
    starter: false
    professional: true

  consent.automation:
    starter: false
    professional: true

  transport.core:
    starter: false
    professional: true
```

---

### 9. Communication

```yaml
  communication.core:
    starter: true
    professional: true

  communication.individual:
    starter: true
    professional: true

  communication.groups:
    starter: false
    professional: true

  communication.bulk:
    starter: false
    professional: true

  communication.automated:
    starter: false
    professional: true
```

---

### 10. Staff Operations

```yaml
  staff_operations.core:
    starter: false
    professional: true

  staff_operations.timesheets:
    starter: false
    professional: true

  staff_operations.substitutions:
    starter: false
    professional: true

  staff_operations.payment_preparation:
    starter: false
    professional: true
```

---

### 11. Analytics & Automation

```yaml
  analytics.basic:
    starter: true
    professional: true

  analytics.advanced:
    starter: false
    professional: true

  analytics.cross_programme:
    starter: false
    professional: true

  automation.core:
    starter: false
    professional: true

  automation.attendance:
    starter: false
    professional: true

  automation.payments:
    starter: false
    professional: true

  automation.consent:
    starter: false
    professional: true

  automation.operational_alerts:
    starter: false
    professional: true
```

---

### 12. Numeric limits

These use the existing SaaS 2A entitlement/limit mechanism and existing usage-metering architecture.

```yaml
limits:

  active_learners:
    starter: 100
    professional: 500

  users:
    starter: 10
    professional: 50

  organisation_admins:
    starter: 2
    professional: 10

  programmes:
    starter: 5
    professional: null

  groups:
    starter: 15
    professional: null

  locations:
    starter: 1
    professional: 5

  storage_gb:
    starter: 5
    professional: 25
```

> `null` means commercially marketed as unlimited, but the backend retains a reasonable-use safety ceiling.

---

### 13. Limit enforcement standard

All numeric limits follow:

```yaml
usage_policy:

  warning_threshold: 0.80
  critical_threshold: 0.90
  limit_threshold: 1.00

  at_80_percent:
    action: warning

  at_90_percent:
    action: upgrade_prompt

  at_100_percent:
    action: block_increment_only

  existing_data_access:
    always_allowed: true
```

> **Critical Rule**:  
> **Never hold existing customer data hostage because a usage limit has been reached.**  
> Archiving/deactivating a learner releases an active learner seat where compatible with the existing data model.

```text
100 / 100 learners
        ↓
Existing 100 learners remain accessible
        ↓
[Add Learner] blocked
        ↓
"Your Starter plan supports up to 100 active learners."
        ↓
[Upgrade to Professional]
```

---

### 14. Feature-gate behaviour

When a Starter user encounters a Professional capability:

```text
Professional Feature
        ↓
FeatureGate / FeatureRoute
        ↓
Upgrade State
        ↓
Explain Business Benefit
        ↓
[View Professional]
```

*Not: `403 ACCESS DENIED`.*

A commercial entitlement failure and a security permission failure are distinct states:
- **Security failure**: *"You don't have permission to perform this action."*
- **Commercial feature failure**: *"Event Management is available with ArtsFlow Professional."*

---

### 15. Commercial restriction hierarchy

The existing SaaS architecture remains authoritative:

```text
Platform Feature Status
        ↓
Tenant Status
        ↓
Subscription
        ↓
Plan
        ↓
Organisation Override
        ↓
Feature Entitlement
        ↓
Usage Limit
        ↓
Membership
        ↓
Role / Permission
        ↓
Operation
```

*A plan entitlement must **never** override security permissions.*

---

### 16. Organisation overrides

The existing `organisationEntitlementOverrides` supports exceptions without creating custom plans for every customer:

```yaml
organisation_override:

  organisation: School A
  plan: starter

  overrides:
    events.core:
      enabled: true
      reason: Founding customer pilot
      expires: 2027-01-31
```

All overrides remain auditable.

---

### 17. Trial entitlement

```yaml
trial:
  duration_days: 14
  entitlement_plan: professional
  payment_method_required: false
```

```text
New School
   ↓
14-Day Trial
   ↓
PROFESSIONAL ENTITLEMENTS
   ↓
Trial Conversion
   ├── Starter
   └── Professional
```

---

### 18. Founding Partner pricing

Kept separate from feature entitlements:

```yaml
founding_partner:

  maximum_organisations: 10

  starter:
    monthly_zar: 399

  professional:
    monthly_zar: 799

  price_lock_months: 12

  lifetime_price_lock: false
```

A founding customer's lower price does not require a separate `founding_starter` plan. It uses the same entitlement plan with a different commercial price/subscription arrangement.

---

### 19. Canonical commercial architecture

```text
WHAT CUSTOMER PAYS
PlanPrice
        ↓
WHAT CUSTOMER SUBSCRIBES TO
Subscription
        ↓
WHAT PACKAGE THEY HAVE
SubscriptionPlan
        ↓
WHAT PACKAGE CONTAINS
PlanEntitlements
        ↓
EXCEPTIONS
OrganisationEntitlementOverrides
        ↓
WHAT THEY CAN CURRENTLY USE
EntitlementResolver
        ↓
HOW MUCH THEY CAN USE
Usage Metering
        ↓
WHAT THE USER PERSONALLY CAN DO
Membership + Permission
```

---

## Commercial Specification Status Summary

- **Starter**: R499/month · R4,990/year · 100 learners
- **Professional**: R999/month · R9,990/year · 500 learners
- **Trial**: 14 days of Professional
- **Founding offer**: R399/R799 monthly for first 10 organisations, locked 12 months
- **Music + Dance**: Both plans
- **Operational complexity**: Professional upgrade driver
- **Existing data**: Never blocked because of plan limits
- **Professional**: Recommended / Most Popular
