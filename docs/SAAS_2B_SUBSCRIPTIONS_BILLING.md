# ArtsFlow OS v1.1 — SaaS 2B: Trials, Subscriptions & SaaS Billing

## 1. Overview & Architectural Principles

SaaS 2B completes the ArtsFlow OS commercial subscription tier on top of the established multi-tenant (SaaS 1A), platform administration (SaaS 1B), and modular entitlement (SaaS 2A) architectures.

### Core Separation of Financial Domains
ArtsFlow OS maintains strict, non-negotiable separation between two distinct financial domains:

1. **Customer / School Finance** (Learner fees, school invoices, parent payments, event charges, tuition billing):
   - Scope: Guardian/Learner $\to$ School/Arts Organisation.
   - Collections: `charges`, `invoices`, `payments`, `receipts`.
   - Accessible by School Finance roles (`finance`, `organisation_admin`).

2. **ArtsFlow SaaS Commercial Billing** (Platform licensing, subscription plans, provider checkout, SaaS renewals):
   - Scope: School/Arts Organisation $\to$ ArtsFlow Platform Owner.
   - Collections: `subscriptions`, `planPrices`, `billingCustomers`, `saasCheckoutSessions`, `saasBillingEvents`.
   - Controlled exclusively by Platform Super Admins and secure webhook handlers. Customer organisation admins have read-only visibility and checkout initiation rights.

---

## 2. Domain Data Models & Collections

### Subscriptions (`subscriptions`)
Root collection storing commercial tenant contracts:
- `subscriptionStatus`: `'trialing' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'expired' | 'incomplete'`
- `billingMode`: `'provider' | 'manual' | 'complimentary' | 'legacy'`
- `billingInterval`: `'monthly' | 'annual' | 'custom'`
- `priceAmount`: Integer minor units (e.g. `49900` = R499.00 / month).
- `trialStartedAt` / `trialEndsAt`: Time bounds for 14-day commercial trials.
- `currentPeriodStart` / `currentPeriodEnd`: Billing cycle boundaries.
- `cancelAtPeriodEnd`: Boolean supporting graceful non-renewal.

### Plan Pricing (`planPrices`)
Authoritative server-side price catalog:
- Supports integer minor units across currencies (ZAR, USD, GBP).
- Disallows client price tampering: checkout sessions resolve prices strictly by `planId` and `billingInterval` on the server.

### Billing Customers (`billingCustomers`)
Maps organisation tenants to external billing provider customer entities.

### SaaS Checkout Sessions (`saasCheckoutSessions`)
Represents initiated commercial checkout requests with provider redirection tokens.

### SaaS Billing Events (`saasBillingEvents`)
Audit trail of provider webhook notifications:
- Strict idempotency key: `providerType + providerEventId`.
- Duplicate notifications are recognized and acknowledged without duplicate database mutations or redundant audit logs.

---

## 3. Subscription & Trial Lifecycle

```text
Trial (14 Days)
       │
       ├── Trial Expired ──> Restricted Tenant Policy (Read-Only Admin)
       │
       └── Paid / Manual Activation
                 │
                 ▼
             Active Subscription ──> Operational Access (Full Entitlements)
                 │
                 ├── Payment Failed ──> Past Due (7-Day Grace Period)
                 │                            │
                 │                            └── Grace Expired ──> Restricted Tenant
                 │
                 ├── Renewal Succeeded ──> Period Extended
                 │
                 └── Cancellation
                           ├── Immediate ──> Cancelled
                           └── Period End ──> Active until currentPeriodEnd ──> Cancelled
```

### Manual & Complimentary Access Modes
Platform Super Admins can issue:
- **Manual Subscriptions**: For offline bank transfers, government vouchers, or institutional contracts, requiring mandatory justification audits.
- **Complimentary Access**: For pilot partners or internal schools, zero price amount, requiring mandatory justification audits.

---

## 4. Subscription Resolver & Plan Precedence

The effective commercial plan for any organisation is resolved through strict precedence:

```text
1. Active / Trialing Subscription Plan (sub.planId)
       │
       ├── (If none exists or subscription is non-operational)
       ▼
2. Transitional Assigned Plan (org.assignedPlanId)
       │
       ├── (If none exists)
       ▼
3. Legacy Full Access Fallback ('plan_legacy_full')
```

### Zero-Disruption Backward Compatibility
Existing v1.0 organisations without a subscription or assigned plan seamlessly resolve to `plan_legacy_full`, ensuring 100% uninterrupted platform access.

---

## 5. Security & Manual Platform Suspension Protection

### Manual Suspension Protection Rule
If an organisation is manually suspended or restricted by a Platform Super Admin for non-billing reasons (`tenantStatus: 'suspended'` or `restrictionReasonType: 'manual_platform_action'`), subsequent commercial billing events (such as `invoice_paid` webhooks) **MUST NOT** automatically unsuspend or reactivate the tenant. Commercial recovery only restores access if the restriction reason was specifically `'billing_past_due'` or `'trial_expired'`.

### Firestore Security Rules
1. Client writes to `subscriptions`, `planPrices`, `billingCustomers`, and `saasBillingEvents` are rejected. Only platform admins or backend processes may mutate these records.
2. Tenant self-upgrades are completely blocked at the security rules layer.
3. `saasCheckoutSessions` may be created by `organisation_admin` strictly for their own organisation (`sameOrganisation(request.resource.data.organisationId)`).

---

## 6. User Interfaces

1. **Platform Super Admin Console** (`/platform/subscriptions`):
   - Full subscription directory, KPI counters (Active, Trialing, Past Due, Cancelled).
   - "Create Manual Subscription" modal (Trial, Manual, Complimentary).
   - Subscription detail drawer with period dates, provider tokens, and cancellation controls.
2. **Platform Plans Page** (`/platform/plans`):
   - Standard pricing display (Monthly & Annual minor unit pricing).
   - "Seed Standard Test Prices" administrative action.
3. **Organisation Billing Settings** (`/settings/billing`):
   - Dedicated customer-side subscription status view.
   - Dynamic trial countdown banner and commercial separation disclaimers.
   - Return pages at `/settings/billing/success` and `/settings/billing/cancelled` with verified status pending notices.
