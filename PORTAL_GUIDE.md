# ArtsFlow OS — Portal User & Access Guide

This guide covers the current **Guardian Portal** and learner-account isolation in **ArtsFlow OS v1.0**.

---

## 1. Overview & Security Isolation

ArtsFlow OS currently provides a guardian interface and a learner access boundary:

1. **Guardian Portal** (`/portal`): Designed for parents, guardians, and fee-payers to oversee their children's arts education.
2. **Learner Access Notice** (`/learner-portal`): Prevents learner identities from entering the internal administration workspace. Full learner self-service is a post-v1.0 roadmap item.

### Security Guarantees
- **Guardian Privacy Gate**: Production release requires emulator-backed verification that a guardian can see only explicitly linked learners. Until that gate passes, the portal must not be promoted as production-ready.
- **Learner Protection**: Students cannot see guardian billing information, debt reminders, or private staff correspondence.

---

## 2. Guardian Portal Workflows

### Invitation & First-Time Login
1. Staff issue an invitation from the student's profile.
2. The guardian receives an invitation link (`/portal/invite/:token`).
3. The guardian creates or signs into a Firebase Authentication account.
4. Subsequent logins occur at `/portal/login`.

### Dashboard & Navigation
- **Students Overview** (`/portal/learners`): Switch between multiple enrolled children in the same family.
- **Attendance Records** (`/portal/attendance`): View attendance records, percentage compliance, and absence reasons.
- **Concert & Event Consent** (`/portal/consent`): Review upcoming excursions and digitally sign legal consent forms directly on mobile or desktop.
- **Transport Tracking** (`/portal/transport`): View scheduled bus departures, assigned vehicles, and passenger manifests.
- **Invoices** (`/portal/finance`): Inspect authorised invoice and receipt records. No online payment gateway is configured.
- **Documents & Messages** (`/portal/documents`, `/portal/messages`): Access academic certificates, rehearsal schedules, and academy announcements.

---

## 3. Learner Accounts

Learner identities are routed to `/learner-portal`, which currently provides an access notice and sign-out action only. They cannot render internal or guardian routes. Schedule, practice, repertoire, and assessment self-service remain future enhancements.

---

## 4. Portal Troubleshooting

| Issue | Likely Cause | Resolution |
| :--- | :--- | :--- |
| **"Invalid or Expired Invitation Token"** | Link has expired (valid 7 days) or was already accepted. | Request an administrator re-send the invitation from the Learner Profile page. |
| **"No Linked Learners Found"** | Guardian account is not mapped in `learnerGuardians`. | Administrator must verify that the guardian's email matches the linked guardian record. |
| **"Portal Access Disabled"** | Academy administrator has toggled off portal access for the organisation. | Administrator must enable "Guardian Portal Enabled" in **Settings → Portal Settings**. |
| **"Unable to Submit Consent"** | Consent deadline has passed or legal guardian flag not checked. | Verify that the submission occurs before the event deadline and all mandatory checkboxes are confirmed. |
