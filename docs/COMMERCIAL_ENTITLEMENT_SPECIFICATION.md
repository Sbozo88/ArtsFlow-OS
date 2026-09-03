# ArtsFlow OS — Commercial Entitlement Source of Truth

**Status**: Authoritative Commercial Specification (v1.1)  
**Established**: September 2026  
**Applies to**: ArtsFlow OS SaaS Platform & School Operations

---

## 1. Commercial Pricing Overview

| Commercial Plan | Monthly Price | Annual Price (Save ~17%) | Target Market |
| :--- | :--- | :--- | :--- |
| **Starter** | **R499 / month** | **R4,990 / year** | Community arts studios, single-discipline ensembles, emerging schools |
| **Professional** | **R999 / month** | **R9,990 / year** | Multi-discipline arts academies, music conservatories, performing arts schools |

> **Commercial Positioning:**
> - **Starter**: *Manage your arts programme.*
> - **Professional**: *Run your complete arts operation.*

---

## 2. Capability Matrix: Starter vs. Professional

| ArtsFlow Capability | Starter | Professional | Technical Feature Key |
| :--- | :---: | :---: | :--- |
| **CORE PLATFORM** | | | |
| Organisation dashboard | ✅ | ✅ | `core.learners` |
| Learner management | ✅ | ✅ | `core.learners` |
| Guardian/parent records | ✅ | ✅ | `core.guardians` |
| Staff records | ✅ | ✅ | `core.staff` |
| Programmes | ✅ | ✅ | `core.programmes` |
| Groups / classes | ✅ | ✅ | `core.groups` |
| Enrolments | ✅ | ✅ | `core.enrolments` |
| Calendar | ✅ | ✅ | `core.calendar` |
| Documents & resources | ✅ | ✅ | `documents.core` |
| Follow-ups | ✅ | ✅ | `follow_ups.core` |
| Audit trail | ✅ | ✅ | `core.audit` |
| **TEACHING & ATTENDANCE** | | | |
| Sessions / lessons / rehearsals | ✅ | ✅ | `attendance.sessions` |
| Session management | ✅ | ✅ | `attendance.sessions` |
| Attendance registers | ✅ | ✅ | `attendance.registers` |
| Learner attendance history | ✅ | ✅ | `attendance.history` |
| Teacher notes | ✅ | ✅ | `attendance.notes` |
| Assessments | ✅ | ✅ | `teaching.assessments` |
| Attendance analytics | Basic | Advanced | `attendance.analytics` |
| Automated attendance interventions | — | ✅ | `attendance.interventions` |
| **MUSIC OPERATIONS** | | | |
| Music programmes | ✅ | ✅ | `music.core` |
| Ensembles | ✅ | ✅ | `music.ensembles` |
| Instrument management | ✅ | ✅ | `music.instruments` |
| Instrument assignment/history | ✅ | ✅ | `music.instruments` |
| Repertoire | ✅ | ✅ | `music.repertoire` |
| Music resources | ✅ | ✅ | `music.resources` |
| Practice tracking | ✅ | ✅ | `music.practice` |
| Music assessments | ✅ | ✅ | `music.assessments` |
| Performance preparation | ✅ | ✅ | `music.performances` |
| **DANCE OPERATIONS** | | | |
| Dance programmes | ✅ | ✅ | `dance.core` |
| Dance groups/classes | ✅ | ✅ | `dance.classes` |
| Levels | ✅ | ✅ | `dance.levels` |
| Choreography | ✅ | ✅ | `dance.choreography` |
| Dance resources | ✅ | ✅ | `dance.resources` |
| Rehearsal/practice tracking | ✅ | ✅ | `dance.practice` |
| Dance assessments | ✅ | ✅ | `dance.assessments` |
| **EVENTS & PERFORMANCES** | | | |
| Event calendar visibility | ✅ | ✅ | `events.calendar_view` |
| Full event management | — | ✅ | `events.core` |
| Event groups | — | ✅ | `events.groups` |
| Participant management | — | ✅ | `events.participants` |
| Event staff/supervisors | — | ✅ | `events.staff` |
| Performance items | — | ✅ | `events.items` |
| Event schedules | — | ✅ | `events.schedules` |
| Event attendance | — | ✅ | `events.attendance` |
| **CONSENT & FORMS** | | | |
| Basic forms | ✅ | ✅ | `consent.basic` |
| Digital consent requests | — | ✅ | `consent.requests` |
| Consent response tracking | — | ✅ | `consent.tracking` |
| Outstanding consent monitoring | — | ✅ | `consent.monitoring` |
| Event-linked consent | — | ✅ | `consent.event_linked` |
| **TRANSPORT** | | | |
| Transport management | — | ✅ | `transport.core` |
| Event transport planning | — | ✅ | `transport.planning` |
| Passenger/learner allocation | — | ✅ | `transport.passengers` |
| Supervisor allocation | — | ✅ | `transport.supervisors` |
| Transport records | — | ✅ | `transport.records` |
| **SCHOOL FINANCE** | | | |
| Learner charges | ✅ | ✅ | `finance.charges` |
| Invoices | ✅ | ✅ | `finance.invoices` |
| Payment recording | ✅ | ✅ | `finance.payments` |
| Outstanding balances | ✅ | ✅ | `finance.balances` |
| Basic finance reports | ✅ | ✅ | `finance.reporting_basic` |
| Payment allocations | Basic | ✅ | `finance.allocations` |
| Finance reconciliation | — | ✅ | `finance.reconciliation` |
| Advanced finance reporting | — | ✅ | `finance.reporting_advanced` |
| Advanced outstanding-account management | — | ✅ | `finance.debt_management` |
| **PARENT / GUARDIAN PORTAL** | | | |
| Guardian login | ✅ | ✅ | `guardian_portal.auth` |
| Learner information | ✅ | ✅ | `guardian_portal.learners` |
| Schedules | ✅ | ✅ | `guardian_portal.schedule` |
| Attendance visibility | ✅ | ✅ | `guardian_portal.attendance` |
| Resources/documents | ✅ | ✅ | `guardian_portal.resources` |
| Progress/assessment visibility | ✅ | ✅ | `guardian_portal.progress` |
| Finance visibility | ✅ | ✅ | `guardian_portal.finance` |
| Consent actions | — | ✅ | `guardian_portal.consent` |
| **COMMUNICATION** | | | |
| Operational follow-ups | ✅ | ✅ | `communication.follow_ups` |
| Individual parent communication workflow | ✅ | ✅ | `communication.direct` |
| Targeted group communication | — | ✅ | `communication.groups` |
| Bulk communication | — | ✅ | `communication.bulk` |
| Communication history | Basic | ✅ | `communication.history` |
| Automated reminders | — | ✅ | `communication.automated` |
| **STAFF OPERATIONS** | | | |
| Staff profiles | ✅ | ✅ | `staff.profiles` |
| Teacher/group assignment | ✅ | ✅ | `staff.assignments` |
| Staff scheduling | Basic | ✅ | `staff.scheduling` |
| Timesheets | — | ✅ | `staff.timesheets` |
| Substitutions | — | ✅ | `staff.substitutions` |
| Staff payment preparation | — | ✅ | `staff.payroll_prep` |
| Staff operational reports | — | ✅ | `staff.reports` |
| **REPORTING & ANALYTICS** | | | |
| Basic dashboard KPIs | ✅ | ✅ | `analytics.dashboard` |
| Learner reports | ✅ | ✅ | `analytics.learners` |
| Attendance reports | ✅ | ✅ | `analytics.attendance` |
| Programme reports | Basic | ✅ | `analytics.programmes` |
| Finance analytics | — | ✅ | `analytics.finance` |
| Attendance trends | — | ✅ | `analytics.trends` |
| Management analytics | — | ✅ | `analytics.management` |
| Cross-programme analytics | — | ✅ | `analytics.cross_programme` |
| Advanced exports | — | ✅ | `analytics.exports` |
| **AUTOMATION** | | | |
| Manual follow-up creation | ✅ | ✅ | `automation.manual` |
| Automated follow-up rules | — | ✅ | `automation.follow_up_rules` |
| Attendance triggers | — | ✅ | `automation.attendance_triggers` |
| Payment triggers | — | ✅ | `automation.payment_triggers` |
| Consent reminders | — | ✅ | `automation.consent_reminders` |
| Operational alerts | — | ✅ | `automation.operational_alerts` |
| ArtsFlow automation engine | — | ✅ | `automation.core` |
| **ORGANISATION & ACCESS** | | | |
| Organisation users | ✅ | ✅ | `org.users` |
| Role-based access | ✅ | ✅ | `org.rbac` |
| Teacher access | ✅ | ✅ | `org.roles.teacher` |
| Finance role | ✅ | ✅ | `org.roles.finance` |
| Programme director role | ✅ | ✅ | `org.roles.director` |
| Multiple organisation membership | ✅ | ✅ | `org.multi_membership` |
| Organisation switching | ✅ | ✅ | `org.switching` |
| Custom organisation branding | Basic | ✅ | `org.branding` |
| **SUPPORT** | | | |
| Self-service onboarding | ✅ | ✅ | `support.self_service` |
| Help documentation | ✅ | ✅ | `support.docs` |
| Standard support | ✅ | ✅ | `support.standard` |
| Guided onboarding | — | ✅ | `support.guided_onboarding` |
| Priority support | — | ✅ | `support.priority` |
| Standard spreadsheet migration assistance | — | ✅ | `support.migration_assist` |

---

## 3. Usage Entitlements & Numeric Limits

| Limit | Starter | Professional | Internal Fair-Use Guard |
| :--- | :---: | :---: | :---: |
| **Active learners** | **100** | **500** | Hard cap at tier limit |
| **Staff / users** | **10** | **50** | Hard cap at tier limit |
| **Organisation admins** | **2** | **10** | Hard cap at tier limit |
| **Guardians** | Within learner limit | Within learner limit | Derived from active learners |
| **Programmes** | **5** | **Unlimited\*** | 50 (Fair use) |
| **Groups / classes / ensembles** | **15** | **Unlimited\*** | 150 (Fair use) |
| **Locations** | **1** | **5** | Hard cap at tier limit |
| **Storage** | **5 GB** (5,120 MB) | **25 GB** (25,600 MB) | Monitored via storage meter |
| **Monthly communications** | **200** | **2,000** | Resets every billing period |
| **Automation runs** | **0** (Disabled) | **1,000** | Resets every billing period |

---

## 4. Fundamental Commercial Adjustments

1. **No Separate Surcharge or Wall for Music vs Dance**:
   - Both Music and Dance modules are enabled in **Starter**.
   - ArtsFlow's identity is **arts operations**. An institution running both a choir/orchestra and a dance troupe should not be forced into a higher tier simply because they teach multiple art forms.
2. **Operational Sophistication Boundary**:
   - Starter provides essential day-to-day class registers, learners, tuition invoicing, and parent visibility.
   - Professional provides logistics (Event production, Transport coordination, Digital Consent tracking), Staff Operations (timesheets, substitutions), Automation engine, and Deep Financial Reconciliation.

---

## 5. Upgrade Triggers & Capacity Enforcement

### Thresholds:
- **At 80% Capacity**: Contextual banner notification: *"You're approaching your limit (e.g. 80 of 100 learners)."*
- **At 90% Capacity**: Stronger upgrade recommendation in dashboard and relevant module headers.
- **At 100% Capacity**: Prevent creation of additional limit-consuming records (e.g. creating learner 101 or inviting staff member 11).

### Critical Data Safety Guarantee:
- Reaching a capacity limit **never locks customers or staff out of their existing data**.
- Read access, attendance capture, and tuition fee collection remain 100% operational for existing records.

---

## 6. End-to-End Alignment Architecture

The commercial model is enforced across six interconnected architectural layers:

```text
1. MARKETING
   Starter vs Professional comparison & value proposition
             ↓
2. COMMERCIAL CONFIGURATION
   subscriptionPlans + planEntitlements in Firestore / registry
             ↓
3. APPLICATION RESOLUTION
   EntitlementResolverService (cached, tenant-scoped)
             ↓
4. CLIENT & API ENFORCEMENT
   FeatureRoute + FeatureGate + Service mutation checks
             ↓
5. USAGE METERING
   Real-time counters & periodic synchronization
             ↓
6. UPGRADE & COMMERCE
   Self-service upgrade prompts into Paystack/Billing checkout
```
